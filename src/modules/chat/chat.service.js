const Match   = require('../../models/Match');
const Message = require('../../models/Message');
const User    = require('../../models/User');

// helper — verify two users have an active match
// returns the match document if valid, throws if not
const verifyMatch = async (userId, otherUserId) => {
  const match = await Match.findOne({
    $or: [
      { user1_id: userId,      user2_id: otherUserId },
      { user1_id: otherUserId, user2_id: userId      }
    ],
    is_active: true
  });

  if (!match) {
    throw new Error('You can only chat with your matches');
  }

  return match;
};

// helper — verify the other user is not blocked
const verifyNotBlocked = async (otherUserId) => {
  const otherUser = await User.findById(otherUserId).select('is_blocked name');

  if (!otherUser) {
    throw new Error('User not found');
  }

  if (otherUser.is_blocked) {
    throw new Error('This user is no longer available');
  }

  return otherUser;
};

// ─────────────────────────────────────────
// POST /chat/send
// ─────────────────────────────────────────
const sendMessage = async (senderId, receiverId, content) => {

  // check receiver exists and not blocked
  await verifyNotBlocked(receiverId);

  // check they are matched
  const match = await verifyMatch(senderId, receiverId);

  // validate content
  if (!content || content.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (content.trim().length > 1000) {
    throw new Error('Message too long. Maximum 1000 characters.');
  }

  // save message
  const message = await Message.create({
    match_id:    match._id,
    sender_id:   senderId,
    receiver_id: receiverId,
    content:     content.trim()
  });

  return {
    message_id:  message._id,
    match_id:    message.match_id,
    sender_id:   message.sender_id,
    receiver_id: message.receiver_id,
    content:     message.content,
    is_read:     message.is_read,
    sent_at:     message.createdAt
  };
};

// ─────────────────────────────────────────
// GET /chat/messages/:userId
// get full conversation between current user and another user
// ─────────────────────────────────────────
const getMessages = async (currentUserId, otherUserId, page = 1, limit = 20) => {

  // verify they are matched
  const match = await verifyMatch(currentUserId, otherUserId);

  const skip = (page - 1) * limit;

  // fetch messages newest first, then reverse for chronological display
  const messages = await Message.find({ match_id: match._id })
    .sort({ createdAt: -1 })   // newest first for pagination
    .skip(skip)
    .limit(limit)
    .select('sender_id receiver_id content is_read createdAt');

  // mark unread messages as read (messages sent TO current user)
  const unreadIds = messages
    .filter(m =>
      m.receiver_id.toString() === currentUserId.toString() &&
      !m.is_read
    )
    .map(m => m._id);

  if (unreadIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: unreadIds } },
      { $set: { is_read: true } }
    );
  }

  // reverse so oldest messages appear first (natural chat order)
  const ordered = [...messages].reverse();

  return {
    match_id: match._id,
    messages: ordered,
    pagination: {
      page:    parseInt(page),
      limit:   parseInt(limit),
      hasMore: messages.length === limit
    }
  };
};

// ─────────────────────────────────────────
// GET /chat/conversations
// get all conversations (last message preview per match)
// ─────────────────────────────────────────
const getConversations = async (userId) => {

  // get all active matches for this user
  const matches = await Match.find({
    $or: [
      { user1_id: userId },
      { user2_id: userId }
    ],
    is_active: true
  });

  if (matches.length === 0) {
    return [];
  }

  // for each match, get the last message + other user's info
  const conversations = await Promise.all(
    matches.map(async (match) => {

      // figure out who the other person is
      const otherUserId =
        match.user1_id.toString() === userId.toString()
          ? match.user2_id
          : match.user1_id;

      // get other user's basic info
      const otherUser = await User.findById(otherUserId)
        .select('name photos is_blocked');

      // get last message in this thread
      const lastMessage = await Message.findOne({ match_id: match._id })
        .sort({ createdAt: -1 })
        .select('content sender_id is_read createdAt');

      // count unread messages for current user
      const unreadCount = await Message.countDocuments({
        match_id:    match._id,
        receiver_id: userId,
        is_read:     false
      });

      return {
        match_id:     match._id,
        other_user: {
          id:         otherUser._id,
          name:       otherUser.name,
          photo:      otherUser.photos[0] || null,
          is_blocked: otherUser.is_blocked
        },
        last_message: lastMessage
          ? {
              content:    lastMessage.content,
              sent_by_me: lastMessage.sender_id.toString() === userId.toString(),
              is_read:    lastMessage.is_read,
              sent_at:    lastMessage.createdAt
            }
          : null,
        unread_count: unreadCount,
        matched_at:   match.createdAt
      };
    })
  );

  // sort by most recent message first
  return conversations.sort((a, b) => {
    const aTime = a.last_message?.sent_at || a.matched_at;
    const bTime = b.last_message?.sent_at || b.matched_at;
    return new Date(bTime) - new Date(aTime);
  });
};

// ─────────────────────────────────────────
// DELETE /chat/unmatch/:matchId
// unmatch — deactivates match and hides chat
// ─────────────────────────────────────────
const unmatch = async (userId, matchId) => {

  const match = await Match.findById(matchId);

  if (!match) throw new Error('Match not found');

  // verify this user is part of the match
  const isPartOfMatch =
    match.user1_id.toString() === userId.toString() ||
    match.user2_id.toString() === userId.toString();

  if (!isPartOfMatch) {
    throw new Error('You are not part of this match');
  }

  if (!match.is_active) {
    throw new Error('This match is already inactive');
  }

  match.is_active = false;
  await match.save();

  return { match_id: matchId, is_active: false };
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  unmatch
};
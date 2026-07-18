module.exports = {
  verifyToken: async (idToken) => {
    return {
      uid: idToken,  
      email: null
    };
  }
};
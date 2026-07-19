const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Dating App API',
      version:     '1.0.0',
      description: 'Beta REST API for Dating App — Week 1'
    },
    servers: [
      { url: 'http://localhost:5000/api' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',      description: 'Login and token refresh'    },
      { name: 'Users',     description: 'Profile and onboarding'     },
      { name: 'Media',     description: 'Photo and KYC uploads'      },
      { name: 'Admin',     description: 'User moderation'            },
      { name: 'Discovery', description: 'Swipe feed and matching'    },
      { name: 'Chat',      description: 'Messaging between matches'  }
    ],
    paths: {
      '/auth/google': {
        post: {
          tags:    ['Auth'],
          summary: 'Login with Google',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type:     'object',
                  required: ['firebase_uid', 'email'],
                  properties: {
                    firebase_uid: { type: 'string', example: 'abc123' },
                    email:        { type: 'string', example: 'user@gmail.com' },
                    name:         { type: 'string', example: 'Sahil Kumar' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful, returns JWT tokens' },
            400: { description: 'Missing required fields'              },
            500: { description: 'Server error'                         }
          }
        }
      },
      '/auth/refresh-token': {
        post: {
          tags:    ['Auth'],
          summary: 'Refresh access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'New access token issued' },
            401: { description: 'Invalid or expired refresh token' }
          }
        }
      },
      '/users/me': {
        get: {
          tags:     ['Users'],
          summary:  'Get my profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'User profile returned' },
            401: { description: 'Unauthorized'          }
          }
        },
        put: {
          tags:     ['Users'],
          summary:  'Update profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name:        { type: 'string'  },
                    dob:         { type: 'string', example: '1998-06-20' },
                    gender:      { type: 'string', enum: ['male','female','other'] },
                    gender_pref: { type: 'string', enum: ['male','female','both']  },
                    bio:         { type: 'string'  }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Profile updated' },
            400: { description: 'Validation error' }
          }
        }
      },
      '/users/location': {
        post: {
          tags:     ['Users'],
          summary:  'Update location',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    longitude: { type: 'number', example: 73.8567 },
                    latitude:  { type: 'number', example: 18.5204 }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Location updated' } }
        }
      },
      '/users/interests': {
        post: {
          tags:     ['Users'],
          summary:  'Update interests',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    interests: {
                      type:    'array',
                      items:   { type: 'string' },
                      example: ['hiking', 'music']
                    }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Interests updated' } }
        }
      },
      '/media/upload-photo': {
        post: {
          tags:     ['Media'],
          summary:  'Upload a photo (max 9)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    photo: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Photo uploaded to S3' },
            400: { description: 'Invalid file or max photos reached' }
          }
        }
      },
      '/media/upload-kyc': {
        post: {
          tags:     ['Media'],
          summary:  'Upload KYC document',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    kyc: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'KYC uploaded, status set to UNDER_REVIEW' } }
        }
      },
      '/discovery': {
        get: {
          tags:     ['Discovery'],
          summary:  'Get swipe feed',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page',  in: 'query', schema: { type: 'integer', default: 1  } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: { description: 'List of profiles to swipe on' },
            403: { description: 'User not approved or missing photo/KYC' }
          }
        }
      },
      '/discovery/swipe': {
        post: {
          tags:     ['Discovery'],
          summary:  'Swipe LIKE or DISLIKE',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    swiped_user_id: { type: 'string' },
                    direction:      { type: 'string', enum: ['LIKE','DISLIKE'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Swipe recorded. Match detected if mutual.' },
            400: { description: 'Duplicate swipe or self swipe' }
          }
        }
      },
      '/discovery/matches': {
        get: {
          tags:     ['Discovery'],
          summary:  'Get all my matches',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of matches' } }
        }
      },
      '/chat/send': {
        post: {
          tags:     ['Chat'],
          summary:  'Send a message',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    receiver_id: { type: 'string' },
                    content:     { type: 'string', example: 'Hey!' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Message sent'                       },
            400: { description: 'Not matched or empty message'       }
          }
        }
      },
      '/chat/messages/{userId}': {
        get: {
          tags:     ['Chat'],
          summary:  'Get conversation with a user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path',  required: true, schema: { type: 'string' } },
            { name: 'page',   in: 'query', schema: { type: 'integer', default: 1   } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20  } }
          ],
          responses: { 200: { description: 'Paginated message history' } }
        }
      },
      '/chat/conversations': {
        get: {
          tags:     ['Chat'],
          summary:  'Get all conversations',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'All chat threads with last message preview' } }
        }
      },
      '/admin/users': {
        get: {
          tags:     ['Admin'],
          summary:  'Get users by status',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING','UNDER_REVIEW','APPROVED','REJECTED'] } },
            { name: 'page',   in: 'query', schema: { type: 'integer', default: 1  } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: { 200: { description: 'Paginated user list' } }
        }
      },
      '/admin/users/{id}/approve': {
        post: {
          tags:     ['Admin'],
          summary:  'Approve a user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'User approved' } }
        }
      },
      '/admin/users/{id}/reject': {
        post: {
          tags:     ['Admin'],
          summary:  'Reject a user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason:  { type: 'string', enum: ['FAKE_PHOTO','INAPPROPRIATE_CONTENT','INVALID_KYC_DOCUMENT','APPEARS_UNDERAGE','DUPLICATE_ACCOUNT','INCOMPLETE_PROFILE','OTHER'] },
                    remarks: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'User rejected and blocked' } }
        }
      }
    }
  },
  apis: []
};

module.exports = swaggerJsdoc(options);
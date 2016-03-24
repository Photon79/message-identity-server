const axios = require('axios');
const get = axios.get;
const vggApiHost = require('../config').api.host;

function atob(encodedString) {
  return new Buffer(encodedString, 'base64').toString('utf8');
}

function checkVggApiAuthorization(req, entityType, entityId) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return Promise.reject({
      status: 403,
      errors: [ "Authorization header isn't present" ],
    });
  }

  const props = {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/hal+json',
      'Content-Type': 'application/json',
    },
  };
  return get(`${vggApiHost}/applications`, props)
    .then(function(result) {
      const parsedAuthorization = atob(authHeader.split(' ')[1]).split(':');
      return {
        userId: parsedAuthorization[0],
        password: parsedAuthorization[1]
      };
    }, function(errorResponse) {
      return Promise.reject({
        status: errorResponse.status,
        messages: errorResponse.data._embedded.errors.map(error => error.message),
      });
    });
}

module.exports = function(app, layer) {
  app.get('/conversations', function(req, res) {
    checkVggApiAuthorization(req)
      .then(result => {
        const userId = result.userId;
        return layer.conversations.getAllFromUserAsync(userId)
          .then(function(result) {
            return res.status(result.status).json(result.body);
          }, function(err) {
            return res.status(err.status).json(err.body);
          });
      }, (error => res.status(error.status).json({ messages: error.messages })));
  });

  app.post('/conversations/:entityType/:entityId', function(req, res) {
    const entityId = req.params.entityId;
    const entityType = req.params.entityType;
    checkVggApiAuthorization(req, entityId, entityType)
      .then(result => {
        const userId = result.userId;
        const payload = {
          distinct: true,
          participants: [ userId ],
          metadata: {
            entity_id: entityId,
            entity_type: entityType,
          },
        };
        layer.conversations.createAsync(payload)
          .then(result => {
            return layer.messages.sendTextFromUserAsync(result.body.id, userId, req.body.message);
          })
          .then(function(result) {
            res.status(result.status).json(result.body);
          }, function(err) {
            res.status(err.status).json(err.body);
          });
      }, (error => res.status(error.status).json({ messages: error.messages })));
  });
};

const axios = require('axios');
const get = axios.get;
const vggApiHost = require('../config').api.host;
const layerConversationSerializer = require('../serializers/layer-conversation');
const layerMessageSerializer = require('../serializers/layer-message');

function atob(encodedString) {
  return new Buffer(encodedString, 'base64').toString('utf8');
}

function generateVggAuthorizationError(res) {
  return (response) => {
    res.status(response.errors[0].status).json(response);
  };
}

function checkVggApiAuthorization(req, entityType, entityId) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return Promise.reject({
      errors: [{
        status: 403,
        detail: "Authorization header isn't present",
      }],
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
    .then((result) => {
      const parsedAuthorization = atob(authHeader.split(' ')[1]).split(':');
      return {
        userId: parsedAuthorization[0],
        password: parsedAuthorization[1]
      };
    }, (errorResponse) => {
      const errors = errorResponse.data._embedded.errors;
      return Promise.reject({
        errors: errors.map(error => {
          return {
            status: errorResponse.status,
            detail: error.message,
          };
        }),
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
            res.status(200).json({
              data: result.body.map(layerConversationSerializer),
            });
          }, function(err) {
            res.status(err.status).json(err.body);
          });
      }, generateVggAuthorizationError(res));
  });

  app.get('/conversations/:conversationId/messages', function(req, res) {
    const conversationId = req.params.conversationId;
    checkVggApiAuthorization(req)
      .then(vggResult => {
        layer.messages
          .getAllAsync(conversationId, {
            page_size: 50,
            sort_by: 'last_message'
          })
          .then(function(result) {
            res.status(result.status).json({
              data: result.body.map(layerMessageSerializer),
            });
          }, function(err) {
            res.status(err.status).json(err.body);
          });
      }, generateVggAuthorizationError(res));
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
            res.status(result.status).json({
              data: layerMessageSerializer(result.body),
            });
          }, function(err) {
            res.status(err.status).json(err.body);
          });
      }, generateVggAuthorizationError(res));
  });
};

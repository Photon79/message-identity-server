const layerMessageSerializer = require('../serializers/layer-message');
const Utils = require('../utils');

module.exports = function(app, layer, models) {
  app.get('/messages', function(req, res) {
    const conversationId = req.query.conversation;
    const from_id = req.query.last_id;
    const limit = req.query.limit || 20;

    Utils.checkVggApiAuthorization(req)
      .then(vggResult => {
        const params = { page_size: limit };

        if (from_id) {
          params['from_id'] = from_id;
        }

        layer.messages
          .getAllAsync(conversationId, params)
          .then(function(result) {
            console.log(result);

            res.status(result.status).json({
              data: result.body.map(layerMessageSerializer),

              meta: {
                count: result.headers['layer-count'],
                last_id: from_id || false,
                limit: limit,
              }
            });
          }, function(err) {
            res.status(err.status).json(err.body);
          });
      }).catch(Utils.generateVggAuthorizationError(res));
  });

  app.post('/messages', function(req, res) {
    Utils.checkVggApiAuthorization(req)
      .then(result => {
        const conversationId = req.body.conversation;
        const userId = result.userId;
        const parts = req.body.parts;

        layer.messages.sendAsync(conversationId, {
          sender: {
            user_id: userId
          },
          parts: parts
        }).then(function(result) {
          res.status(result.status).json({
            data: layerMessageSerializer(result.body),
          });
        }).catch(function(err) {
          res.status(err.status).json(err.body);
        });
      }).catch(Utils.generateVggAuthorizationError(res));
  });
};

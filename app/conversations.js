const axios = require('axios');
const layerConversationSerializer = require('../serializers/layer-conversation');
const Utils = require('../utils');

module.exports = (app, layer, models) => {
  app.get('/conversations', (req, res) => {
    const offset = req.query.offset || 0;
    const limit = req.query.limit || 20;
    const type = req.query.type || 'inbox';

    Utils.checkVggApiAuthorization(req)
      .then(result => {
        const userId = result.userId;
        var params = {
          participants: userId,
          sender: {
            $ne: userId
          }
        };

        if (type == 'sent') {
          params = { sender: userId };
        }

        models.Conversation.count(params).then(count => {
          models.Conversation
            .find(params)
            .limit(limit)
            .sort({created_at: -1})
            .skip(offset)
            .exec(function(err, docs) {
              if (err) {
                return res.status(500).json(err);
              }

              res.status(200).json({
                data: docs,
                _links: Utils.getConversationLinks('/conversations', {
                  count: count,
                  limit: limit,
                  offset: offset,
                }),

                meta: {
                  count: count,
                  limit: limit,
                  offset: offset,
                }
              });
            });
        });

        // const params = {
        //   page_size: limit,
        //   sort_by: 'last_message'
        // };

        // if (from_id) {
        //   params['from_id'] = from_id;
        // }

        // return layer.conversations.getAllFromUserAsync(userId, params)
        //   .then(function(result) {
        //     res.status(200).json({
        //       data: result.body.map(layerConversationSerializer),
        //     });
        //   }, function(err) {
        //     res.status(err.status).json(err.body);
        //   });
      }).catch(Utils.generateVggAuthorizationError(res));
  });

  app.get('/conversations/:cid', (req, res) => {
    Utils.checkVggApiAuthorization(req, entityId, entityType)
      .then(result => {

        // models.Conversation
        //   .find({
        //     conversation_id: req.params.cid
        //   }).then(conversation => {
        //     res.status(200).json({ data: conversation });
        //   }).catch(err => {
        //     return res.status(500).json(err);
        //   });

        layer.conversations.getAsync(req.params.cid)
          .then((result) => {
            res.status(200).json({
              data: layerConversationSerializer(result.body),
            });
          }).catch((err) => {
            res.status(err.status).json(err.body);
          });
      }).catch(Utils.generateVggAuthorizationError(res));
  });

  app.post('/conversations', (req, res) => {
    const entityId = req.body.entityId;
    const entityType = req.body.entityType;
    const subject = req.body.subject;
    var participants = req.body.participants;

    Utils.checkVggApiAuthorization(req, entityId, entityType)
      .then(result => {
        const userId = result.userId;
        participants.push(userId);
        participants = Utils.arrUniq(participants);

        const payload = {
          participants: participants,
          metadata: {
            entity_id: entityId,
            entity_type: entityType,
            sender: userId,
          },
        };

        layer.conversations.createAsync(payload)
          .then(result => {
            conversation = new models.Conversation({
              conversation_id: result.body.id,
              isRead: false,
              participants: participants,
              sender: userId,
              subject: subject,
            });
            conversation.save().then(() => {
              res.status(result.status).json(layerConversationSerializer(result.body));
            });
          })
          .catch((err) => {
            res.status(err.status).json(err.body);
          });
      }).catch(Utils.generateVggAuthorizationError(res));
  });

  app.post('/conversations/:cid/files', (req, res) => {
    if (!req.files || !req.files[0]) {
      return res.status(500).json({
        message: 'No uploaded file'
      });
    }

    Utils.checkVggApiAuthorization(req)
      .then(result => {
        const file = req.files[0];

        layer.conversations
          .uploadAsync(req.params.cid, file, req.headers.origin)
          .then((result) => {
            const data = result.body;

            res.status(result.status).json({
              content: {
                id: data.id,
                size: data.size
              },
              mime_type: file.mimetype
            });
          })
          .catch((err) => {
            res.status(500).json(err);
          });
      })
      .catch(Utils.generateVggAuthorizationError(res));
  });
}

require('es6-promise').polyfill()

denodeify = require 'denodeify'
request = require 'request'
{ checkAuth, getUploadURL } = require('../utils')

put = denodeify request.put

module.exports = (app, layer, config)->
  app.post '/conversations/:cid/uploads', (req, res)->
    unless req.headers.authorization?
      return res.status(403).json
        message: "Authorization header isn't present"

    checkAuth(config, req.headers.authorization).then (result)->
      unless result
        return res.status(403).json
          message: 'Authorization is incorrect'

      file = req.files[0]

      getUploadURL(config, req.headers.origin, req.params.cid, file).then (result)->
        data = JSON.parse result.body

        put(data.upload_url,
          body: file.buffer
        ).then (uploadResult)->
          res.status(result.statusCode).json
            content:
              id: data.id
              size: data.size
            mime_type: file.mimetype

  app.post '/conversations/:entity_type/:entity_id', (req, res)->
    unless req.headers.authorization?
      return res.status(403).json
        message: "Authorization header isn't present"

    checkAuth(config, req.headers.authorization).then (userId)->
      unless userId
        return res.status(403).json
          message: 'Authorization is incorrect'

      unless req.body.users?
        return res.status(500).json
          message: "Required field 'users' isn't present in payload"

      payload =
        distinct: yes

        metadata:
          entity_id: req.params.entity_id
          entity_type: req.params.entity_type

        participants: req.body.users.concat [userId]

      layer.conversations
        .createAsync payload
        .then (result)-> result.body.id
        .then (conversation_id)->
          messagePayload =
            parts: req.body.parts
            sender:
              user_id: userId

          layer.messages.sendAsync conversation_id, messagePayload
        .then (result)-> res.status(result.status).json result.body
        .catch (err)-> res.status(err.status).json err.body

  app.get '/conversations', (req, res)->
    unless req.headers.authorization?
      return res.status(401).json
        message: "Authorization header isn't present"

    checkAuth(config, req.headers.authorization).then (result)->
      unless result
        return res.status(403).json
          message: 'Authorization is incorrect'

      layer.conversations
        .getAllFromUserAsync req.query.user_id
        .then (result)-> res.status(result.status).json result.body
        .catch (err)-> res.status(err.status).json err.body

  app.get '/conversations/:cid/messages', (req, res)->
    unless req.headers.authorization?
      return res.status(403).json
        message: "Authorization header isn't present"

    checkAuth(config, req.headers.authorization).then (result)->
      unless result
        return res.status(403).json
          message: 'Authorization is incorrect'

      params =
        sort_by: 'last_message'

      layer.messages
        .getAllAsync req.params.conversation_id, params
        .then (result)-> res.status(result.status).json result.body
        .catch (err)-> res.status(err.status).json err.body

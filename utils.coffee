require('es6-promise').polyfill()

denodeify = require 'denodeify'
request = require 'request'

get = denodeify request.get
post = denodeify request.post

module.exports =
  getUploadURL: (config, origin, cid, file)->
    app_uuid = config.layer.app_id.split('/').slice(-1)[0]
    url = [
      config.layer.server_url,
      'apps',
      app_uuid,
      'conversations',
      cid,
      'content'
    ]

    post url.join('/'),
      headers:
        'Accept': 'application/vnd.layer+json; version=1.1'
        'Authorization': "Bearer #{config.layer.api_token}"
        'Content-Type': 'application/json'
        'Upload-Content-Type': file.mimetype
        'Upload-Content-Length': file.size
        'Upload-Origin': origin

  checkAuth: (config, authHeader)->
    get("#{config.vgg.api_url}/applications",
      headers:
        'Authorization': authHeader
        'Accept': 'application/hal+json'
        'Content-Type': 'application/json'
    ).then (result)->
      unless result.statusCode is 200
        return no

      new Buffer(authHeader.split(' ')[1], 'base64').toString('utf8').split(':')[0]

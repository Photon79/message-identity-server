bodyParser = require 'body-parser'
express = require 'express'
LayerAPI = require 'layer-api'
multer = require 'multer'
yaml = require 'parser-yaml'
config = yaml.parseFileSync 'config.yml'
app = express()

app.use bodyParser.json()
app.use bodyParser.urlencoded
  extended: false

layerAppId = config.layer.app_id
layerToken = config.layer.api_token

layer = new LayerAPI
  appId: layerAppId
  token: layerToken

storage = multer.memoryStorage()
app.use multer(
  storage: storage
).any()

app.get '/', (req, res)->
  res.send 'Welcome to the sample backend for messaging system using Layer'

require('./app/messages')(app, layer, config)

port = process.env.PORT or 3000

app.listen port, ()->
  console.log 'Express server running on localhost:%d', port

const bodyParser = require('body-parser');
const express = require('express');
const LayerAPI = require('layer-api');
const multer = require('multer');
const config = require('./config');
const cors   = require('./cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

storage = multer.memoryStorage();
app.use(multer({ storage: storage }).any());

const layer = new LayerAPI(config.layer);

app.get('/', (req, res) => {
  res.send('Welcome to the sample backend for messaging system using Layer');
});

const connectStr = `mongodb://${config.mongodb.user}:${config.mongodb.pass}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`;
mongoose.connect(connectStr);

const models = require('./models')(mongoose);

require('./app/conversations')(app, layer, models);
require('./app/messages')(app, layer, models);

const port = config.server.port;
app.listen(port, () => {
  console.log('Express server running on localhost:%d', port);
});

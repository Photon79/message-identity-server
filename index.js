const bodyParser = require('body-parser');
const express = require('express');
const LayerAPI = require('layer-api');
const config = require('./config');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const layer = new LayerAPI(config.layer);

app.get('/', (req, res) => {
  res.send('Welcome to the sample backend for messaging system using Layer');
});

require('./app/messages')(app, layer, config);

const port = config.server.port
app.listen(port, () => {
  console.log('Express server running on localhost:%d', port);
});

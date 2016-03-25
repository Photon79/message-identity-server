module.exports = {
  server: {
    port: process.env.PORT || 3000,
  },
  layer: {
    host: 'https://api.layer.com',
    token: process.env.LAYER_API_TOKEN || 'a8YBCeseirqVK13rZJrzNoaFlp6qXKUX8jyqANa0rTVDhXs6',
    appId: process.env.LAYER_APP_ID || 'layer:///apps/staging/efbcf08c-d6ea-11e5-aaf6-b68b07004518',
  },
  api: {
    host: 'https://api-test.payline.io',
  },
  mongodb: {
    db: 'vgg-conversations',
    host: 'ds028559.mlab.com',
    pass: 'test',
    port: 28559,
    user: 'test',
  }
};

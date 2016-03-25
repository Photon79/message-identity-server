const axios = require('axios');
const get = axios.get;
const post = axios.post;
const config = require('./config');

function atob(encodedString) {
  return new Buffer(encodedString, 'base64').toString('utf8');
}

module.exports = {
  arrUniq: (arr) => { return [...new Set(arr)]; },

  checkVggApiAuthorization: (req, entityType, entityId) => {
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

    return get(`${config.api.host}/applications`, props)
      .then((result) => {
        const parsedAuthorization = atob(authHeader.split(' ')[1]).split(':');

        return {
          userId: parsedAuthorization[0],
          password: parsedAuthorization[1]
        };
      }).catch((errorResponse) => {
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
  },

  generateVggAuthorizationError: (res) => {
    return (response) => {
      res.status(response.errors[0].status).json(response);
    };
  },

  getLinks: (urlPrefix, offset, limit, count) => {
    const links = {
      self: {
        href: `${urlPrefix}?limit=${limit}&offset=${offset}`
      }
    };

    if (offset > 0) {
      var prev = offset - limit;
      if (prev < 0) {
        prev = 0;
      }
      links['prev'] = {
        href: `${urlPrefix}?limit=${limit}&offset=${prev}`
      };
    }

    if (offset + limit < count) {
      const next = offset + limit;

      links['next'] = {
        href: `${urlPrefix}?limit=${limit}&offset=${next}`
      };
    }

    return links;
  },

  getUploadURL: (origin, cid, file) => {
    const app_uuid = config.layer.appId.split('/').slice(-1)[0];

    const url = [
      config.layer.host,
      'apps',
      app_uuid,
      'conversations',
      cid,
      'content'
    ];

    const headers = {
      'Accept': 'application/vnd.layer+json; version=1.1',
      'Authorization': `Bearer ${config.layer.token}`,
      'Content-Type': 'application/json',
      'Upload-Content-Type': file.mimetype,
      'Upload-Content-Length': file.size,
      'Upload-Origin': origin,
    };

    return post(url.join('/'), null, {
      headers: headers
    });
  }
};

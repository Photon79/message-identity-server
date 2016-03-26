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

    const userId = atob(authHeader.split(' ')[1]).split(':')[0];

    const props = {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/hal+json',
        'Content-Type': 'application/json',
      },
    };

    return get(`${config.api.host}/users/${userId}`, props)
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

  getId: (url) => {
    return url.substr(url.lastIndexOf('/') + 1);
  },

  getConversationLinks: (urlPrefix, params) => {
    const count = params.count;
    const limit = params.limit;
    const offset = params.offset;

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

  getMessagesLinks: (urlPrefix, params) => {
    const count = params.count;
    const curId = params.id;
    const lastId = params.lastId;
    const limit = params.limit;
    const strPart = curId ? `last_id=${curId}&` : '';

    const links = {
      self: {
        href: `${urlPrefix}?${strPart}limit=${limit}`
      }
    };

    if (count === limit) {
      links['next'] = {
        href: `${urlPrefix}?last_id=${lastId}&limit=${limit}`
      };
    }

    return links;
  }
};

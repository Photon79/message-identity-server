function getId(url) {
  const urlPieces = url.split('/');
  return urlPieces[urlPieces.length - 1];
}

function getAttributes(data) {
  return {
    created_at: data.created_at,
    distinct: data.distinct,
    unread_message_count: data.unread_message_count,
    metadata: data.metadata,
  };
}

function getRelationships(data) {
  return {
    messages: {
      links: {
        related: {
          href: `conversations/${getId(data.id)}/messages`,
        },
      },
    },
  };
}

module.exports = function serialize(data) {
  return {
    id: getId(data.id),
    type: 'layer/conversation',
    attributes: getAttributes(data),
    relationships: getRelationships(data),
  };
}

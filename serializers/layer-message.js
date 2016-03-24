function getId(url) {
  const urlPieces = url.split('/');
  return urlPieces[urlPieces.length - 1];
}

function getAttributes(data) {
  return {
    sent_at: data.sent_at,
    parts: data.parts,
    recipient_status: data.recipient_status,
  };
}

function getRelationships(data) {
  return {
    conversation: {
      data: {
        type: 'layer/conversation',
        id: getId(data.conversation.id),
      },
    },
  };
}

module.exports = function serialize(data) {
  return {
    id: getId(data.id),
    type: 'layer/message',
    attributes: getAttributes(data),
    relationships: getRelationships(data),
  };
}

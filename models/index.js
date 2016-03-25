module.exports = (mongoose) => {
  return {
    Conversation: require('./conversation')(mongoose)
  };
}

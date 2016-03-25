module.exports = (mongoose) => {
  const conversationSchema = new mongoose.Schema({
    conversation_id: String,
    created_at: { type: Date, default: Date.now },
    participants: [String],
    sender: String,
    subject: String,
  });

  return mongoose.model('Conversation', conversationSchema);
}


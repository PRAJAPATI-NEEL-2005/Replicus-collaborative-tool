const mongoose = require("mongoose");

const CodeRunLogSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  username: { type: String, required: true },
  email: { type: String },
  language: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CodeRunLog", CodeRunLogSchema);
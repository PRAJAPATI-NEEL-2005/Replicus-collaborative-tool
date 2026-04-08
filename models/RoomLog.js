const mongoose = require("mongoose");

const RoomLogSchema = new mongoose.Schema({
  roomId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  username: String,
  email: String,
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("RoomLog", RoomLogSchema);
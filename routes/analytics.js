const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Room = require("../models/RoomLog"); // Tracks user joins
const Chat = require("../models/Chat");    // Tracks messages

// ==============================
// 1. BASIC OVERVIEW
// ==============================
// Returns total users, unique rooms created/joined, and total messages
router.get("/overview", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Chat.countDocuments();
    
    // Count distinct rooms that have been accessed
    const uniqueRooms = await Room.distinct("roomId");
    const totalRooms = uniqueRooms.length;

    res.json({
      totalUsers,
      totalRooms,
      totalMessages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 2. ROOM JOINS (Users per Room)
// ==============================
// Shows how many users joined which room, sorted by most popular
router.get("/rooms/joins", async (req, res) => {
  try {
    const data = await Room.aggregate([
      {
        $group: {
          _id: "$roomId",
          totalUsersJoined: { $sum: 1 }
        }
      },
      { $sort: { totalUsersJoined: -1 } } // Highest joins first
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 3. HIGH VOLUME ROOMS (Messages per Room)
// ==============================
// Shows the most active rooms based on message count
router.get("/rooms/volume", async (req, res) => {
  try {
    const data = await Chat.aggregate([
      {
        $group: {
          _id: "$roomId",
          totalMessages: { $sum: 1 }
        }
      },
      { $sort: { totalMessages: -1 } }, // Highest volume first
      { $limit: 10 } // Optional: limit to top 10 rooms
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 4. USER MESSAGES IN A SPECIFIC SESSION
// ==============================
// Pass the roomId in the URL to see which users sent the most messages in that specific room
router.get("/rooms/:roomId/user-activity", async (req, res) => {
  try {
    const { roomId } = req.params;

    const data = await Chat.aggregate([
      { 
        $match: { roomId: roomId } // Filter by the specific room
      },
      {
        $group: {
          _id: "$userId", // Group by user
          messagesSent: { $sum: 1 }
        }
      },
      { $sort: { messagesSent: -1 } }, // Most active users first
      
      // Optional: Lookup user details to get names/emails instead of just IDs
      {
        $lookup: {
          from: "users", // ensure this matches your actual MongoDB collection name for users
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          messagesSent: 1,
          username: "$userDetails.name", // Adjust field name based on your schema
          email: "$userDetails.email"
        }
      }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
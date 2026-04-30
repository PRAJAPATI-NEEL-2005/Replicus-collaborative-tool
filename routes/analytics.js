const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Room = require("../models/RoomLog");
const Chat = require("../models/Chat"); 
const CodeRunLog = require("../models/CodeRunLog"); 

// ==============================
// 1. BASIC OVERVIEW
// ==============================
// Returns total users, unique rooms created/joined, total messages, and total code runs
router.get("/overview", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Chat.countDocuments();
    const totalCodeRuns = await CodeRunLog.countDocuments(); // Added code runs count
    
    // Count distinct rooms that have been accessed
    const uniqueRooms = await Room.distinct("roomId");
    const totalRooms = uniqueRooms.length;

    res.json({
      totalUsers,
      totalRooms,
      totalMessages,
      totalCodeRuns // Exporting the new stat
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 2. ROOM JOINS (Users per Room)
// ==============================
router.get("/rooms/joins", async (req, res) => {
  try {
    const data = await Room.aggregate([
      {
        $group: {
          _id: "$roomId",
          totalUsersJoined: { $sum: 1 }
        }
      },
      { $sort: { totalUsersJoined: -1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 3. HIGH VOLUME ROOMS (Messages per Room)
// ==============================
router.get("/rooms/volume", async (req, res) => {
  try {
    const data = await Chat.aggregate([
      {
        $group: {
          _id: "$roomId",
          totalMessages: { $sum: 1 }
        }
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 10 }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 4. USER MESSAGES IN A SPECIFIC SESSION
// ==============================
router.get("/rooms/:roomId/user-activity", async (req, res) => {
  try {
    const { roomId } = req.params;

    const data = await Chat.aggregate([
      { 
        $match: { roomId: roomId }
      },
      {
        $group: {
          _id: "$userId", 
          messagesSent: { $sum: 1 }
        }
      },
      { $sort: { messagesSent: -1 } },
      {
        $lookup: {
          from: "users", 
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          messagesSent: 1,
          username: "$userDetails.name", 
          email: "$userDetails.email"
        }
      }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 5. 🔥 TOP ROOMS BY CODE EXECUTIONS
// ==============================
// Shows which rooms are running code the most
router.get("/rooms/code-runs", async (req, res) => {
  try {
    const data = await CodeRunLog.aggregate([
      {
        $group: {
          _id: "$roomId",
          totalRuns: { $sum: 1 }
        }
      },
      { $sort: { totalRuns: -1 } }, // Highest runs first
      { $limit: 10 }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 6. 🔥 CODE RUNS BY USER IN A SPECIFIC SESSION
// ==============================
// See exactly which users are running code in a specific room, and what language they used
router.get("/rooms/:roomId/code-activity", async (req, res) => {
  try {
    const { roomId } = req.params;

    const data = await CodeRunLog.aggregate([
      { 
        $match: { roomId: roomId } 
      },
      {
        $group: {
          _id: "$username", // Grouping by the username saved in the log
          email: { $first: "$email" }, // Pulling the email
          totalExecutions: { $sum: 1 },
          languagesUsed: { $addToSet: "$language" } // Creates an array of unique languages they ran (e.g., ["javascript", "python"])
        }
      },
      { $sort: { totalExecutions: -1 } } // Most active coders first
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 7. RECENT USER SESSIONS LOG
// ==============================
// Returns a detailed list of who joined what room, when, and their activity
router.get("/recent-sessions", async (req, res) => {
  try {
    const sessions = await Room.aggregate([
      { $sort: { joinedAt: -1, createdAt: -1 } }, // Newest first (handles either joinedAt or createdAt fields)
      { $limit: 100 }, // Keep the list manageable (last 100 sessions)
      {
        $lookup: {
          from: "chats", // Your chats collection
          let: { roomId: "$roomId", userId: "$userId" },
          pipeline: [
            { 
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ["$roomId", "$$roomId"] },
                    { $eq: ["$userId", "$$userId"] }
                  ]
                }
              }
            }
          ],
          as: "userChats"
        }
      },
      {
        $project: {
          roomId: 1,
          username: 1,
          email: 1,
          joinedAt: { $ifNull: ["$joinedAt", "$createdAt"] }, // Fallback in case your schema uses createdAt
          messagesSent: { $size: "$userChats" }
        }
      }
    ]);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
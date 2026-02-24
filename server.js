const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Actions = require("./src/Actions");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  }
});

const userSocketMap = {};
const cors = require("cors");
const axios = require("axios");
app.use(express.json());

app.use(cors(
  {
    origin:"http://localhost:3000", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  }
));


//run code api
app.post("/run", async (req, res) => {
  const { code, language, input } = req.body;

  try {
    // Map your frontend language to JDoodle format
    const languageMap = {
      javascript: { language: "nodejs", versionIndex: "4" },
      typescript: { language: "nodejs", versionIndex: "4" },
      python: { language: "python3", versionIndex: "3" },
      java: { language: "java", versionIndex: "4" },
      cpp: { language: "cpp17", versionIndex: "0" },
      c: { language: "c", versionIndex: "5" },
      php: { language: "php", versionIndex: "4" },
      html: null,
  css: null,
  json: null,
  xml: null,
  sql: null,
    };

    const selected = languageMap[language];

    if (!selected) {
 return res.status(400).json({ 
    error: `${language.toUpperCase()} cannot be executed.`
  });    }

    const response = await axios.post(
      "https://api.jdoodle.com/v1/execute",
      {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        stdin: input || "",
        language: selected.language,
        versionIndex: selected.versionIndex,
      }
    );

    res.json(response.data);

  } catch (error) {
    console.log("🔥 JDoodle ERROR 🔥");
    console.log(error.response?.data || error.message);

    res.status(500).json({
      error: error.response?.data || "Execution failed",
    });
  }
});



function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}
    // socket connection happend here
io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  //event emitted when user join the room
  socket.on(Actions.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(Actions.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // that event emmited when user changes the code and other user receive the code here
  socket.on(Actions.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(Actions.CODE_CHANGE, { 
      code,
      username: userSocketMap[socket.id], // ⭐ Include username in the broadcast


     });
  });

  //event emmited when user join the room and the code is sent to them here
  socket.on(Actions.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(Actions.SYNC_CODE, { code });
  });

    // LANGUAGE CHANGE BROADCAST
  socket.on(Actions.LANGUAGE_CHANGE, ({ roomId, language }) => {
    socket.in(roomId).emit(Actions.LANGUAGE_CHANGE, { 
      language ,
      username: userSocketMap[socket.id], 

    });
  });

  //  LANGUAGE SYNC FOR NEW USER
  socket.on(Actions.SYNC_LANGUAGE, ({ socketId, language }) => {
    io.to(socketId).emit(Actions.SYNC_LANGUAGE, { language });
  });

  // Handle chat messages
  socket.on(Actions.SEND_MESSAGE, ({ roomId, message, username }) => {
  io.in(roomId).emit(Actions.RECEIVE_MESSAGE, {
    message,
    username:userSocketMap[socket.id],
    time: new Date().toLocaleTimeString(),
  });
});

// 🔹 INPUT change
socket.on(Actions.INPUT_CHANGE, ({ roomId, input }) => {
  socket.in(roomId).emit(Actions.INPUT_CHANGE, { input,
    username: userSocketMap[socket.id],
   });
});

// 🔹 OUTPUT change
socket.on(Actions.OUTPUT_UPDATE, ({ roomId, output }) => {
  socket.in(roomId).emit(Actions.OUTPUT_UPDATE, { output });
});

// 🔹 RUN STATE change
socket.on(Actions.RUN_STATE_CHANGE, ({ roomId, isRunning }) => {
  socket.in(roomId).emit(Actions.RUN_STATE_CHANGE, { isRunning
    ,username: userSocketMap[socket.id], 
  });
});







  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];

    rooms.forEach((roomId) => {
      socket.to(roomId).emit(Actions.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
  });
});

server.listen(5000, () => {
  console.log("Server running on 5000");
});
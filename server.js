const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Actions = require("./src/Actions");
const { use } = require("react");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

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
const express=require('express');
const http=require('http'); 
const {Server}=require('socket.io');
const Actions = require('./src/Actions');
const app=express();
const port=5000;
const server=http.createServer(app);

 

const io=new Server(server);
const userSocketMap={};
function getAllConnectedClients(roomId){
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId)=>{
        return {
            socketId,
            username:userSocketMap[socketId],
        };
    });
}

io.on('connection',(socket)=>{
    console.log('socket connected:', socket.id);

    socket.on(Actions.JOIN,({roomId,username})=>{
        userSocketMap[socket.id]=username;
        socket.join(roomId);

        const clients=getAllConnectedClients(roomId);
        clients.forEach(({socketId})=>{
            io.to(socketId).emit(Actions.JOINED,{
                clients,
                username,
                socketId:socket.id,
            });
        });
    });

    socket.on('disconnecting',()=>{
        const rooms=socket.rooms;
        rooms.forEach((roomId)=>{
            socket.to(roomId).emit(Actions.DISCONNECTED,{
                socketId:socket.id,
                username:userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });



});

server.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';

const app = express();
const server = createServer(app);
const PORT = 5000;
// const io = new Server(server);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

server.listen(PORT, () => console.log('Server running on port ' + PORT));

io.on('connection', (socket) => {
    console.log('user connected');


    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
})
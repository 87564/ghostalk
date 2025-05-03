const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, './public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

app.get('/call.html', (req, res) => {
    res.sendFile(path.join(__dirname, './public/call.html'));
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        socket.to(room).emit('peer-joined', socket.id);
    });

    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', { from: data.from, signal: data.signal });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

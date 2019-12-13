const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const io = socketio(server);


io.on('connection', (socket) => {
    console.log('We have a new coneection');
    socket.on('join', ({ name, room }, callback) => {
        const { err, user } = addUser({ id: socket.id, name, room });
        if (err) return callback(err);
        socket.emit('message', { user: 'admin', text: `${user.name},chào mừng đến với phòng ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, đã tham gia !` });

        socket.join(user.room);
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        callback();

    });
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        callback();
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} đã thoát ! ` });
        }
    });
});
app.use(router);
app.use(cors());
server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
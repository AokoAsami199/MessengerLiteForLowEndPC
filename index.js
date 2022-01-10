var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var port = process.env.PORT || 1909;

app.get('/', function(req, res) {
    var express = require('express');
    app.use(express.static(path.join(__dirname)));
    res.sendFile(path.join(__dirname, 'index.html'));
});
var account = {},
    fb = {};
//------------------------------------------------------

const fs = require("fs");
const login = require("facebook-chat-api");

io.on('connection', socket => {
    socket.on('login', (tk, mk) => {
        fb[socket.id] = [];
        account[socket.id] = login({ email: 'example@gmail.com', password: 'example123' }, (err, api) => {
            if (err) {
                console.error(err);
                socket.emit('err', err);
                return;
            }
            api.getFriendsList((err, data) => {
                if (err) return console.error(err);
                for (var i in data) {
                    fb[data[i].userID] = data[i].fullName;
                }
                socket.emit('logged', tk, mk);
                tk = '';
                mk = '';
            })

            api.setOptions({
                logLevel: "silent",
                forceLogin: true
            })

            api.listen((err, message) => {
                // console.log(fb[message.senderID]+': '+message.body);
                console.log(message);
                var c = true;
                for (var i in message.attachments) {
                    if (message.attachments[i].type == "photo") {
                        socket.emit('mess', 'photo', message.attachments[i].url, message.senderID, fb[message.senderID], message.threadID)
                    }
                    if (message.attachments[i].type == "sticker") {
                        socket.emit('mess', 'sticker', message.attachments[i].url, message.senderID, fb[message.senderID], message.threadID)
                    }
                    if (message.attachments[i].type == "video") {
                        socket.emit('mess', 'video', message.attachments[i].url, message.senderID, fb[message.senderID], message.threadID)
                    }
                    if (message.attachments[i].type == "animated_image") {
                        socket.emit('mess', 'animated_image', message.attachments[i].animatedGifUrl, message.senderID, fb[message.senderID], message.threadID)
                    }
                    if (message.attachments[i].type == "file") {
                        socket.emit('mess', 'file', { url: message.attachments[i].url, name: message.attachments[i].filename }, message.senderID, fb[message.senderID], message.threadID)
                    }
                    if (message.attachments[i].type == "share") {
                        socket.emit('mess', 'photo', message.attachments[i].image, message.senderID, fb[message.senderID], message.threadID)
                    }
                    c = false;
                }

                if (c)
                    socket.emit('mess', 'normal', '<xmp>' + message.body + '</xmp>', message.senderID, fb[message.senderID], message.threadID)
            })

            socket.on('mess', (d1, d2) => {
                api.sendMessage(d1, d2);
                socket.emit('Done', fb[d2], d2, d1);
                console.log("Sent to '" + fb[d2] + "': " + d1);
            })
            socket.on('Disconnect', () => {
                api.logout();
                console.log('Logged out!');
            })
        })
    })
})

http.listen(port, function() {
    console.log('listening on *:' + port);
});
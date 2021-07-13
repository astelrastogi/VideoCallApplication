const express = require("express");
const socket = require("socket.io");
const app = express();

let PORT = process.env.PORT || 7000;

//insert cors if req
const cors = require("cors")
app.use(cors({
    origin: '*'
}));
//end of cors


//listen: starts the server

let server = app.listen(PORT, function () {
  console.log("Server is running");
});

app.use(express.static("public"));

// to make server accept websockets

let io = socket(server);

// when a user is connected

io.on("connection", (socket) => {
  console.log("User Connected :" + socket.id);

  // when a peer hits the join room button

  socket.on("join", (roomName) => {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);

    if (room == undefined) { //when no such room exists
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size == 1) {
      //room.size == 1 when one person is inside the room
      socket.join(roomName);
      socket.emit("joined");
    } else {
      //when there are already two people inside the room
      socket.emit("full");
    }
    console.log(rooms);
  });

  // when the person who joined the room is ready to communicate
  socket.on("ready", function (roomName) {
    // informing the other peer in the room
    socket.broadcast.to(roomName).emit("ready"); 
  });

  // when server gets an icecandidate from a peer in the room

  socket.on("candidate", function (candidate, roomName) {
    console.log(candidate);
    // sending candidate to the other peer in the room
    socket.broadcast.to(roomName).emit("candidate", candidate); 
  });

  // when server gets an offer from a peer in the room

  socket.on("offer", function (offer, roomName) {
    console.log(offer);
    //sending offer to the other peer in room
    socket.broadcast.to(roomName).emit("offer", offer); 
  });

  // when server gets an answer from a peer in the room

  socket.on("answer", function (answer, roomName) {
    // answering to the other peer in the room
    socket.broadcast.to(roomName).emit("answer", answer); 
  });
});

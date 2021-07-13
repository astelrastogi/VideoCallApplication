let socket = io.connect("http://localhost:7000/");
//let socket = io.connect("https://obscure-ridge-56494.herokuapp.com/");

let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");
let roomName; //for making roomInput.value global
let creator = false;  //creator is the person creating the room
let rtcPeerConnection;
let userStream; //for accessing stream for navigator.mediaDevices.getUserMedia globally

let divButtonGroup = document.getElementById("btn-group");
let muteButton = document.getElementById("muteButton");

let isMuted = false;

// Stun servers
let iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
};

if(joinButton){ //if joinButton is not null
  joinButton.addEventListener("click", () => {
    if (roomInput.value == "") {
      alert("Please enter a room name");
    } else {
      roomName = roomInput.value;
      // every time user pressed the join btn
      socket.emit("join", roomName);
      // we send this event to the server
    }
  });
}
if(muteBtn){ //if muteBtn is not null
  muteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      console.log("mute btn clicked");
      if(isMuted){
          userStream.getTracks()[0].enabled=false; //stop receiving audio track
          muteBtn.textContent = "Unmute"; 
      }else{
          userStream.getTracks()[0].enabled=true; //start receiving audio track
          muteBtn.textContent = "Mute";
      }
  });
}


// when a room is created

socket.on("created", () => {
  creator = true;
  // Using the navigator.mediaDevices.getUserMedia function of WebRTC
  // to get camera and microphone feed
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 500, height: 500 },
    })
    .then((stream) => {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = "display: none";
      divButtonGroup.style = "display: flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = (e) => {
        userVideo.muted = true; //for echo cancellation 
        userVideo.play();
      };
    })
    .catch( (err) => {
      /* handle the error */
      alert("Couldn't access User Media");
    });
});

// when a room is joined by the peer

socket.on("joined", () => {
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 500, height: 500 },
    })
    .then( (stream) => {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = "display:none";
      divButtonGroup.style = "display:flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata =  (e) => {
        userVideo.muted = true; //for echo cancellation 
        userVideo.play();
      };
      socket.emit("ready", roomName); //emits the peer is ready to join 
    })
    .catch( (err) => {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// when a room is full (capacity is 2)

socket.on("full",  () => {
  alert("Room is full, can't join");
});

// when the peer has joined the room and ready to connect

socket.on("ready", () => {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers); // triggered when we get an ice candidate from stun servers
    // since RTCPeerConnection is an interface, we need to implement its functions
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //audio
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); //video


    rtcPeerConnection
      .createOffer()
      .then((offer) => { //offer is the session description of the creator of the call
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

// on receiving an icecandidate from peer

socket.on("candidate", (candidate) => {
  // making candidate of the form of RTCIceCandidate
  let icecandidate = new RTCIceCandidate(candidate);
  // adding icecandidate
  rtcPeerConnection.addIceCandidate(icecandidate);
});

// on receiving an offer from creator

socket.on("offer", (offer) => {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction; //triggered when we get an ice candidate from stun servers
    rtcPeerConnection.ontrack = onTrackFunction; //triggered when we get media stream from the peer
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //audio
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); //video
    rtcPeerConnection.setRemoteDescription(offer);

    rtcPeerConnection
      .createAnswer()
      .then((answer) => { //answer is the session desc of the user joining the call
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

// on receiving an answer from the peer who joined the room

socket.on("answer", (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
});

// Implementing the onIceCandidateFunction which is part of the RTCPeerConnection Interface

function onIceCandidateFunction(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

// Implementing the onTrackFunction which is part of the RTCPeerConnection Interface

function onTrackFunction(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = (e) => {
    peerVideo.play();
  };
}
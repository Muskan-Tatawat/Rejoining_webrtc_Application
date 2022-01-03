//websocket allows full duplex communication. means once the client and
//server connection established, the client and the server can send data 
//back and forth continuously without having the client to make any 
//further connection request.syntax--WebSocket("socket server url")
const webSocket = new WebSocket("ws://192.168.43.75:8000")

//when other client sends thier offer and thier ice candidates
//we have to accept that and we have to give it to peer connection
//so that the connection is established.whenever there is any msg
//from the server to the webSocket then the onmessage() is called
//in this event we have event.data ,this is going to be a string
//all those signaling data getting out of answers and out of the
//candidates. this event.data will be in a separate function 
//named handleSignallingData() and we get the object from the
//event data in its parameter as JSON.parse(event.data) and pass
//this event object to the function
webSocket.onmessage = (event) => {
	handleSignallingData(JSON.parse(event.data))
} 

//now creating the function. in this function we will switch the
//type of data and if the typr is answer then we set the description 
//of the remote user on the peer connection and we get the answer
//from data and pass it to the function.and if the type is candidate
//then we will add that into peer connection with the help of 
//peerconnection.addIceCandidate() and pass the candidate from
//the data in this function.
function handleSignallingData(data) {
 	switch (data.type) {
 		case "answer":
 			peerconnection.setRemoteDescription(data.answer)
 			break
 		case "candidate":
 			peerconnection.addIceCandidate(data.candidate)
 	}
 } 


//creating global variable for getting the user name from the input box
let username

//now we are creating function which is called on clicking send button
function sendusername(){
	username = document.getElementById("username-input").value

	//now we send the user name onto the socket server. for sending any 
	//kind of data we use sendData().this function will accept an object
	//this object has a type.we will pass type store_user. we 
	//use this type to store the user name.for storing offer-->store_offer
	//for storing ICE-candidate-->store_candidate.
	sendData({
		type: "store_user"
	})
}

//creating sendData() and attaching user name to it.because everytime
//we need to send data we have to send username also so that thserver
//knows who the data belongs to.
function sendData(data){
	data.username = username

	//we send this object to the sever by calling webSocket.send().
	//this send() requires a string data as the parameter so we are 
	//using json.stringify() to convert our data object to string.
	webSocket.send(JSON.stringify(data)) 
}

//creating global localstream variable and peerconnection variable
let localstream
let peerconnection

//now we are creating function which is called on clicking start call
// button
function startcall(){
	//we are setting the display property of video call div to inline 
	//so that it is visible.first we get video-call-div by its id, and
	//set its display to inline.
	document.getElementById("video-call-div").style.display = "inline"

	//now we will need a video stream from device and we have to 
	//show that video stream in a local video object.to get video
	//stream we have to call navigator.getUserMedia() and here we
	//have to pass a conatraints object as first parameter defining 
	//what kind of straem we want. to keep it simple we take video
	//and set it to true and then audio and set it to true.but we 
	//also have options for specific type of streaming we want, like 
	//min width,min height or frame rate etc.for passing these things 
	//we have to pass an object instead of true like-->
	//video:{frameRate:24,width:100} in this also we can give width
	//like-->video:{frameRate:24,width:{min:480,ideal:720,max:1280}}etc.
	//note-->we pass object in {}.
	navigator.getUserMedia({
		video:{
			frameRate:24,
			width:{
				min:480,ideal:720,max:1280
			},

			//search about aspectRatio 1.33333 is almost near to 4/3
			//and it is good for laptop and computers.
			aspectRatio:1.33333 
		},
		audio: true

		//note-->search for aother constriants we can use to specify 
		//the type of audio or video stream.

		//getUserMedia() recieves a callback function as a second 
		//parameter and with this it returns the stream here (stream)=>
		//......is a second parameter.
	}, (stream) => {
		//first we store the stream in local video element. we take local
		//element by its id local-video.
		localstream = stream
		document.getElementById("local-video").srcObject = localstream
		//we will need the above stream object outside this function too
		//so we create the global object localstream above this function.
		//search what is src.Object 
		//in document.getElementByID("id").srcObject?

		//creating peer connection and with this we will attach
		//local stream what we get above.and when some other peer 
		//connects to our peer then this stream will be available
		//to that person through a simple fuction that is available 
		//in the webRTC api.so, we create a global variable above
		//this function named peerconnection and this will be equal
		//to new RTCPeerConnection() in this we have to pass some
		//configurations like stun srevers and turn servers that it 
		//is going to use to generate the ICE candidates and to connect
		//to the peer so we are creating object named configuration
		//and this will have an ice servers object which is an array
		//and here,in array we can pass two objects ,first is the links or 
		//urls of stun server and second will be the links or urls
		//of turn server.there are many public stun servers available.
		//there is github page containing all stun and turn srevers.
		//link-->gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
		//but not all of them are usable. so to test which one should use
		//refer the website-->
		//webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
		//to find out the stun and turn server which are usefull, copy the
		//server link from github (first link) and then paste it in this 
		//website's field-->stun or turn url.then click on add server.
		//also remember after pasting the url add stun: at the beginning of 
		//link.then click on gather candidates.so after gathering if the 
		//type of the candidate has rtp srflx then this server can be used
		//and for the turn server type should be relay.
		//we can have single or multiple servers.prefering multiple
		//server is good.we use multiple stun servers in this project
		//not turn server as we didnot find any good turn server.for
		//multiple server in urls we pass an array of urls.
		let configuration = {
			iceServers:[
				{
					"urls":["stun:stun.l.google.com:19302",
							"stun:stun1.l.google.com:19302",
							"stun:stun2.l.google.com:19302"]
				}
			]
		} 
		//passing this configuration object to RTCPeerConnection 
		peerconnection = new RTCPeerConnection(configuration)

		//now attatch the stream to this peer connction by calling
		//peerconnection.addStream() and then add the local stream
		peerconnection.addStream(localstream)

		//when this peer connection connects to other guy a call
		//back fuction will be called which is onaddstream and
		//this one have parameter we call it e.now we have to
		//show the stream in the remote video element so we will
		//get that element by its id remote-video and set the
		//source object to e.stream.
		peerconnection.onaddstream = (e) => {
			document.getElementById("remote-video").srcObject = e.stream
		}

		//as soon as the offer gets created the peerconnection also 
		//starts gathering the ice candidates and those candidates
		//need to be send to the server and the server will send that 
		//candidate to a person who is trying to connect with us.and 
		//using the candidate we can make the connectin happen.and
		//when we have the new candidate created for the peer connection
		//then we get onicecandidate() called and this will have an 
		//event which we call e will check if the candidate in this 
		//event is null or not. if it is, then we just simply return 
		//from this method and we will not send this candidate to the 
		//server. this onicecandidate() called multiple times everytine when 
		//we get new ice candidate then this callback function is called
		// and we need to all of those candidates to the other guy who is 
		//trying to connect with us.
		peerconnection.onicecandidate = ((e) => {
			if (e.candidate == null)
				return

			//now we can send this candidate to the server by sendData()
			//and the type will be store_candidate and we will also attatch
			//the candidate here.
			sendData({
				type: "store_candidate",
				candidate: e.candidate
			})
		})  

		//now we create and send our offer which will be stored on a
		//socket server and if someone tries to connect with us 
		//then server will send this offer to that person.and then get
		//that person's answer and return us that answer then we store 
		//our answer in peerconnection.here we are calling 
		//createAndSendOffer().
		createAndSendOffer() 

		//now  getUserMedia() also recieves third parameter which is an 
		//error callback.if any error occur then it fails to get the user
		//media then it will be called.and here we will just print the error
		//to console(can say we will just log out the error)
	}, (error) => {
		console.log(error)
	})

}

//creating createAndSendOffer().to create offer just call
//peerconnection.creatOffer(),this will return a promise. we have
//to call that offer and now we can send this offer onto the server
//by calling sendData(). type will be store_offer and along with the
//type we also attatch the offer .
function createAndSendOffer(){
	peerconnection.createOffer((offer) => {
		sendData({
			type: "store_offer",
			offer: offer
		})

		//after creating offer we also have to set the description
		//of the remote peer connection
		peerconnection.setLocalDescription(offer)

		//then we pass the second parameter to creatOffer() for
		//any error callbacks.and if any error occurs while creating 
		//the offer then we will log out that error.
	}, (error) => {
		console.log(error)
	})
}

let isAudio = true
function muteaudio(){
	isAudio = !isAudio

	//get the audio track from the local stream using function
	//getAudioTracks() this will return an array of all the 
	//audio tracks that our stream is playing but we only interested
	//in the first one because we only have one audio track that is 
	//being played and it has an enabled property which we set isAudio.
	localstream.getAudioTracks()[0].enabled = isAudio
}

//similar to audio we do for video
let isVideo = true 
function mutevideo(){
	isVideo = !isVideo
	localstream.getVideoTracks()[0].enabled = isVideo
}
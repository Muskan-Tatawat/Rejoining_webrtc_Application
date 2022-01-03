//for the server we are using wesocket library which can
//be installed by using npm install websocket/websockets command or pip 
//install websocket/websockets command.
//first create variable socket and include websocket library
//and we will get the server from this library
const Socket = require("websocket").server

//we will also need http. sp include that too
const http = require("http")

//then creating one more variable named server. yhen we will make 
//a call to the function createServer on the http object. we will 
//leave this method empty.
const server = http.createServer((req, res) => {})

//then server to start running we will call server.listen(). here
//we have to pass port number on which we want to run it.and second
//parameter is a function which will be executed once the server 
//starts listening and when thats happen we willprint msg.
server.listen(8000, () => {
	console.log("listening on port 8000...")
})

//now we create an websocket object using socket().here we have to 
//paas the server configuration.which will be an object and through
//this we want to paas the http server and that will just be the 
//server object 
const webSocket = new Socket({ httpServer: server })

//now we will create an array named users and this array will hold 
//the data of senders because their data need to persist on the 
//server so that we can send it to the receiver once they join a 
//call.
let users = []

//when there is a new connection request to the web socket server
//the request event is called which has callback and it has a 
//request as a parameter
webSocket.on('request',(req) => {

	//here we will create a connection variable which hold the 
	//connection for this request.using this connection variable
	//we will be able to send data to the request.and to get it
	//we just have to call the request.accept().
	const connection = req.accept()

	//whenever this connection (above connection) sends any message
	//then the connection.on('message') is called it has a callback
	//that has a message as parameter to it.then in it create another 
	//variable named data and parse json from this msg.and the
	//utf8 property of the message object passed in parameter has the
	//string data that the connection is sending.
	connection.on('message', (message) => {
		const data = JSON.parse(message.utf8Data)

		//here we will create a variable named user that will return
		//the value returned by findUser() and here we pass the username
		//of user of current message we have gotten.
		const user = findUser(data.username)


		//now we will switch the type of the data like store candidate
		//send candidate etc that we are sending from the client.first 
		//case that we want to check is the store_user.if it is
		//then we will store this guy in the users array.so inside this 
		//case create a new user object. we will store two things in
		//this new user object,first is the connection of the user and 
		//second is user name of user which we are sending it from the 
		//sender.js file 
		switch(data.type){
			case "store_user":

				//here we will check user is not null.if the user is not 
				//null it means that the server already has someone with the 
				//username so we are not going to this guy.so we simply return
				//from this method and we get out of this function means function
				//will break.
				if (user != null){
					return
				}

				const newUser = {
					conn: connection,
					username: data.username
				}

				//now we will push this guy in the users array
				users.push(newUser)
				//now we will print the username of person connected
				console.log(newUser.username)
				//then we will break from this case
				break
			//now the next case we wants to check is store_offer
			//if it is then we are going to get the offer fron data
			//and then we are going to attatch to this user.we are
			//attatching to this user. 
			case "store_offer":

				//here we will check if the user is not null.if it is
				//null then we will not store the offer.we will store 
				//offer only if the user is not null.otherwise we just 
				//return from the case or the function.
				if (user == null)
					return

				//now we will set the offer of the user to the offer 
				//that is there in our data object then we can break
				//out from this case
				user.offer = data.offer
				break

			//next case that we want to check is store_candidate.if it
			//is then we are going to store candidate for this user.and 
			//for that also we will check if the user actually exists
			//and if it is not then we will return otherwise we will
			//add that to this user(we will add the candidate).so that 
			//if someone calls this user the things in this function.
			case "store_candidate":
				if (user == null){
					return
				}

				//remember here multiple candidates come. so, we are 
				//going to store this in an array.so we will check for
				//another condition that if user.candidates == null
				//means that if there is no candidate property in this
				//user then we will create that.and it is initialised 
				//with an empty array.
				if (user.candidates == null)
					user.candidates = []

				//finally we will just push this candidate in the candidate 
				//array.so get the candidate from the data in parameter.then
				//we can break out from this case too.
				user.candidates.push(data.candidate) 
				break

			//next check is send answer and send candidate.these things
			//will be return from the receiver once it get the offer from
			//the person trying to call.this guy will give its answer and
			//the candidate and then will have to send that thing to the
			//person who created the offer in the first place.so,check
			//if the case is send_answer and if it is,then we will again
			//check if the user is null or not.if the user is null then we 
			//just return from the method.otherwise we will send this answer
			//to the person it is trying to call.how we know who call,it is 
			//stored in data.username variable.
			case "send_answer":
				if (user == null){
					return
				} 	

				//now to send any data we use sendData(),which has 
				//type answer and also attach answer to it.and we will
				//also pass the connection of the user to which data is 
				//to be send.and that connection will go with secoond
				//parameter of sendData().we can get connection from 
				//user.conn because receiver will send the username of
				//the person who it is trying to call and then through the 
				//findUser() we are getting that user by passing the username
				//of the person that was send by the receiver and once we have
				//that user ,we are getting its connection and we are sending 
				//the answer to that guy.now we can break from this case.
				//here we dont create sendData(). we will create it
				//outside.
				sendData({
					type: "answer",
					answer: data.answer
				}, user.conn)
				break

			//next case is to check send_candidate.if it is,then we will
			//check user is null or not. if user is null,we just return 
			//from function otherwise send data.
			case "send_candidate":
				if(user == null){
					return
				}

				sendData({
					type: "candidate",
					candidate: data.candidate
				}, user.conn)
				break

			//now we will check for the case join call.if it is,then
			//we return the offer and candidate of the user variable.
			//first we will check if the user is not null,if it is then 
			//we will return.otherwise,the first thing we will send is 
			//the offer of this user means type is user and then attach 
			//offer which we get from the user object.
			case "join_call":
				if(user == null){
					return
				}

			sendData({
				type: "offer",
				offer: user.offer
			},connection) //here connection is current connection 

			//once we have send the offer,we can send the candidate
			//remember the offer should go first then candidate should
			//go. otherwise the connection will not happen.now we can
			//send the candidates which is actually array,so,
			//user.candidates.we will go through each of the candidates
			//by using foreach().then we will call sendData,type  is 
			//candidate and then attatch the candidate.also pass the
			//connection as the second parameter.
			user.candidates.forEach(candidate => {
				sendData({
					type: "candidate",
					candidate: candidate
				}, connection)

			}) 
			break
		}		
	})
	
	//whenever a connection closes,we are supposed to remove the 
	//user from the user's array. otherwise when someone tries to 
	//connect back with the same user name then that is not going 
	//to work.so, to know if the connection closes,the on close event
	//is called.and the second parameter is a callback(),where the 
	//first parameter is the reason code and the second parameter is 
	//the description of the connection closing status.	in this 
	//function we will go through each of the users in our users array
	//and for that we use foreach and here we check that if user.conn 
	//== connection,if it is then we are going to remove that user 
	//from the user's array.and to do that we have to call the slice()
	//on the user's array .in the parameter of slice(),first parameter
	//is the index of element which we want remove.to get that we use 
	//the indexOf() on the user's array.then we pass the users to
	//this function(indexOf()).second parameter is how many elements
	//we wants to delete from the start number.and here we just wants
	//to delete 1.once it is done we will return from it.
	connection.on('close',(reason, description) => {
		users.forEach(user =>{
			if (user.conn == connection){
				users.splice(users.indexOf, 1)
				return
			}
		})
	})	

})

//creating sendData()
function sendData(data,conn){

	//to send any data we just call con.send().the data that goes in
	//here is a string.so we call JSON.stringify() to convert data
	//object to string.
	conn.send(JSON.stringify(data))

}


//now lets say someone joins with username that already exist 
//in our array. when this happens we dont wants to store that name
//so we have to check if any user exists then we dont add that username
//to do that we will create a function called findUser.so we will
//compare the username of array and username in findUser function
//matches or not.if it matches then it returns a connection.
function findUser(username) {
	for (let i = 0;i < users.length;i++){
		if(users[i].username == username)
			return users[i]
	}
}
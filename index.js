var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Mongo = require('mongodb')
var monk = require('monk');
var db = monk('localhost:27017/chat_app');
var bodyParser = require('body-parser')

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var users = [];

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
var user_id;
io.use(function(socket, next) {
  user_id = socket.handshake.query.user;
  console.log("middleware : " + user_id + ", socket id : " + socket.id);
  socket.db = db;
  next();
});

app.get('/user/:userid', function(req,res){
	var collection = db.get('users');
	collection.findOne({user_id:req.params.userid},function(e,docs){
    	res.render("index", {
			userdata: docs,
		});
  	});
	
});

app.post('/getChatMessages', function(req,res){
	var collection = db.get('messages');
  	console.log(req.body.user1);
  	collection.find(
  		{$or:[
  			{user:req.body.user1,to:req.body.user2},
  			{user:req.body.user2,to:req.body.user1}
  		]},{ limit : 10 }, function(e,docs){
    	res.send(docs);
  	});
	
});

io.on('connection', function(socket){
	var collection = db.get('users');
  	collection.findOne({user_id:user_id},function(e,docs){
    });
  	
  	// if user joins the network create saparate group for the user with unique user id.
  	socket.on('join', function (data) {
	    socket.join(data.user);
	});

  	// below code will handel the operation if user send messages.
	socket.on('chat message', function(data){
		console.log(data);
		var db = socket.db;
		data.timestamp = Date.now();
		db.get('messages').insert([data]);
	  	io.to(data.to).to(data.user).emit('chat message',data);
	})
	
	// use below code to perform operations if user diconnects from network.
	socket.on('disconnect', function(){
	})
});

http.listen(3000, function(){
	console.log("listening to port 3000");
})

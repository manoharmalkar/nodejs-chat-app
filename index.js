var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Mongo = require('mongodb')
var monk = require('monk');
var db = monk('localhost:27017/chat_app');

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
    	//console.log(docs);
    	//console.log("here");
    	res.render("index", {
			userdata: docs,
		});
  	});
	
});

/*app.get('/', function(req,res){
	res.render("index", {username: 'user'+Date.now()});
});*/


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
	  	io.to(data.to).to(data.user).emit('chat message',data);
	})
	
	// use below code to perform operations if user diconnects from network.
	socket.on('disconnect', function(){
	})
});

http.listen(3000, function(){
	console.log("listening to port 3000");
})

 const express = require('express');
 const path = require('path');
 var mysql = require('mysql');



 var con = mysql.createConnection({
   host: "localhost",
   user: "root",
   password: "sriram",
   database: "testdb"
 });

 con.connect(function(err) {
   if (err) throw err;
   console.log("Connected!");
   var sql = "CREATE TABLE IF NOT EXISTS users (name VARCHAR(255), password VARCHAR(200) ,wins INT)";
   con.query(sql, function (err, result) {
     if (err) throw err
         ;
     console.log("Table created");
   });
 });

 const app = express();
 const server = require('http').Server(app);
 const io = require('socket.io')(server);

 var bodyParser = require('body-parser');
 app.use(bodyParser.urlencoded({ extended: false })) 
 app.use(bodyParser.json());


 let rooms = 0;

 app.use(express.static('.'));

 app.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, 'game.html'));
 });
 app.post('/register', function(request, response){
   console.log(request.body.name); 
   var post={name:request.body.name , password:request.body.password, wins:0};
   let userName=request.body.name;
   var query = con.query('INSERT INTO users SET ?', post, function(err, result) {
     if(err) throw err;
     console.log("1 record inserted");
  
  });
  console.log(query.sql);
  response.redirect('/');
    /*var sql = "INSERT INTO users (name, wins) VALUES ("userName", 0)";
     con.query(sql, function (err, result) {
       if (err) throw err;
       console.log("1 record inserted");     
   });*/
  });
 app.post('/login',function(req,res){
  var name= req.body.name;  
  var password = req.body.password;
  var check=[name,password];
  console.log(check);


  con.query('SELECT * FROM users WHERE name = ? AND password=?',check,
  function (error, results, fields) {
   if (error) {
    console.log(error);
     res.send({
     "code":400,
       "failed":"error ocurred"
    });
   }else{
    /*res.send({
           "code":200,
           "success":"login sucessfull"
             });*/
             res.redirect('/gameLog.html');
    
    
   }
   });
 }); //login end
 var users={};
 io.on('connection', (socket) => {
    // var clients=io.socket.clients();
     //console.log(socket.id);
 //var clients = findClientsSocket();
    
     var clients = io.sockets.sockets[socket];

 //io.sockets.on('connect', function(client) { 
 //console.log("client connected");     
 //clients.push(client);     
 //console.log(clients); });     
 socket.on('createGame', (data) => {   
 //      users[socket.id]=data.name;         
 socket.join(`room-${++rooms}`);         
 socket.emit('newGame', { name: data.name, room: `room-${rooms}` });  //,players:clients     
});

        socket.on('joinGame', function (data) {
        	var room = io.nsps['/'].adapter.rooms[data.room];         
        	if (room && room.length === 1) {             
        		socket.join(data.room);            
        		socket.broadcast.to(data.room).emit('player1', {});             
        		socket.emit('player2', { name: data.name, room: data.room }) } 
        		else { socket.emit('err', { message: 'Sorry, The room is full!' });         
        	}     
        });

         socket.on('playTurn', (data) => {         
         	socket.broadcast.to(data.room).emit('turnPlayed', 
         		{ tile: data.tile, room: data.room });
    });

         socket.on('gameEnded', (data) => {     
         /*var query = con.query('SELECT wins FROM users where name=?', data.player, function(err, result)           
         {if(err) throw err;             
         var winUpdate=result+1;             
         var query2 = con.query('UPDATE users SET WINS=?', winUpdate, function(err, result) 
         {if(err) throw err;     console.log("1 record updated");
            });         
            console.log(query.sql);*/
        socket.broadcast.to(data.room).emit('gameEnd', data);
     });
 });

 server.listen(process.env.PORT || 5000);
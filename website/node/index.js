//
var http = require("http");
var mysql = require("mysql");
var dbconfig = require("db.json");
var con = mysql.createConnection({
	host : "localhost",
	user : dbconfig.user_name,
	password : dbconfig.password,
	database : dbconfig.database
});
console.log(dbconfig);
con.connect();
http.createServer(function(request, response){
	response.setHeader('Access-Control-Allow-Origin', "http://localhost");
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	response.setHeader("Content-Type", "application/json");
	//response.setHeader("Content-Type", "text/html");
	//request.on("data")
	if(request.url == "/getSymbols"){
		con.query("select * from symbols", function(){
			//console.log(arguments[1]);
			response.end(JSON.stringify(arguments[1]));
		});
	}else{
		response.end("hello jSymbolic! " + request.url);
		response.end();
	}
}).listen(8081);
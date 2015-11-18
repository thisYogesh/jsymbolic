//
var http = require("http");
http.createServer(function(request, response){
	response.setHeader("Content-Type", "text/html");
	//request.on("data")
	response.end("hello jSymbolic!");
}).listen(8081);
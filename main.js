var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express();
var measure = require('measure');
var getTimeStamp = measure.measure('timer1');
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	// ... INSERT HERE.
	client.lpush("requests", req.url);
});

app.get('/', function(req, res) {
	res.send('hello world');
});

app.get('/get', function(req, res) {
	{
		client.get("mykey", function(err, value){
			client.ttl("mykey", function(err, ttl){
				if(value != null){
					res.writeHead(200, {'content-type':'text/html'});
					res.write(`<h3>TTL: ${ttl} and the key value is ${value}</h3>`);
					res.end();
				}
				else{
					res.writeHead(200, {'content-type':'text/html'});
					res.write("<h3>Key expired..!!</h3>");
					res.end();
				}
			})
		})
	}
});

app.get('/set', function(req, res) {
	{
		client.set("mykey", "10 seconds to live", function(err, value){
			client.expire("mykey", 10, function(ttl){
				res.writeHead(200, {'content-type':'text/html'});
				res.write("<h3>mykey is set</h3>");
				res.end();
			})
		})
	}
});


app.get("/recent", function(req, res){
	client.lrange("requests", 0, 4, function(err, inn_res){
		if(err){
			console.log("Error occurred while fetching recent requests" + err);
		}else{
			res.send(inn_res);
		}
	});
});


app.get('/meow', function(req, res){
 	//if (err) throw err
	res.writeHead(200, {'content-type':'text/html'});
	client.rpop("cats", function(err, img_loc){
		res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+img_loc+"'/></h1>");
		res.end();
	})
});

app.post('/upload', [multer({ dest: './uploads/'}), function(req, res){
	//console.log(req.files);
	if(req.files.image){
		fs.readFile(req.files.image.path, function(err, image_link){
			if(err){
				throw err;
			}else{
				var image = new Buffer(image_link).toString('base64');
				client.rpush("cats", image);
				//console.log(image);
			}
		});
	}
	res.status(204).end();
}]);


app.get('/test', function(req, res){
	{
		res.writeHead(200, {'content-type':'text/html'});
		res.write("<h4>test</h4>");
		res.end();
	}
});

// HTTP SERVER
var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})

exports 
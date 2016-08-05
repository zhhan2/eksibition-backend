// =================================================================
// get the packages we need ========================================
// =================================================================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var News   = require('./app/models/news'); // get our news mongoose model
var Devices = require('./app/models/devices');
var appHelper = require('./helper.js');

var fs = require('fs');

// =================================================================
// configuration ===================================================
// =================================================================
mongoose.connect(config.database);
 // connect to database
app.set('superSecret', config.secret); // secret variable
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));


var authenticate = require('./authenticate');
app.use('/authenticate',authenticate);
// =================================================================
// routes ==========================================================
// =================================================================

// items route
var items = require('./routes/items');
app.use('/api/item', items);

var tickets = require('./routes/tickets');
app.use('/api/ticket', tickets);

var newsRoute = require('./routes/news');
app.use('/api/news', newsRoute);

var regNotification = require('./routes/regNotification');
app.use('/api/regNotification', regNotification);

var admin = require('./routes/admin');
app.use('/api/admin', admin);

var users = require('./routes/users');
app.use('/api/users', users);

app.use('/resources', express.static('resources'));

app.use('/panel/js',express.static('html/panel/js'));
app.use('/panel/css',express.static('html/panel/css'));
app.use('/panel/fonts',express.static('html/panel/fonts'));
app.use('/panel/img',express.static('html/panel/img'));
app.use('/panel/login', express.static('html/panel/login.html'));

// =================================================================
// set up apn agent ================================================
// =================================================================
var join = require('path').join;
var apnagent = require('apnagent');
var pfx = join(__dirname, './sslcert/aps_development_key.p12');
var agent = new apnagent.Agent();
agent.set('pfx file', pfx).set('passphrase', 'qazwsx123').enable('sandbox');
module.exports = agent;
agent.on('message:error', function (err, msg) {
  switch (err.name) {
    // This error occurs when Apple reports an issue parsing the message.
    case 'GatewayNotificationError':
      console.log('[message:error] GatewayNotificationError: %s', err.message);

      // The err.code is the number that Apple reports.
      // Example: 8 means the token supplied is invalid or not subscribed
      // to notifications for your application.
      if (err.code === 8) {
        console.log('    > %s', msg.device().toString());
        // In production you should flag this token as invalid and not
        // send any futher messages to it until you confirm validity
      }

      break;

    // This happens when apnagent has a problem encoding the message for transfer
    case 'SerializationError':
      console.log('[message:error] SerializationError: %s', err.message);
      break;

    // unlikely, but could occur if trying to send over a dead socket
    default:
      console.log('[message:error] other error: %s', err.message);
      break;
  }
});
/*!
 * Make the connection
 */
agent.connect(function (err) {
// gracefully handle auth problems
if (err && err.name === 'GatewayAuthorizationError') {
  console.log('Authentication Error: %s', err.message);
  process.exit(1);
}
// handle any other err (not likely)
else if (err) {
  throw err;
}
// it worked!
var env = agent.enabled('sandbox')
  ? 'sandbox'
  : 'production';

console.log('apnagent [%s] gateway connected', env);
});

// =================================================================
// API for push noti================================================
// =================================================================

app.use(appHelper.adminMiddleWare);

app.post('/push/:deviceToken/:newsId', function(req, res){
    var id = req.params.newsId;
    var deviceId = req.params.deviceToken;
    // push the news with newsId to the target device
    News.find({"newsId" : id}, function(err, newsArray){
      if (err) res.send(err);
      if (newsArray.length == 0) {
          res.json({
              success : false,
              message : 'can not find any item!'
          });
      } else {
        var news = newsArray[0];
        // res.json(news);
        agent.createMessage()
        .device(deviceId)
        .alert(news.title)
        .set('newsId', news.newsId)
        .set('tab', 3)
        .badge(1)
        .send();
        res.json({
          'success' : true
        });
      }
    });
});

app.post('/pushAll/:newsId', function(req, res){
    var id = req.params.newsId;
    // push the news with newsId to the target device
    News.find({"newsId" : id}, function(err, newsArray){
      if (err) res.send(err);
      if (newsArray.length == 0) {
          res.json({
              success : false,
              message : 'can not find any news!'
          });
      } else {
        var news = newsArray[0];
        Devices.find({},function(err, deviceArray){
          if (err) res.send(err);
          if (deviceArray.length == 0) {
              res.json({
                  success : false,
                  message : 'can not find any device!'
              });
          } else {
            for (var i = 0; i < deviceArray.length; i++){
              var token = deviceArray[i].token;
              console.log("deviceToken: " + token);
              agent.createMessage()
              .device(token)
              .alert(news.title)
              .set('newsId', news.newsId)
              .set('tab', 3)
              .badge(1)
              .send();
            }
          }
        });
      }
    });
    res.json({
      'message' : 'Notification with news no.' + id + ' pushed!'
    });
});

app.get('/pushLatestNews', function(req, res){
    console.log(0);
    News.find({}).sort({_id: -1}).limit(1).exec(function(err, newsArray){
      if (err) res.send(err);
      if (newsArray.length == 0) {
          res.json({
              success : false,
              message : 'can not find any news!'
          });
      } else {
        var news = newsArray[0];
        console.log(news);
        Devices.find({},function(err, deviceArray){
          console.log(3);
          if (err) res.send(err);
          if (deviceArray.length == 0) {
              res.json({
                  success : false,
                  message : 'can not find any device!'
              });
          } else {
            console.log(4);
            for (var i = 0; i < deviceArray.length; i++){
              var token = deviceArray[i].token;
              console.log("deviceToken: " + token);
              agent.createMessage()
              .device(token)
              .alert(news.title)
              .set('newsId', news.newsId)
              .set('tab', 3)
              .badge(1)
              .send();
            }
            res.status(200).send();
          }
        });
    }
  });
});
//

// =================================================================
// build the push ui ===============================================
// =================================================================


app.get('/panel/home', function(req, res){
    fs.readFile("./html/panel/index.html", function(err, text){
      res.setHeader("Content-Type", "text/html");
      res.end(text);
    });
});

app.get('/panel/newsDetail', function(req, res){
  fs.readFile("./html/panel/newsDetail.html", function(err, text){
      res.setHeader("Content-Type", "text/html");
      res.end(text);
    });
});

app.get('/panel/addItem',function(req, res){
  fs.readFile("./html/panel/addItem.html", function(err, text){
      res.setHeader("Content-Type", "text/html");
      res.end(text);
    });
});

app.get('/panel/itemList', function(req, res){
  fs.readFile("./html/panel/itemList.html", function(err, text){
      res.setHeader("Content-Type", "text/html");
      res.end(text);
    });
});

app.get('/panel/editItem', function(req, res){
  fs.readFile("./html/panel/editItem.html", function(err, text){
      res.setHeader("Content-Type", "text/html");
      res.end(text);
    });
});

// app.get('/panel/user', function(req, res){
//   fs.readFile("./html/panel/user.html", function(err, text){
//       res.setHeader("Content-Type", "text/html");
//       res.end(text);
//     });
// });

// app.get('/panel/order', function(req, res){
//   fs.readFile("./html/panel/order.html", function(err, text){
//       res.setHeader("Content-Type", "text/html");
//       res.end(text);
//     });
// });

// app.get('/panel/newsList', function(req, res){
//   fs.readFile("./html/panel/newsList.html", function(err, text){
//       res.setHeader("Content-Type", "text/html");
//       res.end(text);
//     });
// });

// app.get('/panel/addNews', function(req, res){
//   fs.readFile("./html/panel/addNews.html", function(err, text){
//       res.setHeader("Content-Type", "text/html");
//       res.end(text);
//     });
// });

// =================================================================
// start the server ================================================
// =================================================================

var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('./sslcert/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

// http.createServer(app).listen(8080, function(){
//   console.log("Express server HTTP listening on port 8080");
// });
https.createServer(credentials, app).listen(8081, function(){
  console.log("Express server HTTPS listening on port 8081");
});

console.log('Magic happens at https://elvinjin.com');

console.log('Starting the server');
var express = require('express');
var request = require('request');
const PORT = 8000;
var app = express();

var server = app.listen(PORT, () => {
  console.log('Server running on '+ PORT);
});

app.use(express.static('public'));

app.get('/get-html', function(req, resp) {
  request('https://www.google.com/', function (error, response, body) {
    if (response && response.statusCode === 200 && response.headers['content-type'].indexOf('text/html') > -1) {
      resp.send(body.toString());
      return;
    }
    resp.send({ error: error });
  });
})

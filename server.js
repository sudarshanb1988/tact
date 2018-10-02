console.log('Starting the server');
var express = require('express');
var request = require('request');
var timeout = require('connect-timeout');
const PORT = 8000;
var app = express();

var server = app.listen(PORT, () => {
  console.log('Server running on '+ PORT);
});

app.use(express.static('public'));

app.use(timeout('120s'));

app.get('/get-html', function(req, resp) {
  var url = req.query.url;
  if (!url) {
    resp.send({ error: 'No request url present' });
    return;
  }
  if (url && !url.match(/^http(s)?:\/\//)){
    url = 'http://'+url;
  }
  request(url, function (error, response, body) {
    if (response && response.statusCode === 200 && response.headers['content-type'].indexOf('text/html') > -1) {
      resp.send({ data: body.toString() });
      return;
    }
    resp.send({ error: error });
  });
})

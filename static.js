const express = require('express');
const app = express();
const fs = require('fs');

app.use('/', express.static(__dirname + '/client/'));
app.get('/', (req, res) => res.sendFile('./client/index.html'));

const httpServer = require('http').createServer(app);
const httpsServer = require('https').createServer({
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost.pem')
}, app);

httpServer.listen(1001);
httpsServer.listen(1000);
const express = require('express');
const app = express();
const server = require('http').Server(app);

app.use('/', express.static(__dirname + '/client/'));
app.get('/', (req, res) => res.sendFile('./client/index.html'));
server.listen(1000);
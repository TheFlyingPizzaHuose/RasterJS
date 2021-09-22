console.log('server.js started');

//Referencing dependecies
const express = require('express');
const body_parser = require("body-parser");
const path = require('path');
const { dirname } = require('path');
const app = express();
console.log('dependencies import success');

app.use(express.static(__dirname));

express.static.mime.define({'application/javascript': ['js']});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
  console.log('Website Visited')
});

app.listen(5000);
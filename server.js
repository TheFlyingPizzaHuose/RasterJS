console.log('server.js started');

//Referencing dependecies
const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs')
const date_ob = new Date();
console.log('dependencies import success');

app.use(express.static(__dirname));

express.static.mime.define({'application/javascript': ['js']});

function readWriteSync() {
  var data = fs.readFileSync('log.txt', 'utf-8');
  data+=('\nMM/DD/HH/mm: '+date_ob.getMonth()+'/'+date_ob.getDate()+'/'+date_ob.getHours()+'/'+date_ob.getMinutes());
  fs.writeFileSync('log.txt', data, 'utf-8');
}
app.get('/', (req,res)=>{
  res.redirect('/main')
})
app.get('/main', (req, res) => {
  readWriteSync();
  res.sendFile(path.join(__dirname + '/main.html'));
});


app.get('/screenOnly', (req, res)=>{
  res.sendFile(path.join(__dirname + '/fullscreen.html'));
})

app.listen(5000);
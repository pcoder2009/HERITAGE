const express = require("express");
const app = express();
const mysql = require('mysql');
const db = require('./mysql_connection');
const path = require('path');
const cors = require('cors');
app.use(cors());
const fs=require('fs');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});


app.use(express.urlencoded({extended: false}));
app.use(express.json());


const allowedExt = [
    '.js',
    '.ico',
    '.css',
    '.png',
    '.jpg',
    '.gif',
    '.jpeg',
    '.woff2',
    '.woff',
    '.ttf',
    '.svg',
    '.mp4',
  ];
  app.engine('html', require('ejs').renderFile);
  app.use(express.static(__dirname + './build'));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');


app.use('/user',require('./routes/user_routes'));
app.use('/admin',require('./routes/admin_routes'));
// app.use('/support',require('./routes/support_routes'));
app.use('/search',require('./routes/search_routes'));
app.use('/booking',require('./routes/booking_routes'));
app.use('/gateway',require('./routes/payment_routes'));
app.use('/site',require('./routes/site_route'));

// app.get('/', function(req, res){ 
//     res.render('pay', { 
//     key: process.env.stripe_Publishable_Key 
//     }) 
// })

// app.get('/', (req, res, next) => {
//     //res.sendFile('./pay.html');
//     fs.readFile(__dirname + '/pay.html', 'utf8', (err, text) => {
//         if(err){
//             res.status(400).end()
//         }else{
//             res.send(text);
//         }
//     });
// })

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
  
  
  
  // routes by Bipund
  const html = './build/'
  
  app.get('*', function (req, res, next) {
    if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
      res.sendFile(path.resolve(`./build/${req.url}`));
    } else {
      res.sendFile('index.html', {
        root: html
      });
    }
  });
// app.post('/log/success', (req, res, next) => {
//     //res.sendFile('./abc.html');
//     console.log(req);
//     res.send(req);
// })

app.listen(3001, (req, res) => {
    console.log('server running....');
})
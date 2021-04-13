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

app.use('/user',require('./routes/user_routes'));
app.use('/admin',require('./routes/admin_routes'));
// app.use('/support',require('./routes/support_routes'));
app.use('/search',require('./routes/search_routes'));
app.use('/booking',require('./routes/booking_routes'));

// app.use('/payment',require('./routes/payment_routes'));
// app.use('/location',require('./routes/car_location_routes'));
// app.use('/blog',require('./routes/blog_routes'));
// app.use('/FAQ',require('./routes/faq_routes'));

// app.get('/', function(req, res){ 
//     res.render('pay', { 
//     key: process.env.stripe_Publishable_Key 
//     }) 
// })

app.get('/', (req, res, next) => {
    //res.sendFile('./pay.html');
    fs.readFile(__dirname + '/pay.html', 'utf8', (err, text) => {
        if(err){
            res.status(400).end()
        }else{
            res.send(text);
        }
    });
})

// app.post('/log/success', (req, res, next) => {
//     //res.sendFile('./abc.html');
//     console.log(req);
//     res.send(req);
// })

app.listen(3001, (req, res) => {
    console.log('server running....');
})
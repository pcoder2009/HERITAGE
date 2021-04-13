const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');
const nanoid = require('nanoid')
const stripe = require('stripe')(process.env.stripe_Secret_Key);
//const bookingcall = require('./booking');
let nid = nanoid.nanoid()
exports.payment= (req, res) =>{ 
    const{email, amount, stripeToken}=req.body
    // const id = req.tokenObject.id
    // console.log(id)
    
    stripe.customers.create({ 
      email: email,
      token: stripeToken, 
    //   source: req.body.stripeToken, 
      name: "TRIPTI", 
      address: { 
          line1: 'TC 9/4', 
          postal_code: '110', 
          city: 'BHILAI', 
          state: 'Delhi', 
          country: 'India', 
      } 
  }) 
  .then((customer) => { 

      return stripe.charges.create({ 
          amount: amount*100,  
          description: 'Development Product', 
          currency: 'usd', 
          customer: customer.id ,
          receipt_email: email
      },{nid}); 
    }) 
  .then((charge) => { 
      console.log("amount", amount);
      console.log("nanoid:", nid);
      res.status(200).send("Success") // If no error occurs 
      //bookingcall.roomBook(id,room_id, start_date, end_date, start_time, end_time, no_of_rooms);
    }) 
  .catch((err) => { 
      res.send(err)    // If some error occurs 
  }); 
} 
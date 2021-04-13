const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');
const stripe = require('stripe')(process.env.stripe_Secret_Key);

exports.payment= (req, res) =>{ 

  stripe.customers.create({ 
      email: req.body.stripeEmail, 
      source: req.body.stripeToken, 
      name: 'Gautam', 
      address: { 
          line1: 'TC 9/4', 
          postal_code: '110', 
          city: 'Delhi', 
          state: 'Delhi', 
          country: 'India', 
      } 
  }) 
  .then((customer) => { 

      return stripe.charges.create({ 
          amount: 100,  
          description: 'Web Development Product', 
          currency: 'INR', 
          customer: customer.id 
      }); 
  }) 
  .then((charge) => { 
      res.send("Success") // If no error occurs 
  }) 
  .catch((err) => { 
      res.send(err)    // If some error occurs 
  }); 
} 
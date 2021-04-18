const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');

exports.about_us=(req,res,next)=>{
    // insert query
        db.query("select * from site_details",(err,result)=>{
            if(err){
                console.log(err)
                return res.status(400)
            }else{
                return res.status(200).send(result)
            }
        })


}

exports.insert=(req,res,next)=>{
    
    

}
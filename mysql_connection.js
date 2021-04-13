const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});

const db=mysql.createPool({
    connectionlimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE
});

db.getConnection((error, conn)=>{
    if(error){
        console.log("eror",error);
    }
    else{
        console.log("mysql connected");
        conn.rollback();
        conn.release();
        
    }
});

module.exports = db;
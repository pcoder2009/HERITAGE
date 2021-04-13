const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');

//search by date
exports.dateSearch = async (req, res) => {
  const { start_date, end_date, start_time, end_time } = req.query;


  if (start_date && end_date && start_time && end_time) {
    db.getConnection(async (err, con) => {
      if (err) {
        con.release();
        return res.sendStatus(500);
      } else {
        con.beginTransaction(async (err) => {
          if (err) {
            con.release();
            //error
            res.sendStatus(500)
          } else {
            //==========================================
            con.query('SELECT room_id FROM bookings where (start_date > ? AND start_date < ?) OR (end_date > ? AND end_date < ?) OR ( start_date < ? AND end_date > ? )', [start_date, end_date, start_date, end_date, start_date, end_date], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                // let sum = {}; //{1: 4, 2:5} SUM(no_of_rooms) as sum_by_room_id  GROUP BY room_id

                // for(let i=0; i<results.length; i++){
                //   sum.results[i].room_id=results[i].sum_by_room_id;
                // }
                // console.log("sum data", sum);

                let room_id_list = [];

                room_id_list = results.map(data => {
                  return data.room_id
                })
                console.log("room_id_list : ", room_id_list)

                con.query('SELECT room_id FROM bookings where ((start_date=? AND end_date=? AND start_date!=end_date) OR ((start_date=? AND start_time<? AND (end_date>? OR (end_date=? AND end_time>=?)) ) OR (end_date=? AND end_time>? AND (start_date<? OR (start_date=? AND start_time<=?))))) ', [start_date, end_date, end_date, end_time, end_date, end_date, end_time, start_date, start_time, start_date, start_date, start_time], async (error, results1) => {
                  if (error) {
                    con.rollback();
                    con.release();
                    console.log(error);
                    return res.status(500).send({
                      message: "INTERNAL SERVER ERROR"
                    });
                  } else {

                    // for(let i=0; i<results1.length; i++){
                    //   sum.results1[i].room_id=results1[i].sum_by_room_id;
                    // }
                    // console.log("final sum data", sum);

                    await results1.map(data => {
                      if (room_id_list.indexOf(data.room_id) < 0) room_id_list.push(data.room_id)
                      return data.room_id
                    })
                    console.log("final_list : ", room_id_list);
                    //final array of car id which has to be excluded from car list given to frontend

                    con.query('SELECT id FROM room where id IN (?) AND rooms_left>?', [room_id_list.length > 0 ? room_id_list : -1, parseInt(0)], async (error, results2) => {
                      if (error) {
                        con.rollback();
                        con.release();
                        console.log(error);
                        return res.status(500).send({
                          message: "INTERNAL SERVER ERROR"
                        });
                      } else {
                        console.log("list from room room_left>0 : ", results2);
                        let reslist = [];

                        await results2.map(data => {
                          reslist.push(data.id)
                          return data.id
                        })
                        console.log("list exclude from final: ", reslist);

                        reslist = await reslist.map(data => {
                          let index = room_id_list.indexOf(data);
                          if (index > -1) {
                            return room_id_list.splice(index, 1)[0];
                          }
                        });
                        console.log('super final list: ', room_id_list);

                        con.query('SELECT * FROM room where id NOT IN (?)', [room_id_list.length > 0 ? room_id_list : -1], async (error, results3) => {
                          if (error) {
                            con.rollback();
                            con.release();
                            console.log(error);
                            return res.status(500).send({
                              message: "INTERNAL SERVER ERROR"
                            });
                          } else {
                            con.commit();
                            con.release();
                            console.log(results3);
                            return res.send({
                              data: results3
                            });
                          }
                        });
                      }
                    });


                  }
                });

              }
            });

            //========================================================
          }
        })
      }
    })
  } else {
    console.log("error");
    return res.status(400).send({
      error: "please provide valid details"
    });
  }

}
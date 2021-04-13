const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');


//room booking api
exports.roomBook = async (req, res) => {
  const { room_id, start_date, end_date, start_time, end_time, no_of_rooms } = req.body;
  console.log("Request Recieved for : ", req.body);

  const id = req.tokenObject.id
  console.log(id)

  if (room_id && start_date && end_date && start_time && end_time && no_of_rooms) {
    db.getConnection((err, con) => {
      if (err) {
        return res.sendStatus(500);
      } else {
        con.beginTransaction((err) => {
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
                let room_id_list = [];

                room_id_list = results.map(data => {
                  return data.room_id
                })
                console.log("room_id_list : ", room_id_list)

                con.query('SELECT room_id FROM bookings where (start_date=? AND end_date=? AND start_date!=end_date) OR ((start_date=? AND start_time<? AND (end_date>? OR (end_date=? AND end_time>=?)) ) OR (end_date=? AND end_time>? AND (start_date<? OR (start_date=? AND start_time<=?)))) ', [start_date, end_date, end_date, end_time, end_date, end_date, end_time, start_date, start_time, start_date, start_date, start_time], async (error, results1) => {
                  if (error) {
                    con.rollback();
                    con.release();
                    console.log(error);
                    return res.status(500).send({
                      message: "INTERNAL SERVER ERROR"
                    });
                  } else {


                    await results1.map(data => {
                      if (room_id_list.indexOf(data.room_id) < 0) room_id_list.push(data.room_id)
                      return data.room_id
                    })
                    console.log("final_list : ", room_id_list);
                    //final array of car id which has to be excluded from car list given to frontend
                    console.log(`${room_id} in list ${room_id_list} give ${room_id_list.indexOf(parseInt(room_id))}`)

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

                        if (room_id_list.indexOf(parseInt(room_id)) < 0) {
                          con.query('SELECT * FROM room where ? AND status="active" AND rooms_left>?', [{ id: room_id }, parseInt(0)], (error, results) => {
                            if (error) {
                              con.rollback();
                              con.release();
                              console.log(error);
                              return res.status(500).send({
                                message: "INTERNAL SERVER ERROR"
                              });
                            } else {
                              console.log("results=>query3:  ", results);

                              //c_id=results[0].id;
                              if ((results.length > 0) && results[0].rooms_left>no_of_rooms) {
                                con.query('INSERT INTO bookings SET ? ', { room_id: room_id, start_date: start_date, end_date: end_date, start_time: start_time, end_time: end_time, user_id: id, no_of_rooms: no_of_rooms }, (error, results) => {
                                  if (error) {
                                    con.rollback();
                                    con.release();
                                    console.log(error);
                                    return res.status(500).send({
                                      message: "INTERNAL SERVER ERROR"
                                    });
                                  } else {
                                    con.query('SELECT * FROM bookings b where room_id=? AND start_date=? AND end_date=? AND start_time=? AND end_time=? AND user_id=? AND no_of_rooms=? ', [room_id, start_date, end_date, start_time, end_time, id, no_of_rooms], (error, results3) => {
                                      if (error) {
                                        con.rollback();
                                        con.release();
                                        console.log(error);
                                        return res.status(500).send({
                                          message: "INTERNAL SERVER ERROR"
                                        });
                                      } else {
                                        con.query('SELECT * FROM room where id=? && status="active"  ', [room_id], (error, results4) => {
                                          if (error) {
                                            con.rollback();
                                            con.release();
                                            console.log(error);
                                            return res.status(500).send({
                                              message: "INTERNAL SERVER ERROR"
                                            });
                                          } else {
                                            console.log("results4=> ", results4);
                                            let rooms = results4[0].rooms_left;
                                            rooms = rooms - no_of_rooms;

                                            con.query('UPDATE room SET ? where ? && status ="active"', [{ rooms_left: rooms }, { id: id }], async (error, result5) => {
                                              if (error) {
                                                con.rollback();
                                                con.release();
                                                console.log(error);
                                                return res.status(500).send({
                                                  message: "INTERNAL SERVER ERROR"
                                                });
                                              } else {
                                                console.log("result5 update romm_number=> ", result5);
                                                con.query('SELECT * FROM room where id=? && status="active"  ', [room_id], (error, results6) => {
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
                                                    console.log("result6 update romm_number=> ", results6);
                                                    return res.send({
                                                      message: 'booking successful',
                                                      ...results3,
                                                      results6
                                                    });
                                                  }
                                                })

                                              }
                                            });

                                          }
                                        });

                                      }
                                    });

                                  }
                                })
                              } else {
                                con.rollback();
                                con.release();
                                res.status(400).send({
                                  message: "room is not available"
                                })
                              }

                            }
                          });
                        } else {
                          con.rollback();
                          con.release();
                          res.status(400).send({
                            message: "room is not available"
                          })

                        }
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
      message: "please provide valid details"
    });
  }
}


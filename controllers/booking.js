const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');
const nodemailer = require('nodemailer');
const moment = require('moment');

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
                              if ((results.length > 0) && results[0].rooms_left > no_of_rooms) {
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
                                                    
                                                    let booking_id=results3[0].id;
                                                    console.log("results3", booking_id)
                                                    con.query('SELECT u.name, u.mobile, u.email, r.id as room_id, r.room_name, r.amount, r.amenities, r.no_of_person, b.id as booking_id, b.start_date, b.end_date, b.start_time, b.end_time FROM bookings b, room r, user u  where b.room_id=r.id AND b.user_id=u.id AND b.id=? ', [booking_id], (error, results7) => {
                                                      if (error) {
                                                        con.rollback();
                                                        con.release();
                                                        console.log(error);
                                                        return res.status(500).send({
                                                          message: "INTERNAL SERVER ERROR"
                                                        });
                                                      } else {
                                                        console.log("results7=> ", results7);
                                                        //no of days between two dates
                                                        let count = moment(results7[0].end_date).diff(moment(results7[0].start_date), 'days');
                                                        // console.log("count ",count)
                                                        let check_in=moment(results7[0].start_date, "YYYY-MM-DD").format("DD-MM-YYYY");
                                                        // console.log("check_in ",check_in)
                                                        let check_out=moment(results7[0].end_date, "YYYY-MM-DD").format("DD-MM-YYYY");
                                                        let transporter = nodemailer.createTransport({

                                                          service: "gmail",
                                                          auth: {
                                                            user: "firstheritageinn.official@gmail.com", //new mail
                                                            pass: "First@123",
                                                          },
                                                        });
                                                        //html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                                                        var mailOptions = {
                                                          from: "firstheritageinn.official@gmail.com",
                                                          to: ["motel.rantoul@gmail.com", results7[0].email],     //admin mail
                                                          subject: "BOOKING CONFIRMATION",
                                                          html: `<html lang="en">
                                                            <h4>BOOKING DETAILS</h4>
                                                            
                                                            User Name : ${results7[0].name}<br>
                                                            User Email : ${results7[0].email}<br>
                                                            User Mobile : ${results7[0].mobile}<br>
                                                            Room Id : ${results7[0].room_id}<br>
                                                            Room Name : ${results7[0].room_name}<br>
                                                            Room Amount : ${results7[0].amount}<br>
                                                            No of Persons : ${results7[0].no_of_person}<br>
                                                            Booking Id : ${results7[0].booking_id}<br>
                                                            Check In : ${check_in}<br>
                                                            Check Out : ${check_out}<br>
                                                            Number of Days : ${count}
                                                            
                                                      </html>`

                                                        };

                                                        transporter.sendMail(mailOptions, function (error, info) {
                                                          if (error) {
                                                            con.rollback();
                                                            con.release();
                                                            console.log(error);
                                                            return res.status(400).json(error);
                                                          } else {
                                                            con.commit();
                                                            con.release();
                                                            console.log("result6 update romm_number=> ", results6);
                                                            
                                                            
                                                            res.status(200).json({
                                                              message: 'booking successful',
                                                              ...results3,
                                                              results6
                                                        
                                                        
                                                            });
                                                          }
                                                        });
                                                        
                                                      }
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

//booking cancel 
exports.bookingCancel = async (req, res) => {
  const { booking_id } = req.body;
  console.log("Request Recieved for : ", req.body);

  if (booking_id) {
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
            con.query('SELECT * FROM bookings where status ="booked" && id=?', [booking_id], async (error, result1) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                if (result1.length > 0) {
                  con.query('UPDATE bookings SET status ="cancel" where ? ', [{ id: booking_id }], async (error, results2) => {
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
                      console.log(results2);
                      return res.send({
                        message: 'booking cancelled'
                      });
                    }
                  });
                } else {
                  con.rollback();
                  con.release();
                  console.log(results);
                  return res.send({
                    message: 'no data found',
                  });
                }

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

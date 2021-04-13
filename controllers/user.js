const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
const path = require('path');
const nanoid = require('nanoid');


//user signup api
exports.userregistration = (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { name, email, mobile, password, confirmpassword, address} = req.body;

  if (password != confirmpassword) {
    return res.send({
      message: 'password do not match'
    });
  }

  if (name && email && mobile && password && confirmpassword && address) {
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
            con.query('SELECT email from user where email=?', [email], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              }
              if (results.length > 0) {
                con.rollback();
                con.release();
                return res.send({
                  message: 'email is alreay registered'
                })
              }

              let hashedPassword = await bcrypt.hash(password, 8);
              console.log(hashedPassword);

              con.query('INSERT INTO user SET ?', { name: name, email: email, mobile: mobile, password: hashedPassword, address: address}, (error, results) => {
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
                  console.log(results);
                  return res.send({
                    message: 'user registered'
                  })
                }
              });
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



//login api
exports.userlogin = async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        message: 'please provide an email and password'
      })
    } else {
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
              con.query('SELECT * from user where email = ? && status = "active"', [email], async (error, results) => {
                if (error) {
                  con.rollback();
                  con.release();
                  return res.status(500).send({
                    message: "INTERNAL SERVER ERROR"
                  });
                }
                console.log(results);
                if (!results.length || !(await bcrypt.compare(password, results[0].password))) {
                  con.rollback();
                  con.release();
                  res.status(400).send({

                    message: 'incorrect email or password'
                  })
                }
                else {
                  const id = results[0].id;
                  const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                  });

                  con.commit();
                  con.release();
                  console.log('token: ' + token);

                  res.status(200).send({ message: "Login Successful", token: token, results });
                }
              })
              //========================================================
            }
          })
        }
      })
    }
  } catch (error) {
    console.log(error);
  }
}

//user update api
exports.userupdate = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const {name, mobile, address} = req.body;

  const id = req.tokenObject.id
  console.log(id)


  if (id) {
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
            con.query('SELECT * FROM user where ? && status ="active"', [{ id: id }], async (error, results1) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                
                if(results1.length > 0){
                  con.query('UPDATE user SET ? where ? && status ="active"', [{ name: name, mobile: mobile, address: address}, { id: id }], async (error, results) => {
                    if (error) {
                      con.rollback();
                      con.release();
                      console.log(error);
                      return res.status(500).send({
                        message: "INTERNAL SERVER ERROR"
                      });
                    } else {
                      con.query('SELECT * FROM user where ? AND status ="active"', [{ id: id }], async (error, results2) => {
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
                          console.log(results);
                          console.log(results2);
                          return res.send({
                            ...results1,
                            message: 'UPDATED SUCCESSFULLY',
                            results2
                          });
                        }
                      });
                    }
                  });
                }else{
                  con.rollback();
                  con.release();
                  console.log("user not found",error);
                  return res.status(400).send({
                    message: "user not found"
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
      message: "please provide valid details"
    });
  }

}



// user activation api
exports.activateuser = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { email, password } = req.body;


  if (email && password) {
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
            con.query('SELECT * from user where email = ? && status = "inactive"', [email], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                console.log(results[0]);
                if (!results.length || !(await bcrypt.compare(password, results[0].password))) {
                  con.rollback();
                  con.release();
                  res.status(400).send({

                    message: 'incorrect email or password'
                  })
                } else {
                  con.query('UPDATE user SET status ="active" where ? ', [{ email: email }], async (error, results) => {
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
                      console.log(results);
                      return res.send({
                        message: 'user activation successful'
                      });
                    }
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
      message: "please provide valid details"
    });
  }

}

//deactivate user api
exports.deactivateuser = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { password } = req.body;

  const id = req.tokenObject.id
  console.log(id)

  if (password) {
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
            con.query('SELECT password FROM user where ? ', [{ id: id }], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                console.log(results)
                db_pass = results[0].password;
                if (await bcrypt.compare(password, db_pass)) {
                  con.query('UPDATE user SET status ="inactive" where ? ', [{ id: id }], async (error, results) => {
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
                      console.log(results);
                      return res.send({
                        message: 'user deactivation successful'
                      });
                    }
                  });
                } else {
                  con.rollback();
                  con.release();
                  console.log("error");
                  return res.status(400).send({
                    message: "incorrect password"
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
      message: "please provide valid details"
    });
  }
}


//forgot password api for user 
exports.forgot = async (req, res) => {
  const { email } = req.body;
  let nid = nanoid.nanoid()
  console.log("nanoid:", nid);

  if (email) {
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
            con.query('SELECT id, email, name FROM user where status ="active" && email=?', [email], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                console.log(results);
                if (!results.length) {
                  con.rollback();
                  con.release();
                  res.status(400).send({

                    message: 'incorrect email'
                  })
                }
                else {
                  let name = results[0].name;
                  let email = results[0].email;
                  let id = results[0].id;

                  const token = jwt.sign({ email: email, id: id, name: name }, process.env.FORGOT_PASS_SECRET, {
                    expiresIn: process.env.FORGOT_PASS_EXPIRES
                  });
                  con.query('UPDATE user SET? where id=? && email=? && name=?', [{ master_password: nid }, id, email, name], (error, results) => {
                    if (error) {
                      con.rollback();
                      con.release();
                      console.log(error);
                      return res.status(500).send({
                        message: "INTERNAL SERVER ERROR"
                      });
                    } else {

                      let link = req.protocol + "://" + req.get('host') + "/verify" + token + "/" + nid;
                      let transporter = nodemailer.createTransport({

                        service: "gmail",
                        auth: {
                          user: "pcoder.test.innovate@gmail.com", //new mail
                          pass: "Pcoder123",
                        },
                      });
                      //html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                      var mailOptions = {
                        from: "pcoder.test.innovate@gmail.com",
                        to: email,     //admin mail
                        subject: "request for password reset",
                        html: "Hello, " + name + "<br> please click on the following link <a href=" + link + ">click here</a> to reset your password.<br> If you did not request this, please ignore this email and your password will remain unchanged."

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

                          console.log("Success! an email with password reset link has been sent to you " + info.response);
                          res.status(200).json({
                            data: " an email with password reset link has been sent to you",
                            success: true,
                            token: token,
                            masterPassword: nid,
                          });
                        }
                      });

                    }
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
      message: "please provide valid details"
    });
  }

}

//forgot password verify api for user
exports.forgotPassVerify = async (req, res) => {
  const { token, master_password, new_password, confirm_password } = req.body;

  if (token == null) {
    res.sendStatus(401)
    res.end();
    return
  } else {
    jwt.verify(token, process.env.FORGOT_PASS_SECRET, (err, obj) => {
      console.log(err)
      if (err) {
        res.sendstatus(403);
        res.end();
        return
      }
      req.passObject = obj
      console.log(obj)


    })
  }


  const email = req.passObject.email;
  console.log(email);
  const id = req.passObject.id;
  console.log(id);
  const name = req.passObject.name;
  console.log(name);

  let hashedNewPassword = await bcrypt.hash(new_password, 8);
  console.log(hashedNewPassword);

  if (master_password && new_password && confirm_password) {
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
            con.query('SELECT master_password FROM user where status ="active" && email=? && id =? && name =?', [email, id, name], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                db_master_pass = results[0].master_password;
                if (master_password === db_master_pass) {
                  if (new_password === confirm_password) {
                    con.query('UPDATE user SET password=? where status = "active" AND id=? && email =? && name=?', [hashedNewPassword, id, email, name], async (error, results) => {
                      if (error) {
                        con.rollback();
                        con.release();
                        console.log(error);
                        return res.status(500).send({
                          message: "INTERNAL SERVER ERROR"
                        });
                      } else {
                        let transporter = nodemailer.createTransport({

                          service: "gmail",
                          auth: {
                            user: "pcoder.test.innovate@gmail.com", //new mail
                            pass: "Pcoder123",
                          },
                        });

                        var mailOptions = {
                          from: "pcoder.test.innovate@gmail.com",
                          to: email,     //admin mail
                          subject: "Your password has been changed",
                          html: "Hello<br>This is a confirmation mail that the password for your ZOOM CAR account with email" + email + "has been changed.",

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

                            console.log("Success! Your password has been changed" + info.response);
                            res.status(200).json({
                              data: " 'Success! Your password has been changed.'",
                              success: true,
                            });
                          }
                        });


                      }
                    });
                  } else {
                    con.rollback();
                    con.release();
                    res.status(400).send({

                      message: 'password do not match'
                    })
                  }
                } else {
                  con.rollback();
                  con.release();
                  res.status(400).send({

                    message: 'incorrect master password'
                  })
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
      message: "please provide valid details"
    });
  }

}

// reset user password
exports.resetPassword = async (req, res) => {

  console.log("Request Recieved for : ", req.body);

  const { old_password, new_password } = req.body;

  const id = req.tokenObject.id
  console.log(id)


  let hashedNewPassword = await bcrypt.hash(new_password, 8);
  console.log(hashedNewPassword);

  if (old_password && new_password) {
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

            con.query('SELECT password, email FROM user where status ="active" && ?', [{ id: id }], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                let email = results[0].email;
                console.log(results[0].password);
                //console.log(hashedOldPassword);
                if ((await bcrypt.compare(old_password, results[0].password))) {
                  con.query('UPDATE user SET password=? where status = "active" AND id=? ', [hashedNewPassword, id], async (error, results) => {
                    if (error) {
                      con.rollback();
                      con.release();
                      console.log(error);
                      return res.status(500).send({
                        message: "INTERNAL SERVER ERROR"
                      });
                    } else {
                      let transporter = nodemailer.createTransport({

                        service: "gmail",
                        auth: {
                          user: "pcoder.test.innovate@gmail.com", //new mail
                          pass: "Pcoder123",
                        },
                      });

                      var mailOptions = {
                        from: "pcoder.test.innovate@gmail.com",
                        to: email,     //admin mail
                        subject: "Your password has been changed",
                        html: "Hello, <br>This is a confirmation mail that the password for your ZOOM CAR account with login id " + email + "has been changed.",
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

                          console.log("Success! Your password has been changed" + info.response);
                          res.status(200).json({
                            data: " 'Success! Your password has been changed.'",
                            success: true,
                          });
                        }
                      });


                    }
                  });

                } else {
                  con.rollback();
                  con.release();
                  res.status(400).send({

                    message: 'please enter valid old password'
                  })
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
      message: "please provide valid details"
    });
  }
}

//user email change api
exports.userEmailChange = async (req, res) => {
  const { email } = req.body;
  console.log("Request Recieved for : ", req.body);
  const id = req.tokenObject.id
  console.log(id)


  if (email) {
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
            con.query('SELECT email from user where email=?', [email],async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                  
                  if (results.length > 0) {
                    con.rollback();
                    con.release();
                    res.status(400).send({

                      message: 'email already exist'
                    })
                  } else {
                    con.query('UPDATE user SET email = ? where ?', [email, { id: id }], async (error, results) => {
                      if (error) {
                        con.rollback();
                        con.release();
                        console.log(error);
                        return res.status(500).send({
                          message: "INTERNAL SERVER ERROR"
                        });
                      } else {
                        con.query('SELECT email from user where id=?', [id],async (error, results) => {
                          if (error) {
                            con.rollback();
                            con.release();
                            console.log(error);
                            return res.status(500).send({
                              message: "INTERNAL SERVER ERROR"
                            });
                          }else{
                            con.commit();
                            con.release();
                            console.log(results);
                            return res.send({
                              message: 'email changed successfully',
                              data: results
                            });
                          }
                        });
                        
                      }
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
      message: "please provide an email"
    });
  }
}


//user list by id api
exports.userlistId = async (req, res) => {
  
  const id = req.tokenObject.id
  console.log(id)
  
  console.log("Request Recieved for : ",req.query);

  if (id) {
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
            con.query('SELECT * FROM user where status ="active" && id=?', [id], async (error, results) => {
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
                console.log(results);
                return res.send({
                  message: 'user list',
                  data: results
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


//list of booking done by user
exports.bookingListUser = async (req, res) =>{
  // const{user_id}=req.body;
  const id = req.tokenObject.id
  console.log(id);

  if (id) {
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
            con.query('SELECT b.id as booking_id, b.room_id, b.user_id, b.start_date, b.end_date, b.start_time, b.end_time, b.status, b.no_of_rooms FROM bookings b, user u where (b.user_id=u.id AND u.id=? AND b.user_id=?) AND u.status ="active" AND b.status="booked"', [id,id], async (error, results) => {
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
                console.log(results);
                return res.send({
                  message: 'user booking list',
                  data: results
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
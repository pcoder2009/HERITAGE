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
const AWS = require('aws-sdk');
const multer = require('multer');


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});



exports.loadImageToBuffer = multer({
  storage: multer.memoryStorage()

});

//admin registration api
exports.adminregistration = (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { name, email, mobile, password, confirmpassword, address } = req.body;

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
            con.query('SELECT email from admin where email=? && status ="active"', [email], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "please provide an email"
                });
              }
              if (results.length > 0) {
                con.rollback();
                con.release();
                return res.send({
                  message: 'email already registered'
                })
              }

              let hashedPassword = await bcrypt.hash(password, 8);
              console.log(hashedPassword);

              con.query('INSERT INTO admin SET ?', { name: name, email: email, mobile: mobile, password: hashedPassword, address: address }, (error, results) => {
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
                    message: 'admin registered',
                    data: results
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

// admin login api
exports.adminlogin = async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        error: 'please provide an email and password'
      })
    }

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
            con.query('SELECT * from admin where email = ? && status = "active"', [email], async (error, results) => {
              if (error) {
                con.rollback();
                con.release();
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
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
                  const isAdmin = true;
                  const token = jwt.sign({ id: id, isAdmin: isAdmin }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                  });
                  con.query('SELECT * from admin where email = ? && status = "active"', [email], async (error, result1) => {
                    if (error) {
                      con.rollback();
                      con.release();
                      return res.status(500).send({
                        message: "INTERNAL SERVER ERROR"
                      });
                    } else {
                      con.commit();
                      con.release();
                      console.log('token: ' + token);

                      res.status(200).send({ message: "Login Successful", token: token, data: result1 });
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



  } catch (error) {
    console.log(error);
  }
}

//admin profile update api
exports.adminUpdate = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { name, mobile, address } = req.body;

  const id = req.tokenObject.id
  console.log(id)

  let conditionObject;
  if (req.tokenObject.isAdmin) {
    conditionObject = true;
    //{created_by:id}
  }

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
            con.query('SELECT * FROM admin where ? && ? && status ="active"', [{ id: id }, conditionObject], async (error, results1) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {
                if (results1.length > 0) {
                  con.query('UPDATE admin SET ? where ? && ? && status ="active"', [{ name: name, mobile: mobile, address: address }, { id: id }, conditionObject], async (error, results) => {
                    if (error) {
                      con.rollback();
                      con.release();
                      console.log(error);
                      return res.status(500).send({
                        message: "INTERNAL SERVER ERROR"
                      });
                    } else {
                      con.query('SELECT * FROM admin where ? && ? && status ="active"', [{ id: id }, conditionObject], async (error, results2) => {
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
                          console.log("results1: ", results1);
                          console.log(results);
                          console.log("results2: ", results2);
                          return res.send({
                            ...results1,
                            message: 'UPDATED SUCCESSFULLY',
                            results2
                          });
                        }
                      });

                    }
                  });
                } else {
                  con.rollback();
                  con.release();
                  console.log(error);
                  return res.status(400).send({
                    message: "No data found"
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

//admin email change api
exports.adminEmailChange = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { email } = req.body;

  const id = req.tokenObject.id
  console.log(id)

  let conditionObject;
  if (req.tokenObject.isAdmin) {
    conditionObject = true;
  }

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
            con.query('SELECT * FROM admin where ? && ?', [{ email: email }, conditionObject], async (error, results) => {
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
                  con.query('UPDATE admin SET email = ? where ? && ?', [email, { id: id }, conditionObject], async (error, results) => {
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
                        message: 'email changed successfully'
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

//activate admin api
exports.activateAdmin = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { email, password } = req.body;


  if (email && password) {
    db.getConnection((err, con) => {
      if (err) {
        con.release();
        return res.sendStatus(500);
      } else {
        con.beginTransaction((err) => {
          if (err) {
            con.release();
            //error
            res.sendStatus(500)
          } else {
            //==========================================
            con.query('SELECT * from admin where email = ? && status = "inactive"', [email], async (error, results) => {
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
                  con.query('UPDATE admin SET status ="active" where ? ', [{ email: email }], async (error, results) => {
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
                        message: 'admin activation successful'
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


//deactivate admin api
exports.deactivateAdmin = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { email } = req.body;

  const id = req.tokenObject.id
  console.log(id)

  db.getConnection((err, con) => {
    if (err) {
      con.release();
      return res.sendStatus(500);
    } else {
      con.beginTransaction((err) => {
        if (err) {
          con.release();
          //error
          res.sendStatus(500)
        } else {
          //==========================================
          con.query('UPDATE admin SET status ="inactive" where ? AND status="active" ', [{ id: id }], async (error, results) => {
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
          //========================================================
        }
      })
    }
  })

}

//forgot password api for admin 
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
            con.query('SELECT id, email, name FROM admin where status ="active" && email=?', [email], async (error, results) => {
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
                  con.query('UPDATE admin SET? where id=? && email=? && name=?', [{ master_password: nid }, id, email, name], (error, results) => {
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
                            masterPassword: nid
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

//forgot password verify api
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
        res.sendStatus(403);
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
            con.query('SELECT master_password FROM admin where status ="active" && email=? && id =? && name =?', [email, id, name], async (error, results) => {
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
                    con.query('UPDATE admin SET password=? where status = "active" AND id=? && email =? && name=?', [hashedNewPassword, id, email, name], async (error, results) => {
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

// reset admin password
exports.resetPassword = async (req, res) => {

  console.log("Request Recieved for : ", req.body);

  const { old_password, new_password } = req.body;

  const id = req.tokenObject.id
  console.log(id)

  let conditionObject;
  if (req.tokenObject.isAdmin) {
    conditionObject = true;
  }

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

            con.query('SELECT password, email FROM admin where status ="active" && ? && ?', [conditionObject, { id: id }], async (error, results) => {
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
                  con.query('UPDATE admin SET password=? where status = "active" AND id=? ', [hashedNewPassword, id], async (error, results) => {
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


//room creation api
exports.createRoom = async (req, res) => {
  const { room_name, description, amount, amenities, no_of_person, no_of_rooms } = req.body;
  console.log("Request Recieved for : ", req.body);

  const id = req.tokenObject.id
  console.log(id)

  if (room_name && description && amount && amenities && no_of_person && no_of_rooms) {
    db.getConnection(async (err, con) => {
      if (err) {
        return res.sendStatus(500);
      } else {
        con.beginTransaction(async (err) => {
          if (err) {
            con.release();
            //error
            res.sendStatus(500)
          } else {
            //==========================================
            var d = new Date();
            console.log(req.files)


            var responseData = [];
            await req.files.map(async (item) => {
              var params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: d.toString() + item.originalname,
                Body: item.buffer,
                ACL: 'public-read'
              }
              console.log(params);
              await s3.upload(params, (error, data) => {
                console.log(error, data)
                if (error) {
                  con.rollback();
                  con.release();
                  return res.status(500).send(error);
                } else {
                  responseData.push(data.Location);
                  if (req.files.length == responseData.length) {

                    con.query('INSERT INTO room SET ?', [{ room_name: room_name, description: description, amount: amount, amenities: amenities, media: JSON.stringify(responseData), no_of_person: no_of_person, no_of_rooms: no_of_rooms, rooms_left: no_of_rooms }], async (error, results) => {
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
                          message: 'room created'
                        })
                      }

                    });
                  }

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

//room update api
exports.roomupdate = async (req, res) => {
  console.log("Request Recieved for : ", req.body);

  const { room_id, room_name, description, amount, amenities, no_of_person, no_of_rooms} = req.body;

  const id = req.tokenObject.id
  console.log(id)


  if (id && room_id) {
    db.getConnection(async (err, con) => {
      if (err) {
        return res.sendStatus(500);
      } else {
        con.beginTransaction(async (err) => {
          if (err) {
            con.release();
            //error
            res.sendStatus(500)
          } else {
            //==========================================
            con.query('SELECT * FROM room where ? && status ="active"', [{ id: room_id }], async (error, results1) => {
              if (error) {
                con.rollback();
                con.release();
                console.log(error);
                return res.status(500).send({
                  message: "INTERNAL SERVER ERROR"
                });
              } else {

                if (results1.length > 0) {
                  var d = new Date();
                  console.log(req.files)


                  var responseData = [];
                  await req.files.map(async (item) => {
                    var params = {
                      Bucket: process.env.AWS_BUCKET_NAME,
                      Key: d.toString() + item.originalname,
                      Body: item.buffer,
                      ACL: 'public-read'
                    }
                    console.log(params);
                    await s3.upload(params, (error, data) => {
                      console.log(error, data)
                      if (error) {
                        con.rollback();
                        con.release();
                        return res.status(500).send(error);
                      } else {
                        responseData.push(data.Location);
                        if (req.files.length == responseData.length) {

                          con.query('UPDATE room SET ? where ? && status ="active"', [{ room_name: room_name, description: description, amount: amount, amenities: amenities, media: JSON.stringify(responseData), no_of_person: no_of_person, no_of_rooms: no_of_rooms }, { id: room_id }], async (error, results) => {
                            if (error) {
                              con.rollback();
                              con.release();
                              console.log(error);
                              return res.status(500).send({
                                message: "INTERNAL SERVER ERROR"
                              });
                            } else {
                              con.query('SELECT * FROM room where ? AND status ="active"', [{ id: room_id }], async (error, results2) => {
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
                        }

                      }


                    });
                  });



                } else {
                  con.rollback();
                  con.release();
                  console.log("room not found", error);
                  return res.status(400).send({
                    message: "room not found"
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

//list of room
exports.listRoom = async (req, res) => {

  // const id = req.tokenObject.id
  // console.log(id)

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
          con.query('SELECT * FROM room', async (error, results) => {
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
                message: 'room list',
                data: results
              });
            }
          });
          //========================================================
        }
      })
    }
  })
}

//list of room by id
exports.listRoomId = async (req, res) => {
  const { room_id } = req.query;
  console.log("Request Recieved for : ", req.query);

  // const id = req.tokenObject.id
  // console.log(id)

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
          con.query('SELECT * FROM room where id=?', [room_id], async (error, results) => {
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
                message: 'room list',
                data: results
              });
            }
          });
          //========================================================
        }
      })
    }
  })
}

//list of user
exports.listUser = async (req, res) => {

  // const id = req.tokenObject.id
  // console.log(id)

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
          con.query('SELECT * FROM user', async (error, results) => {
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
                message: 'room list',
                data: results
              });
            }
          });
          //========================================================
        }
      })
    }
  })
}

//list of user by id
exports.listUserId = async (req, res) => {
  const { user_id } = req.query;
  console.log("Request Recieved for : ", req.query);

  // const id = req.tokenObject.id
  // console.log(id)

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
          con.query('SELECT * FROM user where id=?', [user_id], async (error, results) => {
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
                message: 'room list',
                data: results
              });
            }
          });
          //========================================================
        }
      })
    }
  })
}
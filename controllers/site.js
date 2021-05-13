const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');
const AWS = require('aws-sdk');
const multer = require('multer');


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});



exports.loadImageToBuffer = multer({
  storage: multer.memoryStorage()

});

//about 
exports.about_us = (req, res, next) => {

	db.query("select * from site_details", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})


}

//update about
exports.update_about = (req, res, next) => {
	const { id, about } = req.body;
	console.log("Request received for: ", req.body);

	if (about) {
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
						con.query('SELECT * from site_details where id=?', [id], async (error, results) => {
							if (error) {
								con.rollback();
								con.release();
								console.log(error);
								return res.status(500).send({
									message: "INTERNAL SERVER ERROR"
								});
							} else {

								if (results.length > 0) {
									con.query('UPDATE site_details SET about = ? where ?', [about, { id: id }], async (error, results2) => {
										if (error) {
											con.rollback();
											con.release();
											console.log(error);
											return res.status(500).send({
												message: "INTERNAL SERVER ERROR"
											});
										} else {
											console.log(results2);

											con.query('SELECT * from site_details where id=?', [id], async (error, results1) => {
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
													console.log(results1);
													return res.send({
														message: 'updated successfully',
														data: results1
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
										message: "not found"
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

//facilities
exports.select_facilities = async (req, res) => {
	db.query("select * from facilities", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})
}

//facilities by id
exports.select_facilities_id = async (req, res) => {
	const {id} = req.body;
	console.log("Request received for: ", req.body);
	db.query("select * from facilities where id=?", [id], (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			console.log("result: ",result )
			return res.status(200).send(result)
		}
	})
}


//insert facilities
exports.add_facilities = (req, res, next) => {
	const {heading, description} = req.body;
	console.log("Request received for: ", req.body);
	console.log("media file: ", req.file);

	if(heading && description && req.file){
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
						
						var d = new Date();
						console.log(req.file)
	
						const params = {
							Bucket: process.env.AWS_BUCKET_NAME,
							Key: Date.now() + req.file.originalname,
							Body: req.file.buffer,
							ACL: 'public-read'
						}
						s3.upload(params, (error, data) => {
							console.log(error, data)
							if (error) {
								con.rollback();
								con.release();
								console.log("s3 error");
								return res.status(500).send(error);
							}
	
							con.query('INSERT INTO facilities SET ?', { heading: heading, description: description, images: data.Location}, (error, results) => {
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
										message: 'facilities added'
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
			message: "please provide an email"
		});
	}
  
	
}

//update facilities
exports.update_facilities = (req, res, next) => {
	const {id, heading, description} = req.body;
	console.log("Request received for: ", req.body);
	console.log("media file: ", req.file);

	
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
          
					var d = new Date();
					console.log(req.file)

					const params = {
						Bucket: process.env.AWS_BUCKET_NAME,
						Key: Date.now() + req.file.originalname,
						Body: req.file.buffer,
						ACL: 'public-read'
					}
					s3.upload(params, (error, data) => {
						console.log(error, data)
						if (error) {
							con.rollback();
							con.release();
							console.log("s3 error");
							return res.status(500).send(error);
						}

						con.query('UPDATE facilities SET ? where ?', [{heading: heading, description: description, images: data.Location}, { id: id }], (error, results) => {
							if (error) {
								con.rollback();
								con.release();
								console.log(error);
								return res.status(500).send({
									message: "INTERNAL SERVER ERROR"
								});
							} else {
								con.query('SELECT * from facilities where id=?', [id], async (error, results1) => {
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
											message: 'facilities UPDATED',
											data: results1
										})
									}
								});
								
							}
						});

					});
					

          //========================================================
        }
      })
    }
  })
	
}


//delete facilities
exports.delete_facilities = (req, res, next) => {
	const {id} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('DELETE FROM facilities WHERE id=? ', [id], (error, results) => {
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
								message: 'facilities deleted'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}


//insert faq
exports.add_faq = (req, res, next) => {
	const {question, answer} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('INSERT INTO faq SET ?', { question: question, answer: answer}, (error, results) => {
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
								message: 'faq added'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}


//update faq
exports.update_faq = (req, res, next) => {
	const { id, question, answer} = req.body;
	console.log("Request received for: ", req.body);

	
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
          con.query('SELECT * from faq where id=?', [id], async (error, results) => {
            if (error) {
              con.rollback();
              con.release();
              console.log(error);
              return res.status(500).send({
                message: "INTERNAL SERVER ERROR"
              });
            } else {

              if (results.length > 0) {
                con.query('UPDATE faq SET ? where ?', [{question: question, answer: answer}, { id: id }], async (error, results2) => {
                  if (error) {
                    con.rollback();
                    con.release();
                    console.log(error);
                    return res.status(500).send({
                      message: "INTERNAL SERVER ERROR"
                    });
                  } else {
                    console.log(results2);

                    con.query('SELECT * from faq where id=?', [id], async (error, results1) => {
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
                        console.log(results1);
                        return res.send({
                          message: 'updated successfully',
                          data: results1
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
                  message: "not found"
                });
              }
            }


          });

          //========================================================
        }
      })
    }
  })
	
}

//faq list
exports.select_faq = async (req, res) => {
	db.query("select * from faq", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})
}

//delete faq
exports.delete_faq = (req, res, next) => {
	const {id} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('DELETE FROM faq WHERE id=? ', [id], (error, results) => {
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
								message: 'faq deleted'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}

//insert policy
exports.add_policy = (req, res, next) => {
	const {heading, description} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('INSERT INTO policy SET ?', { heading: heading, description: description}, (error, results) => {
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
								message: 'policy added'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}
//update policy
exports.update_policy = (req, res, next) => {
	const { id, heading, description } = req.body;
	console.log("Request received for: ", req.body);

	
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
					con.query('SELECT * from policy where id=?', [id], async (error, results) => {
						if (error) {
							con.rollback();
							con.release();
							console.log(error);
							return res.status(500).send({
								message: "INTERNAL SERVER ERROR"
							});
						} else {

							if (results.length > 0) {
								con.query('UPDATE policy SET ? where ?', [{heading: heading, description: description}, { id: id }], async (error, results2) => {
									if (error) {
										con.rollback();
										con.release();
										console.log(error);
										return res.status(500).send({
											message: "INTERNAL SERVER ERROR"
										});
									} else {
										console.log(results2);

										con.query('SELECT * from policy where id=?', [id], async (error, results1) => {
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
												console.log(results1);
												return res.send({
													message: 'updated successfully',
													data: results1
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
									message: "not found"
								});
							}
						}
					});
					//========================================================
				}
			})
		}
	})	
}

//policy list
exports.select_policy = async (req, res) => {
	db.query("select * from policy", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})
}

//delete policy
exports.delete_policy = (req, res, next) => {
	const {id} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('DELETE FROM policy WHERE id=? ', [id], (error, results) => {
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
								message: 'policy deleted'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}


//insert room amenities
exports.add_room_amenities = (req, res, next) => {
	const {amenities} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('INSERT INTO room_amenities SET ?', { amenities: amenities}, (error, results) => {
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
								message: 'room amenities added'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}


//update room amenities
exports.update_room_amenities = (req, res, next) => {
	const { id, amenities} = req.body;
	console.log("Request received for: ", req.body);

	
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
          con.query('SELECT * from room_amenities where id=?', [id], async (error, results) => {
            if (error) {
              con.rollback();
              con.release();
              console.log(error);
              return res.status(500).send({
                message: "INTERNAL SERVER ERROR"
              });
            } else {

              if (results.length > 0) {
                con.query('UPDATE room_amenities SET ? where ?', [{amenities: amenities}, { id: id }], async (error, results2) => {
                  if (error) {
                    con.rollback();
                    con.release();
                    console.log(error);
                    return res.status(500).send({
                      message: "INTERNAL SERVER ERROR"
                    });
                  } else {
                    console.log(results2);

                    con.query('SELECT * from room_amenities where id=?', [id], async (error, results1) => {
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
                        console.log(results1);
                        return res.send({
                          message: 'updated successfully',
                          data: results1
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
                  message: "not found"
                });
              }
            }


          });

          //========================================================
        }
      })
    }
  })
	
}

//room amenities list
exports.select_room_amenities = async (req, res) => {
	db.query("select * from room_amenities", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})
}


//delete room_amenities
exports.delete_room_amenities = (req, res, next) => {
	const {id} = req.body;
	console.log("Request received for: ", req.body);

	
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
          
					con.query('DELETE FROM room_amenities WHERE id=? ', [id], (error, results) => {
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
								message: 'room_amenities deleted'
							})
						}
					});

          //========================================================
        }
      })
    }
  })
	
}



//update contact us
exports.update_contact_us = (req, res, next) => {
	const { id, phone, fax, email} = req.body;
	console.log("Request received for: ", req.body);

	
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
          con.query('SELECT * from contact_us where id=?', [id], async (error, results) => {
            if (error) {
              con.rollback();
              con.release();
              console.log(error);
              return res.status(500).send({
                message: "INTERNAL SERVER ERROR"
              });
            } else {

              if (results.length > 0) {
                con.query('UPDATE contact_us SET ? where ?', [{phone: phone, fax: fax, email: email}, { id: id }], async (error, results2) => {
                  if (error) {
                    con.rollback();
                    con.release();
                    console.log(error);
                    return res.status(500).send({
                      message: "INTERNAL SERVER ERROR"
                    });
                  } else {
                    console.log(results2);

                    con.query('SELECT * from contact_us where id=?', [id], async (error, results1) => {
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
                        console.log(results1);
                        return res.send({
                          message: 'updated successfully',
                          data: results1
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
                  message: "not found"
                });
              }
            }


          });

          //========================================================
        }
      })
    }
  })
	
}

//contact us list
exports.select_contactUs = async (req, res) => {
	db.query("select * from contact_us", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})
}

//site banner upload
exports.add_site_banner = async (req, res) => {

  console.log("Request Received for: ", req.files)

  //=====================
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
  var dateTime = year + "-" + month + "-" + date + "  " + hours + ":" + minutes + ":" + seconds;
  console.log(dateTime);


  //=====================
  if (req.files.length > 0) {
    db.getConnection((err, con) => {
      if (err) {
        con.release();
        return res.sendStatus(500);
      } else {
        con.beginTransaction(async (err) => {
          if (err) {
            con.release();
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

                    con.query('INSERT INTO site_banner SET ?', { image: JSON.stringify(responseData), datetime: dateTime}, (error, results) => {
                      if (error) {
                        con.rollback();
                        con.release();
                        console.log(error);
                        return res.status(500).send({
                          message: "INTERNAL SERVER ERROR"
                        });

                      } else {
                        console.log("insert", results);
                       
												con.commit();
												con.release();
												
												return res.send({
													message: 'banner image  added',
												});
                        
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


//edit site banner
exports.edit_site_banner = async (req, res) => {
	const{id}=req.body;
  console.log("Request Received for: ", req.body)
  
  //=====================
  if (id) {
    db.getConnection((err, con) => {
      if (err) {
        con.release();
        return res.sendStatus(500);
      } else {
        con.beginTransaction(async (err) => {
          if (err) {
            con.release();
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

                    con.query('UPDATE site_banner SET ? WHERE id=?', [{ image: JSON.stringify(responseData)}, id], (error, results) => {
                      if (error) {
                        con.rollback();
                        con.release();
                        console.log(error);
                        return res.status(500).send({
                          message: "INTERNAL SERVER ERROR"
                        });

                      } else {
                        console.log("updated", results);
												con.query('SELECT * from site_banner where id=?', [id], async (error, results1) => {
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
														console.log(results1);
														return res.send({
															message: 'updated successfully',
															data: results1
														});
													}
												});                        
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

//select all site banner
exports.select_site_banner = async (req, res) => {
	db.query("select * from site_banner", (err, result) => {
		if (err) {
			console.log(err)
			return res.status(400)
		} else {
			return res.status(200).send(result)
		}
	})
}

//select site banner by id
exports.select_site_banner_id = async (req, res) => {
	const{id}=req.query;
	console.log("request received for: ",req.query);
	if(id){
		db.query("select * from site_banner where id=?",[id], (err, result) => {
			if (err) {
				console.log(err)
				return res.status(400)
			} else {
				return res.status(200).send(result)
			}
		})
	}else {
    console.log("error");
    return res.status(400).send({
      message: "please provide valid details"
    });
  }
	
}

//delete site banner
exports.delete_site_banner = (req, res, next) => {
	const {id} = req.body;
	console.log("Request received for: ", req.body);

	if(id){
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
						
						con.query('DELETE FROM site_banner WHERE id=? ', [id], (error, results) => {
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
									message: 'site_banner deleted'
								})
							}
						});

						//========================================================
					}
				})
			}
		})
	}else {
	console.log("error");
	return res.status(400).send({
		message: "please provide valid details"
	});
	}
}
const db = require('../mysql_connection');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require("express");
const app = express();
const path = require('path');


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

//update facilities
exports.update_facilities = (req, res, next) => {
	const { id, common_areas, general_object, parking, services, food_drinks, pets, transport, reception_services, miscellaneous } = req.body;
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
					con.query('SELECT * from facilities where id=?', [id], async (error, results) => {
						if (error) {
							con.rollback();
							con.release();
							console.log(error);
							return res.status(500).send({
								message: "INTERNAL SERVER ERROR"
							});
						} else {

							if (results.length > 0) {
								con.query('UPDATE facilities SET ? where ?', [{ common_areas: common_areas, general_object: general_object, parking: parking, parking: parking, services: services, food_drinks: food_drinks, pets: pets, transport: transport, reception_services: reception_services, miscellaneous: miscellaneous }, { id: id }], async (error, results2) => {
									if (error) {
										con.rollback();
										con.release();
										console.log(error);
										return res.status(500).send({
											message: "INTERNAL SERVER ERROR"
										});
									} else {
										console.log(results2);

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

//update policy
exports.update_policy = (req, res, next) => {
	const { id, important_information, refund_policy, pre_pay_policy, photo_policy, rate_description, hotel_occupancy_policy } = req.body;
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
								con.query('UPDATE policy SET ? where ?', [{important_information: important_information, refund_policy:refund_policy, pre_pay_policy: pre_pay_policy, photo_policy: photo_policy, rate_description: rate_description, hotel_occupancy_policy: hotel_occupancy_policy}, { id: id }], async (error, results2) => {
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
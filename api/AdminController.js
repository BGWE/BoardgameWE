const db = require("./models/index");

exports.getUsers = function(req, res) {
  return db.User.findAll().then(users => {
    return res.status(200).json({
      "users": users.map(e => {
        e.password = undefined; // remove hashed password
        return e;
      })
    });
  });
};

exports.updateUserStatus = function(req, res) {
  if (req.body.validated === null) {
    return res.status(400).json({error: "'validated' field should be a boolean."});
  }
  return db.User.update({validated: req.body.validated}, {
    where: {id: req.body.id_user},
    fields: ["validated"]
  }).then(() => {
    return res.status(200).json({success: true});
  });
};

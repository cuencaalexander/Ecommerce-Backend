const { errorHandler } = require("../helpers/dbErrorHandler");
const { Order } = require("../models/order");
const User = require("../models/user");

exports.userById = (req, res, next, id) => {
  //id comes fro the route parameter, the id is the userId from the param
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user; //the user we got we put that in the profile obj.
    next();
  });
};

exports.read = (req, res) => {
  //we have to ensure we are not sending the hash passwrod and salt
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.update = (req, res) => {
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $set: req.body },
    { new: true },
    (err, user) => {
      if (err) {
        return res.status(400).json({
          error: "You are not authorized to perform this action",
        });
      }
      user.hashed_password = undefined;
      user.salt = undefined;
      return res.json(user);
    }
  );
};

exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];

  req.body.order.products.forEach((item) => {
    history.push({
      _id: item._id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.count,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount,
    });
  });

  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { history: history } },
    { new: true },
    (error, data) => {
      if (error) {
        return res.status(400).json({
          error: "Could not update user purchase history",
        });
      }
      next();
    }
  );
};

exports.purchaseHistory = (req, res) => {
  Order.find({ user: req.profile._id })
  .sort('-created')
  .populate("user", "_id name") //populate only certain fields
  .exec((err, orders) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(error)
      });
    }
    res.json(orders);
  });
}
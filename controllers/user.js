const User = require('../models/user');

exports.userById = (req, res, next, id) => {//id comes fro the route parameter, the id is the userId from the param
    User.findById(id).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        };
        req.profile = user;//the user we got we put that in the profile obj.
        next();
    });
};

exports.read = (req, res) => {//we have to ensure we are not sending the hash passwrod and
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

exports.update = (req, res) => {
    User.findOneAndUpdate({_id: req.profile._id}, {$set: req.body}, {new: true}, (err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'You are not authorized to perform this action'
            });
        };
        user.hashed_password = undefined;
        user.salt = undefined;
        return res.json(user);
    })
;}
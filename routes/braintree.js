const express = require("express");
const router = express.Router();

const { requireSignin, isAuth } = require("../controllers/auth");
const { userById } = require("../controllers/user");
const { generateToken } = require("../controllers/braintree");

router.get("/braintree/getToken/:userId", requireSignin, isAuth, generateToken);

router.param("userId", userById); //we call the userById method everytime there is a 'userId'

module.exports = router;

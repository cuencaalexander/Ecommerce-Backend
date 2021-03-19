const express = require('express');
const router = express.Router();

const { requireSignin, isAuth,isAdmin } = require('../controllers/auth');

const { userById, read, update, purchaseHistory } = require('../controllers/user');

router.get('/secret/:userId', requireSignin, isAuth, isAdmin, (req, res) => {//Signed in user was enough,
    res.json({//didnt have to match the currently authenticated userId to access the route, now It requires the logged in user and authenticated user to have the same id
        user: req.profile
    });
});

router.get('/user/:userId', requireSignin, isAuth, read);
router.put('/user/:userId', requireSignin, isAuth, update);
router.get('/orders/by/user/:userId', requireSignin, isAuth, purchaseHistory);

router.param('userId', userById);//everytime there is a userId in the route parameter the userById method will run and make the req.profile onj available in req

module.exports = router;
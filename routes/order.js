const express = require("express");
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require("../controllers/auth");
const { userById, addOrderToUserHistory } = require("../controllers/user");
const { create, listOrders, getStatusValues, orderById, updateOrderStatus } = require("../controllers/order");
const { decreaseQuantity } = require("../controllers/product");

router.post(
  "/order/create/:userId",
  requireSignin,
  isAuth,
  addOrderToUserHistory,
  decreaseQuantity,
  create
);

router.get('/order/list/:userId', requireSignin, isAuth, isAdmin, listOrders)
router.get('/order/status-values/:userId', requireSignin, isAuth, isAdmin, getStatusValues)
router.put('/order/:orderId/status/:userId', requireSignin, isAuth, isAdmin, updateOrderStatus)

router.param("userId", userById); //we call the userById method everytime there is a 'userId' in the router param, so this moddlew id called bef the other controller methods.
router.param("orderId", orderById);//method (middleware) that will give us the order by ID. updateOrderStatus is a controller method.

module.exports = router;

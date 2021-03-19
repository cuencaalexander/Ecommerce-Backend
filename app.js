const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); //we'll be saving the user credentials in a cookie
const cors = require("cors");
const expressValidator = require("express-validator");
require("dotenv").config();

//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const braintreeRoutes = require("./routes/braintree");
const orderRoutes = require("./routes/order");

//app
const app = express();

//db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB Connected"));

mongoose.connection.on("error", (err) => {
  console.log(`DB connection error: ${err.messsage}`);
});

//middlewares
app.use(morgan("dev"));
app.use(bodyParser.json()); //So that we get the JSON data from the req body
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

//routes middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", braintreeRoutes);
app.use("/api", orderRoutes);

//Just like in the browser env we have the doc object, in NodeJS we get the PROCESS obj
//The left of the || will be used exclusively when we push this appto production
const port = process.env.PORT || 8000;

//Rinning the APP, on which PORT this app we created will be listening on
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

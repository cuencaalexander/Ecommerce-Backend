const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const Product = require("../models/product");
const Category = require("../models/category");
const { errorHandler } = require("../helpers/dbErrorHandler");
const category = require("../models/category");
const { ESRCH } = require("constants");

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: "Product not found.",
        });
      }
      req.product = product;
      next();
    });
};

exports.read = (req, res) => {
  req.product.photo = undefined; //in the product obj we have the photo but we dont wanna send it in the req obj because its huge.
  return res.json(req.product);
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm(); //all the form data will be available here
  form.keepExtensions = true; //whatever extension emails will notbe removed
  form.parse(req, (err, fields, files) => {
    //thos 3 args we get from the req obj
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }

    const { name, description, price, category, quantity, shipping } = fields;

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required.",
      });
    }

    let product = new Product(fields);

    console.log("Files photo: ", files.photo);
    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "The size of the Image should be less than 1 MB.",
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json({ result });
    });
  });
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({
      message: `The product: '${req.product.name}', has been deleted successfully.`,
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm(); //all the form data will be available here
  form.keepExtensions = true; //whatever extension emails will notbe removed
  form.parse(req, (err, fields, files) => {
    //thos 3 args we get from the req obj
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }
    //Check for all fields
    // const { name, description, price, category, quantity, shipping } = fields;

    // if (
    //   !name ||
    //   !description ||
    //   !price ||
    //   !category ||
    //   !quantity ||
    //   !shipping
    // ) {
    //   return res.status(400).json({
    //     error: "All fields are required.",
    //   });
    // }

    let product = req.product;
    product = _.extend(product, fields);

    console.log("Files photo: ", files.photo);
    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "The size of the Image should be less than 1 MB.",
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json({ result });
    });
  });
};

/**
 * sell / arrival
 * by sell = /products?=sortBy=sold&order=desc&limit=4
 * by arrival = /products?=sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all the products are returned.
 * If we were to want to arrange by sell, this should come from the front end.
 * The query parameters can come from the front end client.
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6; //a number in string type comes from the url query, we need to convert that string into a number type.
  Product.find()
    .select("-photo")
    .populate("category") //the category field will be filled with category doc corresponding to the obj ID of the current user?
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found.",
        });
      }
      res.json({products});
    });
};

// It will find the products based on the req product category
// other products that have the same category will be returned but not the original product.

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({ _id: { $ne: req.product }, category: req.product.category }) //$ne means not including req.prod w particular _id
    .limit(limit)
    .populate("category", "_id name") //populate only certain fields
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found.",
        });
      }
      res.json(products);
    });
};

exports.listCategories = (req, res) => {
  Product.distinct("category", {}, (err, categories) => {
    //gets all the categories used in the product model, that are distinct in product. We found all the categories used in products,omitting repetitions.
    if (err) {
      return res.status(400).json({
        error: "Categories not found.",
      });
    }
    res.json(categories);
  });
};

// Whenever a checkbox is checked, an APi request will be made to the backend and fetch the products.
/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */

// route - make sure its post

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select("-photo") //we don't select the photo
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }
      res.json({
        size: data.length,
        data,
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.listSearch = (req, res) => {
  // create query object to hold search value and category value
  const query = {};
  // assign search value to query.name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" }; // i is for case insensitivity
    // assign vategory value to query.category
    if (req.query.category && req.query.category != "All") {
      query.category = req.query.category;
    }
    // find the product based on query object with 2 properties
    // search and category
    Product.find(query)
      .select("-photo")
      .exec((err, products) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        console.log("products", products);
        res.json(products);
      });
  }
};

exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  Product.bulkWrite(bulkOps, {}, (error, products) => {
    if (error) {
      return res.status(400).json({
        error: "Could not update product",
      });
    }
    next();
  });
};

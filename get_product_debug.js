const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const Product = require('./models/product');
    const products = await Product.find({ name: /Resort Avenue/i });
    console.log(JSON.stringify(products, null, 2));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

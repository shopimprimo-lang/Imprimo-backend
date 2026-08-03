const mongoose = require('mongoose');
const Product = require('./models/product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const count = await Product.countDocuments();
    console.log(`Total products in DB: ${count}`);
    const products = await Product.find().limit(2);
    console.log(products);
    mongoose.connection.close();
  })
  .catch(err => console.error(err));

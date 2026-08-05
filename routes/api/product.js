const express = require('express');
const router = express.Router();

const Product = require('../../models/product');
const Category = require('../../models/category');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');
const cloudinary = require('../../config/cloudinary');

// GET all products (admin)
// router.get('/', async (req, res) => {
//   try {
//     const products = await Product.find({}).populate('category', 'name');
//     res.status(200).json({ products });
//   } catch (error) {
//     res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
//   }
// });
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const products = await Product.find({})
      .populate('category', 'name')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(200).json({ products });
  } catch (error) {
    res.status(400).json({ error: 'Error fetching products' });
  }
});
// GET product by slug (public storefront) - MUST come before /:id
router.get('/item/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'No product found.' });
    res.status(200).json({ product });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// POST add product with variants
// router.post('/add', auth, role.check(ROLES.Admin, ROLES.Merchant, ROLES.Member), async (req, res) => {
//   try {
//     const { name, description, category, variants } = req.body;

//     if (!name || !description) {
//       return res.status(400).json({ error: 'Name and description are required.' });
//     }

//     if (!variants || !Array.isArray(variants) || variants.length === 0) {
//       return res.status(400).json({ error: 'At least one variant is required.' });
//     }

//     // Validate variants
//     const colors = variants.map(v => v.color?.toLowerCase());
//     const uniqueColors = new Set(colors);
//     if (uniqueColors.size !== colors.length) {
//       return res.status(400).json({ error: 'Each variant must have a unique color.' });
//     }

//     for (const v of variants) {
//       if (!v.color) return res.status(400).json({ error: 'Each variant must have a color.' });
//       if (!v.price || Number(v.price) <= 0) return res.status(400).json({ error: 'Each variant price must be greater than 0.' });
//     }

//     // Ensure exactly one default variant
//     const defaultCount = variants.filter(v => v.isDefault).length;
//     if (defaultCount === 0) variants[0].isDefault = true;
//     if (defaultCount > 1) variants.forEach((v, i) => { v.isDefault = i === 0; });

//     const product = new Product({ name, description, category: category || null, variants });
//     const saved = await product.save();

//     // Link product to category
//     if (category) {
//       await Category.findByIdAndUpdate(category, { $push: { products: saved._id } });
//     }

//     res.status(200).json({ success: true, message: 'Product added successfully!', product: saved });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
//   }
// });

router.post('/add', auth, role.check(ROLES.Admin, ROLES.Merchant, ROLES.Member), async (req, res) => {
  try {
    const { name, description, category, variants, amenities, price, images } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    let inputVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      inputVariants = variants;
    } else {
      inputVariants = [{
        name: 'Default',
        price: price !== undefined ? Number(price) : 0,
        description: '',
        isDefault: true,
        images: images || []
      }];
    }

    // Validate variant names/colors and prices
    const variantNames = inputVariants.map((v, index) => (v.color || v.name || (inputVariants.length === 1 ? 'Default' : `Option ${index + 1}`)).trim().toLowerCase());
    if (new Set(variantNames).size !== variantNames.length) {
      return res.status(400).json({ error: 'Each variant must have a unique name/flavour.' });
    }

    for (const v of inputVariants) {
      if (v.price !== undefined && (isNaN(Number(v.price)) || Number(v.price) < 0)) {
        return res.status(400).json({ error: 'Variant price must be a valid non-negative number.' });
      }
    }

    // Upload images to Cloudinary
    const updatedVariants = [];

    for (let index = 0; index < inputVariants.length; index++) {
      const v = inputVariants[index];
      let uploadedImages = [];

      if (v.images && Array.isArray(v.images)) {
        for (const img of v.images) {
          if (img && img.startsWith('data:image')) {
            const upload = await cloudinary.uploader.upload(img, { folder: 'products' });
            uploadedImages.push(upload.secure_url);
          } else if (img) {
            uploadedImages.push(img); // already a URL
          }
        }
      }

      const optionName = v.color || (inputVariants.length === 1 ? 'Default' : `Option ${index + 1}`);
      updatedVariants.push({
        name: optionName,
        modelName: v.modelName || '',
        sizeName: v.sizeName || '',
        color: optionName,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        sku: v.sku || '',
        variantType: v.variantType || 'color',
          sizes: Array.isArray(v.sizes) ? v.sizes.map(s => ({
          size: s.size || '',
          price: Number(s.price) || 0,
          stock: Number(s.stock) || 0
        })) : [],
        description: v.description || '',
        isDefault: v.isDefault || false,
        images: uploadedImages,
        duration: v.duration || '',
        capacity: v.capacity || '',
        maxGuests: v.maxGuests || '',
        roomType: v.roomType || '',
        serviceType: v.serviceType || ''
      });
    }

    // Ensure exactly one default variant
    const defaultCount = updatedVariants.filter(v => v.isDefault).length;
    if (defaultCount === 0 && updatedVariants.length > 0) {
      updatedVariants[0].isDefault = true;
    }

    const product = new Product({
      name,
      description,
      category: category || null,
      amenities: amenities || [],
      variants: updatedVariants
    });

    const saved = await product.save();

    if (category) {
      await Category.findByIdAndUpdate(category, { $push: { products: saved._id } });
    }

    res.status(200).json({
      success: true,
      message: 'Product added successfully!',
      product: saved
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Your request could not be processed. Please try again.' });
  }
});

// PUT update product
router.put('/update/:id', auth, role.check(ROLES.Admin, ROLES.Merchant, ROLES.Member), async (req, res) => {
  try {
    const { name, description, category, variants, isActive, amenities, price, images } = req.body;

    let inputVariants = undefined;
    if (variants !== undefined) {
      if (Array.isArray(variants) && variants.length > 0) {
        inputVariants = variants;
      } else {
        inputVariants = [{
          name: 'Default',
          price: price !== undefined ? Number(price) : 0,
          description: '',
          isDefault: true,
          images: images || []
        }];
      }

      const variantNames = inputVariants.map((v, index) => (v.color || v.name || (inputVariants.length === 1 ? 'Default' : `Option ${index + 1}`)).trim().toLowerCase());
      if (new Set(variantNames).size !== variantNames.length) {
        return res.status(400).json({ error: 'Each variant must have a unique name/flavour.' });
      }

      for (const v of inputVariants) {
        if (v.price !== undefined && (isNaN(Number(v.price)) || Number(v.price) < 0)) {
          return res.status(400).json({ error: 'Variant price must be a valid non-negative number.' });
        }
      }
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category || null;
    if (isActive !== undefined) product.isActive = isActive;
    if (amenities !== undefined) product.amenities = amenities || [];

    if (inputVariants !== undefined) {
      const updatedVariants = [];

      for (let index = 0; index < inputVariants.length; index++) {
        const v = inputVariants[index];
        let uploadedImages = [];

        if (v.images && Array.isArray(v.images)) {
          for (const img of v.images) {
            if (img && img.startsWith('data:image')) {
              // New base64 image → upload to Cloudinary
              const upload = await cloudinary.uploader.upload(img, { folder: 'products' });
              uploadedImages.push(upload.secure_url);
            } else if (img) {
              uploadedImages.push(img); // already a Cloudinary URL
            }
          }
        }

        const optionName = v.color || (inputVariants.length === 1 ? 'Default' : `Option ${index + 1}`);
        updatedVariants.push({
          name: optionName,
          modelName: v.modelName || '',
          sizeName: v.sizeName || '',
          color: optionName,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          sku: v.sku || '',
          variantType: v.variantType || 'color',
          sizes: Array.isArray(v.sizes) ? v.sizes.map(s => ({
            size: s.size || '',
            price: Number(s.price) || 0,
            stock: Number(s.stock) || 0
          })) : [],
          description: v.description || '',
          isDefault: v.isDefault || false,
          images: uploadedImages,
          duration: v.duration || '',
          capacity: v.capacity || '',
          maxGuests: v.maxGuests || '',
          roomType: v.roomType || '',
          serviceType: v.serviceType || ''
        });
      }

      const defaultCount = updatedVariants.filter(v => v.isDefault).length;
      if (defaultCount === 0 && updatedVariants.length > 0) {
        updatedVariants[0].isDefault = true;
      }

      product.variants = updatedVariants;
    }

    product.updated = new Date();
    const updated = await (await product.save()).populate('category', 'name');

    res.status(200).json({ success: true, message: 'Product updated successfully!', product: updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Your request could not be processed. Please try again.' });
  }
});

// DELETE product
router.delete('/delete/:id', auth, role.check(ROLES.Admin, ROLES.Merchant, ROLES.Member), async (req, res) => {
  try {
    await Product.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Product deleted successfully!' });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// GET single product by id (admin) - MUST be last to avoid shadowing other /:id routes
router.get('/:id',async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'No product found.' });
    res.status(200).json({ product });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

module.exports = router;


const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// upload image to cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "productCatalogue",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.log("Cloudinary Error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// create product
exports.createProduct = async (req, res) => {
  try {
    let imageUrl = "";

    // if image exists
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }
    
    const product = await Product.create({
      user: req.user._id,
      productName: req.body.productName,
      productCode: req.body.productCode,
      category: req.body.category,
      description: req.body.description,
      mrpPrice: req.body.mrpPrice,
      sellingPrice: req.body.sellingPrice,
      gst: req.body.gst,
      image: imageUrl,
    });
    

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get product
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get product by id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update product
exports.updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
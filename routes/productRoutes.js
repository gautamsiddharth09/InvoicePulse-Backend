const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer")

const protect = require("../middleware/authMiddleware");
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require("../controller/productController");

router.post("/", protect,upload.single("image"), createProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProductById);
router.put("/:id", protect,upload.single("image"), updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
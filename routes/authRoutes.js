const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUser,
  forgotPassword,
  resetPassword
} = require("../controller/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.put("/me", protect, updateUser);

module.exports = router;

// loginUser, getMe, updateUserProfile

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // get token from (cookies is object)
    const token = req.cookies.token;
    // checking token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }
    // decoded and verify my token, it is genuine or not, Secret key matches or not,token expiry
    // decoded = {id: "685f123abc456xyz", iat: 123456789,exp: 123456789}
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // user
    const user = await User.findById(decoded.id).select("-password");
    // user will find this
    // { _id: "...", name: "Rahul", email: "rahul@gmail.com" }

    // user's checking, Token is valid but user was deleted from database
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired token",
    });
  }
};

module.exports = authMiddleware;


// Get token from cookies
// Check if token exists
// Verify token using JWT_SECRET
// Extract user id from decoded token
// Find user in database
// Remove password field
// Attach user to req.user
// Call next()
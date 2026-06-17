const jwt = require("jsonwebtoken");
const User = require("../models/User");
const joi = require("joi");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
// generate jwt
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// register user
const registerUser = async (req, res) => {
  try {
    const registerSchema = joi.object({
      name: joi.string().trim().min(2).max(50).required(),
      email: joi.string().email().required(),
      password: joi.string().min(6).required(),
    });

    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, email, password } = value;

    const exitUser = await User.findOne({ email });

    if (exitUser) {
      return res.status(409).json({
        success: false,
        message: "User Already Exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
    });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: " user registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// login user
const loginUser = async (req, res) => {
  try {
    const loginSchema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    });

    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = value;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // password compare
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// logout user
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get me-- if user logged in
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// forgot password
const forgotPassword = async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().email().required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findOne({
      email: value.email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    console.log("RESET URL:", resetUrl);
    // link generate on email
    await sendEmail({
  email: user.email,
  subject: "Reset Your Password - Secure Link",
  message: `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
    
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
      
      <!-- Header -->
      <div style="background:#55636A;padding:20px;text-align:center;color:white;">
        <h2 style="margin:0;">Password Reset Request</h2>
      </div>

      <!-- Body -->
      <div style="padding:25px;color:#333;">
        <p style="font-size:16px;">Hi ${user.name || "User"},</p>

        <p style="font-size:15px;line-height:1.6;">
          We received a request to reset your password for your account. 
          Click the button below to securely reset it.
        </p>

        <p style="font-size:14px;color:#777;">
          ⚠️ This link will expire in <b>15 minutes</b> for your security.
        </p>

        <!-- Button -->
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" 
             style="
              background:#12D6C3;
              color:#ffffff;
              padding:12px 22px;
              border-radius:6px;
              text-decoration:none;
              font-weight:bold;
              display:inline-block;
             ">
            Reset Password
          </a>
        </div>

        <p style="font-size:13px;color:#888;word-break:break-all;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${resetUrl}" style="color:#12D6C3;">${resetUrl}</a>
        </p>

        <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />

        <p style="font-size:12px;color:#999;">
          If you did not request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#888;">
        © ${new Date().getFullYear()} Your Company. All rights reserved.
      </div>

    </div>
  </div>
  `,
});

    res.status(200).json({
      success: true,
      message: "Reset link generated successfully",
      resetUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(req.body.password, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Token expired or invalid",
    });
  }
};

// update user
const updateUser = async (req, res) => {
  try {
    const updateSchema = joi
      .object({
        name: joi.string().trim().min(3).max(50),
        email: joi.string().email(),
        password: joi.string().min(6).required(),
        businessName: joi.string().trim().max(100),
        address: joi.string().trim().max(200),
        phone: joi.string().trim().max(10),
      })
      .min(1);
    //  min(1) one field must be provided in the body

    const { error, value } = updateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // verifying password first
    const isMatch = await bcrypt.compare(value.password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // updating field
    if (value.name) user.name = value.name;

    //email checkin duplicate
    if (value.email) {
      const existing = await User.findOne({ email: value.email });

      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = value.email;
    }

    // business
    if (value.businessName) user.businessName = value.businessName;
    // address
    if (value.address) user.address = value.address;
    // phone
    if (value.phone) user.phone = value.phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUser,
  forgotPassword,
  resetPassword,
};

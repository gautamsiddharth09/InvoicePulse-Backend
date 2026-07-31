const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    default: "invoice",
  },
  sequence: {
    type: Number,
    default: 0,
  },
});

counterSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Counter", counterSchema);
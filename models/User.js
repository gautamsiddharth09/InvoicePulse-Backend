// model User.js

const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  email : {
    type : String,
    required : true,
    unique : true,
    lowercase : true
  },
  password : {
    type : String,
    required : true,
    minLength : 6,
    select : false
  },
  businessName : {
    type : String,
    default : "",
  },
  address : {
    type :String,
    default : ""
  },
  phone : {
    type :String,
    default : ""
  },
  
}, {timestamps : true})

module.exports = mongoose.model("User", userSchema)
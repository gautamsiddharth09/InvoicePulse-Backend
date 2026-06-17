const mongoose = require("mongoose")


const connectDB = async ()=>{
  try{
   await mongoose.connect(process.env.MONGO_URI, {})
   console.log("MongoDB coneected")
  }catch(error){
    console.error(`Data base connection error ${error.message}`)
     process.exit(1)
  }
  
}

module.exports = connectDB
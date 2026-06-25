
// const multer = require('multer')

// const storage = multer.diskStorage({
//     destination: function (req, file, cb){
//         cb(null, "uploads/")
//     },
//     filename: function (req, file, cb){
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() + 1E9) // If two users upload at the same time
//         cb(null, uniqueSuffix + '-' + file.originalname)
//     }
// })


// const fileFilter = (req, file, cb) => {
//     if(file.mimetype.startsWith('image')){
//         cb(null, true)
//     }else{
//         cb(new Error('Only Images are allowed!'), false)
//     }
// }

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// })

// module.exports = upload







const multer = require("multer");

// dont save file in disk, file store in RAM for temporary
const storageForFiles = multer.memoryStorage();

const upload = multer({
  storage: storageForFiles,
});

module.exports = upload;
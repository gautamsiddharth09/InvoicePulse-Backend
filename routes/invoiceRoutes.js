const express = require("express");
const {createInvoice,getAllInvoices, getInvoiceById, updateInvoice, deleteInvoice} = require("../controller/invoiceController")
const protect = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/create", protect, createInvoice);
router.get("/", protect, getAllInvoices);
router.get("/:id", protect, getInvoiceById);
router.put("/:id", protect, updateInvoice);
router.delete("/:id", protect, deleteInvoice);

module.exports = router;

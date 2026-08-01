const express = require("express");
const {createInvoice,getAllInvoices, getInvoiceById, updateInvoice, deleteInvoice, getNextInvoiceNumber} = require("../controller/invoiceController")
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/next-number",  protect, getNextInvoiceNumber);
router.post("/create", protect, createInvoice);
router.get("/", protect, getAllInvoices);
router.get("/:id", protect, getInvoiceById);
router.put("/:id", protect, updateInvoice);
router.delete("/:id", protect, deleteInvoice);


module.exports = router;

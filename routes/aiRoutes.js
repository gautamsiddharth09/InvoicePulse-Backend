const express = require("express")

const { parseInvoiceFromText, generateReminderEmail, getDashboardSummary} = require("../controller/aiController")
const protect  = require("../middleware/authMiddleware")

const router = express.Router()

router.post("/parse-text", protect, parseInvoiceFromText)
router.post("/generate-reminder", protect, generateReminderEmail)
router.post("/dashboard-summary", protect, getDashboardSummary)

module.exports = router
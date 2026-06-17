const { GoogleGenAI } = require("@google/genai");
const Invoice = require("../models/Invoice");

const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);

// parse invoice
const parseInvoiceFromText = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: "Text is required",
    });
  }

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are an expert invoice extraction AI.
Extract invoice data and return ONLY valid JSON.
{
  "clientName": "string",
  "email": "string or null",
  "address": "string or null",
  "items": [
   {
      "productCode": "string or null",
      "name": "string",
      "description": "string or null",
      "quantity": number,
      "mrpPrice": number,
      "discount": number,
      "discountedPrice": number
    }
  ]
}

Rules:
- If a field is missing, use null.
- If a numeric field is missing, use 0.
- mrpPrice should be the original price.
- discount should be the discount percentage if available, otherwise 0.
- discountedPrice should be the final selling price including any taxes if explicitly available; otherwise use mrpPrice.
- quantity must be numeric.
- Do not invent values that are not present in the invoice.
TEXT:
${text}
Return ONLY JSON.
      `,
    });
    const responseText = result.text;
    const cleanedJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanedJson);

    return res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server crashed while parsing invoice",
      error: error.message,
    });
  }
};
module.exports = { parseInvoiceFromText };

// generate email reminder
const generateReminderEmail = async (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({
      message: "Invoice ID is required",
    });
  }

  try {
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const prompt = `
    You are a progessional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment.
   
    Use the following details to personalize the email:
    - Client Name: ${invoice.billTo.clientName}
    - Invoice Number: ${invoice.invoiceNumber}
    - Amount Due: ${invoice.grandTotal.toFixed(2)}
    - Due Date: ${
      invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString()
        : "Not specified"
    }
     The tone should be friendly but clear. Keep it concise. Start the email with "Subject:".
   `;

    let result;
    let attempts = 2;

    for (let i = 0; i < attempts; i++) {
      try {
        result = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        break;
      } catch (err) {
        if (i === attempts - 1) throw err;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    //  above gemeni api process the prompt and after that it return response object
    const reminderText = result?.response?.text || result?.text || "";

    //    console.log(Full Gemini Result =>, result);
    // console.log(Reminder Text =>, reminderText);
    // console.log(Result response =>, result.response.text);

    return res.status(200).json({
      success: true,
      reminderText,
    });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate email",
      error: error.message,
    });
  }
};

//  dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id });

    if (invoices.length === 0) {
      return res.status(200).json({
        insights: ["No invoice data available to generate insights."],
      });
    }

    // Process and summarize data
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
    const unpaidInvoices = invoices.filter((inv) => inv.status !== "Paid");
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalOutstanding = unpaidInvoices.reduce(
      (acc, inv) => acc + inv.total,
      0,
    );
    const dataSummary = `
- Total number of invoices: ${totalInvoices}
- Total paid invoices: ${paidInvoices.length}
- Total unpaid/pending invoices: ${unpaidInvoices.length}
- Total revenue from paid invoices: ${totalRevenue.toFixed(2)}
- Total outstanding amount from unpaid/pending invoices: ${totalOutstanding.toFixed(2)}
- Recent invoices (last 5): ${invoices
      .slice(0, 5)
      .map(
        (inv) =>
          `Invoice #${inv.invoiceNumber} for ${inv.total.toFixed(2)} with status ${inv.status}`,
      )
      .join(", ")}
`;

    const prompt = `
  You are a friendly and insightful financial analyst for a small business owner.
  Based on the following summary of their invoice data, provide 2-3 concise and actionable insight
  Each insight should be a short string in a JSON array.
  The insights should be encouraging and helpful. Do not just repeat the data.
  For example, if there is a high outstanding amount, suggest sending reminders. If revenue is high,.If revenue is high, be encouraging

  Data Summary:
  ${dataSummary}

  Return your response as a valid JSON object with a single key "insights" which is an array of string.  
  Example format: { "insights": ["Your revenue is looking strong this month!", "You have 5 overdue invoice. Consider sending reminders to get paid faster."]
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const responseText = response.text;
    const cleanedJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsedData = JSON.parse(cleanedJson);

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error dashboard summary with AI:", error);
    return res.status(500).json({
      success: false,
      message: "Failed dashboard summary",
      details: error.message,
    });
  }
};

module.exports = {
  parseInvoiceFromText,
  generateReminderEmail,
  getDashboardSummary,
};

// Frontend Request
//       ↓
// Express Controller
//       ↓
// MongoDB (Fetch Invoice)
//       ↓
// Prompt Builder (AI Input)
//       ↓
// Gemini API Call
//       ↓
// Response Parser
//       ↓
// Frontend Response

// 1.generateReminderEmail — Why this function exists
// This function generates an AI-powered invoice reminder email using invoice data stored in MongoDB and Google Gemini API.
// This function automatically generates personalized, professional reminder emails using AI.

// 2. Prompt creation
// This is the brain of the system.
// injects invoice data dynamically
// tells AI what role to act as (accounting assistant)
// defines tone and format rules
// ensures output is contextual and personalized
//  Without this, AI would generate generic emails.

//  3. retry mechanism
//  Why?
// Gemini API can fail due to:
// rate limits
// overload (503)
// network issue
//  Retry ensures:
// temporary failures don’t break user experience

// Implemented a fault-tolerant AI email generation system using Gemini API with controlled retry logic and error-aware handling for transient failures (503) and rate limits (429), improving reliability and production readiness of the service.

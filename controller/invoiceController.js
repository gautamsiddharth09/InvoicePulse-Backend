const Invoice = require("../models/Invoice");
const Counter = require("../models/Counter"); // new line

// if num is undefined then it will now throw ref error
const roundToTwo = (num) => Number((Number(num) || 0).toFixed(2));

// helper function one
const calculateItemPricing = (item) => {
  const quantity = Number(item.quantity) || 1;
  const mrpPrice = Number(item.mrpPrice) || 0;
  const discountPercent = Number(item.discountPercent) || 0; // Optional discount
  const discountedPrice = Number(item.discountedPrice) || 0; // Selling Price (GST Inclusive)

  if (quantity <= 0) throw new Error("Quantity must be greater than 0");
  if (mrpPrice <= 0) throw new Error("MRP must be greater than 0");

  // Logic: Selling Price में से % डिस्काउंट घटाएं
  const finalPricePerItem =
    discountedPrice - discountedPrice * (discountPercent / 100);

  // Total Savings = (MRP - FinalPrice) * Qty
  const savings = (mrpPrice - finalPricePerItem) * quantity;

  return {
    quantity,
    mrpPrice: roundToTwo(mrpPrice),
    discountPercent: roundToTwo(discountPercent),
    finalPricePerItem: roundToTwo(finalPricePerItem), // यह GST Inclusive है
    savings: roundToTwo(savings),
  };
};

// helper function two: Totals
const calculateInvoiceTotals = (items, taxRate, shippingCharge) => {
  let totalMRP = 0;
  let totalDiscounted = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const mrp = Number(item.mrpPrice) || 0;
    const discPrice =
      Number(item.discountedPrice || item.finalPricePerItem) || 0;
    totalMRP += mrp * qty;
    totalDiscounted += discPrice * qty;
    // console.log(`Item: ${item.name}, MRP: ${mrp}, Disc: ${discPrice}, Qty: ${qty}`);
  }

  //  if result is nan
  const discountTotal = totalMRP - totalDiscounted;
  const finalDiscountTotal = isNaN(discountTotal) ? 0 : discountTotal;

  const taxFactor = 1 + (Number(taxRate) || 0) / 100;
  const subtotal = totalDiscounted / taxFactor;
  const taxTotal = totalDiscounted - subtotal;
  const shipping = Number(shippingCharge) || 0;
  const grandTotal = totalDiscounted + shipping;

  return {
    subtotal: isNaN(subtotal) ? 0 : Number(subtotal.toFixed(2)),
    taxTotal: isNaN(taxTotal) ? 0 : Number(taxTotal.toFixed(2)),
    discountTotal: Number(finalDiscountTotal.toFixed(2)),
    grandTotal: isNaN(grandTotal) ? 0 : Number(grandTotal.toFixed(2)),
  };
};

// create Invoice
const createInvoice = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user;

    const {
      invoiceDate,
      invoiceNumber,
      dueDate,
      billFrom,
      billTo,
      shippingAddress,
      orderDetails,
      items,
      notes,
      paymentTerms,
      status,
      currency,
      taxRate = 0,
      paymentInfo,
      shippingCharge = 0,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Items are required",
      });
    }

    const processedItems = items.map((item) => {
      const normalized = calculateItemPricing(item);

      return {
        productCode: item.productCode || "",
        name: item.name,
        description: item.description || "",
        quantity: normalized.quantity,
        mrpPrice: normalized.mrpPrice,
        discountPercent: normalized.discountPercent,
        discountedPrice: normalized.finalPricePerItem,
      };
    });

    // (GST Inclusive + Optional % Discount)
    const { subtotal, taxTotal, discountTotal, grandTotal } =
      calculateInvoiceTotals(processedItems, taxRate, shippingCharge);

    // const invoiceNumber = `INV-${Date.now()}`;  old line
let finalInvoiceNumber;

if (invoiceNumber?.trim()) {
  // User entered a custom invoice number
  finalInvoiceNumber = invoiceNumber.trim();
} else {
  // Auto-generate the next invoice number
  const counter = await Counter.findOneAndUpdate(
    {
      user: user._id,
      name: "invoice",
    },
    {
      $inc: { sequence: 1 },
    },
    {
      new: true,
      upsert: true,
    }
  );

  finalInvoiceNumber = `INV-${String(counter.sequence).padStart(3, "0")}`;
}

    const existingInvoice = await Invoice.findOne({
      user: req.user._id,
      invoiceNumber: finalInvoiceNumber,
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists.",
      });
    }

    const invoice = await Invoice.create({
      user: user._id,
      invoiceNumber: finalInvoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      shippingAddress,
      orderDetails,
      items: processedItems,
      notes,
      paymentTerms,
      status,
      currency,
      taxRate: Number(taxRate) || 0,
      discountTotal,
      shippingCharge: Number(shippingCharge) || 0,
      subtotal,
      taxTotal,
      grandTotal,
      paymentInfo,
    });

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating invoice",
      error: error.message,
    });
  }
};

// Get All Invoices
const getAllInvoices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const invoices = await Invoice.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get Invoices Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// getInvoiceById
const getInvoiceById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    console.log("invoice id", req.params.id);
    console.log("user id", req.user._id);

    const invoice = await Invoice.findOne({
      _id: id,
      user: req.user._id,
    });

    // console.log("invoice", invoice);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

// update Invoice
const updateInvoice = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const invoice = await Invoice.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }



    const {
        invoiceNumber,
      invoiceDate,
      dueDate,
      billFrom,
      billTo,
      shippingAddress,
      orderDetails,
      items,
      notes,
      paymentTerms,
      status,
      currency,
      taxRate,
      paymentInfo,
      shippingCharge: inputShipping,
    } = req.body;

        const finalInvoiceNumber = invoiceNumber?.trim() || invoice.invoiceNumber;

const existingInvoice = await Invoice.findOne({
  user: req.user._id,
  invoiceNumber: finalInvoiceNumber,
  _id: { $ne: id },
});

if (existingInvoice) {
  return res.status(400).json({
    success: false,
    message: "Invoice number already exists.",
  });
}

    // is there is no value in data base then  use old value
    const finalShipping =
      inputShipping !== undefined
        ? Number(inputShipping)
        : invoice.shippingCharge;
    const finalTaxRate =
      taxRate !== undefined ? Number(taxRate) : invoice.taxRate;
    const finalItems =
      items && Array.isArray(items) && items.length > 0 ? items : invoice.items;

    // peocessing the item according to the new function
    const processedItems = finalItems.map((item) => {
      const normalized = calculateItemPricing(item);

      return {
        productCode: item.productCode || "",
        name: item.name,
        description: item.description || "",
        quantity: normalized.quantity,
        mrpPrice: normalized.mrpPrice,
        discountPercent: normalized.discountPercent,
        discountedPrice: normalized.finalPricePerItem,
      };
    });

    const { subtotal, taxTotal, discountTotal, grandTotal } =
      calculateInvoiceTotals(processedItems, finalTaxRate, finalShipping);

    //updating in data base
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: id, user: req.user._id },
      {
         invoiceNumber: finalInvoiceNumber,
        invoiceDate,
        dueDate,
        billFrom,
        billTo,
        shippingAddress,
        orderDetails,
        items: processedItems,
        notes,
        paymentTerms,
        status,
        currency,
        taxRate: finalTaxRate,
        discountTotal,
        shippingCharge: finalShipping,
        subtotal,
        taxTotal,
        grandTotal,
        paymentInfo,
      },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

// delete Invoice
const deleteInvoice = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const deleted = await Invoice.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting invoice",
      error: error.message,
    });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    mrpPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    // Seller Details
    billFrom: {
      businessName: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      gstNumber: {
        type: String,
        default: "",
      },
    },

    // Client Details
    billTo: {
      clientName: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      gstNumber: {
        type: String,
        default: "",
      },
    },

    // Optional Shipping Address
    shippingAddress: {
      name: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },
    },

    // Order Details
    orderDetails: {
      salesNumber: {
        type: String,
        default: "",
      },

      awbNumber: {
        type: String,
        default: "",
      },

      saleDate: Date,
    },

    items: [itemSchema],

    notes: {
      type: String,
      default: "",
    },

    paymentTerms: {
      type: String,
      default: "Net 15",
    },

    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Paid",
    },

    currency: {
      type: String,
      default: "INR",
    },

    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 18,
      min: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Payment Tracking
    paymentInfo: {
      method: {
        type: String,
        default: "",
      },

      transactionId: {
        type: String,
        default: "",
      },

      paidAt: Date,

      amountPaid: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index(
  { user: 1, invoiceNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);

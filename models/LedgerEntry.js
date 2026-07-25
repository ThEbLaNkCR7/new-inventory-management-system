import mongoose from "mongoose"

const ledgerEntrySchema = new mongoose.Schema(
  {
    ledgerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerAccount",
      required: true,
    },
    nepaliDate: { type: String, required: true, trim: true },
    englishDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ["Sale", "Rcpt", "Payment", "Journal"],
      required: true,
    },
    voucherBillNo: { type: String, trim: true, default: "" },
    contraAccount: { type: String, required: true, trim: true },
    narration: { type: String, trim: true, default: "" },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

ledgerEntrySchema.index({ ledgerAccountId: 1, englishDate: 1 })

export default mongoose.models.LedgerEntry ||
  mongoose.model("LedgerEntry", ledgerEntrySchema)

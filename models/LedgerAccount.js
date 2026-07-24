import mongoose from "mongoose"

const ledgerAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    openingBalance: { type: Number, default: 0, min: 0 },
    openingBalanceType: {
      type: String,
      enum: ["Dr", "Cr"],
      default: "Dr",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

ledgerAccountSchema.index({ name: "text" })

export default mongoose.models.LedgerAccount ||
  mongoose.model("LedgerAccount", ledgerAccountSchema)

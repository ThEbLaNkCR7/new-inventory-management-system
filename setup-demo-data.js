/**
 * Seeds demo data for local MongoDB only (all main inventory entities).
 *
 * Safety: refuses to run unless MONGODB_URI points at localhost/127.0.0.1.
 * Production / deployed databases are never written to.
 *
 * Usage:
 *   npm run setup-demo          Seed (clears previous Demo* first, then inserts)
 *   npm run clear-demo          Delete Demo* / DEMO-* rows only (no reseed)
 */

import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import Product from "./models/Product.js"
import Client from "./models/Client.js"
import Supplier from "./models/Supplier.js"
import Batch from "./models/Batch.js"
import Purchase from "./models/Purchase.js"
import Sale from "./models/Sale.js"
import LedgerAccount from "./models/LedgerAccount.js"
import LedgerEntry from "./models/LedgerEntry.js"
import Approval from "./models/Approval.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, ".env") })
dotenv.config({ path: path.join(__dirname, ".env.local") })

const MONGODB_URI = process.env.MONGODB_URI
const COUNT = 15
const DEMO_PREFIX = "Demo "

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in .env or .env.local")
}

function assertLocalOnlyUri(uri) {
  let hostname
  try {
    const normalized = uri
      .replace(/^mongodb\+srv:\/\//i, "https://")
      .replace(/^mongodb:\/\//i, "http://")
    hostname = new URL(normalized).hostname
  } catch {
    throw new Error("Could not parse MONGODB_URI. Aborting demo seed.")
  }

  const isLocal = hostname === "localhost" || hostname === "127.0.0.1"
  if (!isLocal) {
    throw new Error(
      `Refusing to seed demo data: MONGODB_URI host is "${hostname}". ` +
        "Demo seed only runs against localhost / 127.0.0.1 so deployed backends are never affected.",
    )
  }
}

const pick = (arr, i) => arr[i % arr.length]

/** Repeated field pools (intentionally duplicated across records). */
const REPEATED_NAMES = [
  "Himalayan Traders",
  "Everest Retail",
  "Nepal Chemicals",
  "Valley Distributors",
  "Kathmandu Supplies",
]
const REPEATED_PRODUCT_BASES = [
  "Waterproof Membrane",
  "Bitumen Primer",
  "Sealant Tube",
  "Drain Board",
  "PU Coating",
]
const REPEATED_QTY = [10, 10, 25, 25, 50, 50, 100, 5, 5, 15]
const REPEATED_PRICES = [500, 500, 1200, 1200, 2500, 850, 850]
const REPEATED_COMPANIES = [
  "Demo Co. Pvt. Ltd.",
  "Demo Co. Pvt. Ltd.",
  "Demo Industries",
  "Demo Industries",
  "Demo Trading House",
]
const REPEATED_CITIES = ["Kathmandu", "Kathmandu", "Pokhara", "Biratnagar", "Lalitpur"]
const REPEATED_PHONES = ["9800000001", "9800000001", "9800000002", "9800000003", "9800000003"]
const CATEGORIES = ["Membrane", "Membrane", "Chemical", "Accessory", "Coating", "Coating"]
const SUPPLIER_TYPES = ["Company", "Company", "Individual"]
const CLIENT_TYPES = ["Company", "Company", "Individual"]
const PAYMENT_STATUSES = ["Pending", "Pending", "Received", "Received"]
const ENTRY_TYPES = ["Sale", "Rcpt", "Payment", "Journal"]
const ACCOUNT_TYPES = ["customer", "customer", "supplier", "supplier"]
const BALANCE_SIDES = ["Dr", "Dr", "Cr", "Cr"]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function buildProducts() {
  // Product.name is unique — use numbered names, but repeat base/qty/price/category/supplier.
  // First 12 are dead stock (createdAt > 90 days ago, stockQuantity > 0) for dashboard blink demo.
  const deadStockCount = 12
  return Array.from({ length: COUNT }, (_, i) => {
    const base = pick(REPEATED_PRODUCT_BASES, i)
    const isDeadStock = i < deadStockCount
    return {
      name: `${DEMO_PREFIX}${base} #${String(i + 1).padStart(2, "0")}`,
      hsCode: `DEMO${String(i + 1).padStart(4, "0")}`,
      description: `${base} demo stock item`,
      category: pick(CATEGORIES, i),
      stockQuantity: isDeadStock
        ? // Keep dead stock demo items also low-stock (<=5) so low-stock blink is testable.
          pick([2, 3, 4, 5, 1, 2, 3, 4, 5, 2, 3, 1], i)
        : Math.max(pick(REPEATED_QTY, i), 8),
      unitPrice: pick(REPEATED_PRICES, i),
      supplier: pick(REPEATED_NAMES, i),
      stockType: isDeadStock ? "old" : i % 3 === 0 ? "old" : "new",
      lastRestocked: isDeadStock ? daysAgo(120 + i) : daysAgo(i % 40),
      lowStockThreshold: 5,
      isActive: true,
      netWeight: pick([1, 1, 5, 5, 20], i),
      weightUnit: i % 4 === 0 ? "liter" : "kg",
      // Dashboard dead stock uses createdAt (> 90 days), not lastRestocked.
      createdAt: isDeadStock ? daysAgo(100 + i) : daysAgo(i + 1),
      updatedAt: isDeadStock ? daysAgo(95 + i) : daysAgo(i),
    }
  })
}

function buildClients() {
  return Array.from({ length: COUNT }, (_, i) => {
    const name = pick(REPEATED_NAMES, i)
    return {
      name: `${DEMO_PREFIX}${name}`,
      email: `demo.client${(i % 5) + 1}@example.com`,
      phone: pick(REPEATED_PHONES, i),
      company: pick(REPEATED_COMPANIES, i),
      address: {
        street: `Ward ${(i % 5) + 1}`,
        city: pick(REPEATED_CITIES, i),
        state: "Bagmati",
        zipCode: "44600",
        country: "Nepal",
      },
      taxId: `DEMO-TAX-${(i % 3) + 1}`,
      creditLimit: pick([50000, 50000, 100000, 25000], i),
      currentBalance: pick([0, 5000, 5000, 12000], i),
      totalSpent: pick([0, 15000, 15000, 40000], i),
      paymentStatus: pick(PAYMENT_STATUSES, i),
      orders: pick([0, 2, 2, 5], i),
      lastOrder: daysAgo(i + 1),
      isActive: true,
      notes: "Demo client record",
    }
  })
}

function buildSuppliers() {
  return Array.from({ length: COUNT }, (_, i) => {
    const name = pick(REPEATED_NAMES, i)
    return {
      name: `${DEMO_PREFIX}${name}`,
      email: `demo.supplier${(i % 5) + 1}@example.com`,
      phone: pick(REPEATED_PHONES, i),
      company: pick(REPEATED_COMPANIES, i),
      status: i % 4 === 0 ? "inactive" : "active",
      address: `${pick(REPEATED_CITIES, i)}, Nepal`,
      orders: pick([0, 3, 3, 8], i),
      totalSpent: pick([0, 20000, 20000, 75000], i),
      lastOrder: daysAgo(i + 2),
      isActive: true,
    }
  })
}

function buildBatches(products) {
  return Array.from({ length: COUNT }, (_, i) => {
    const product = pick(products, i)
    const product2 = pick(products, i + 3)
    const qty1 = pick(REPEATED_QTY, i)
    const qty2 = pick(REPEATED_QTY, i + 1)
    const cost1 = pick(REPEATED_PRICES, i)
    const cost2 = pick(REPEATED_PRICES, i + 2)
    const items = [
      {
        productId: product._id,
        productName: product.name,
        quantity: qty1,
        unitCost: cost1,
        manufactureDate: daysAgo(60 + i),
        expiryDate: daysAgo(-(365 - i)),
      },
      {
        productId: product2._id,
        productName: product2.name,
        quantity: qty2,
        unitCost: cost2,
        manufactureDate: daysAgo(45 + i),
        expiryDate: daysAgo(-(300 - i)),
      },
    ]
    return {
      batchNumber: `DEMO-BATCH-${String(i + 1).padStart(3, "0")}`,
      supplier: pick(REPEATED_NAMES, i),
      arrivalDate: daysAgo(i + 1),
      items,
      totalItems: items.length,
      totalValue: items.reduce((s, it) => s + it.quantity * it.unitCost, 0),
      status: pick(["pending", "received", "received", "processed"], i),
      notes: "Demo batch",
    }
  })
}

function buildPurchases(products) {
  return Array.from({ length: COUNT }, (_, i) => {
    const product = pick(products, i)
    const product2 = pick(products, i + 1)
    const qty = pick(REPEATED_QTY, i)
    const price = pick(REPEATED_PRICES, i)
    return {
      supplier: `${DEMO_PREFIX}${pick(REPEATED_NAMES, i)}`,
      supplierType: pick(SUPPLIER_TYPES, i),
      items: [
        {
          productId: product._id,
          productName: product.name,
          quantityPurchased: qty,
          purchasePrice: price,
        },
        {
          productId: product2._id,
          productName: product2.name,
          quantityPurchased: pick(REPEATED_QTY, i + 2),
          purchasePrice: pick(REPEATED_PRICES, i + 1),
        },
      ],
      purchaseDate: daysAgo(i + 1),
      isActive: true,
      isVat: i % 3 !== 0,
    }
  })
}

function buildSales(products) {
  return Array.from({ length: COUNT }, (_, i) => {
    const product = pick(products, i)
    const product2 = pick(products, i + 2)
    const qty = pick(REPEATED_QTY, i)
    const price = pick(REPEATED_PRICES, i)
    return {
      client: `${DEMO_PREFIX}${pick(REPEATED_NAMES, i)}`,
      clientType: pick(CLIENT_TYPES, i),
      saleType: i % 4 === 0 ? "site" : "client",
      projectName: i % 4 === 0 ? pick(["Site A", "Site A", "Site B"], i) : "",
      paymentStatus: pick(PAYMENT_STATUSES, i),
      items: [
        {
          productId: product._id,
          productName: product.name,
          quantitySold: qty,
          salePrice: price,
        },
        {
          productId: product2._id,
          productName: product2.name,
          quantitySold: pick(REPEATED_QTY, i + 1),
          salePrice: pick(REPEATED_PRICES, i + 2),
        },
      ],
      saleDate: daysAgo(i),
      batchNumber: `DEMO-BATCH-${String((i % COUNT) + 1).padStart(3, "0")}`,
      isActive: true,
      isVat: i % 2 === 0,
    }
  })
}

function buildLedgerAccounts() {
  return Array.from({ length: COUNT }, (_, i) => {
    const accountType = pick(ACCOUNT_TYPES, i)
    const name = pick(REPEATED_NAMES, i)
    return {
      name: `${DEMO_PREFIX}${accountType === "supplier" ? "Supplier" : "Customer"} - ${name} #${String(i + 1).padStart(2, "0")}`,
      address: `${pick(REPEATED_CITIES, i)}, Nepal`,
      openingBalance: pick([0, 5000, 5000, 15000, 25000], i),
      openingBalanceType: pick(BALANCE_SIDES, i),
      accountType,
      isActive: true,
    }
  })
}

function buildLedgerEntries(accounts) {
  return Array.from({ length: COUNT }, (_, i) => {
    const account = pick(accounts, i)
    const type = pick(ENTRY_TYPES, i)
    const amount = pick(REPEATED_PRICES, i)
    const isDebit = type === "Sale" || type === "Payment"
    return {
      ledgerAccountId: account._id,
      nepaliDate: `2082-04-${String((i % 28) + 1).padStart(2, "0")}`,
      englishDate: daysAgo(i + 1),
      type,
      voucherBillNo: `DEMO-${type.slice(0, 3).toUpperCase()}-${String((i % 5) + 1).padStart(3, "0")}`,
      contraAccount: pick(["Sales", "Sales", "Cash", "Bank", "Purchase"], i),
      narration: pick(
        [
          "Demo sale entry",
          "Demo sale entry",
          "Demo receipt",
          "Demo payment",
          "Demo journal",
        ],
        i,
      ),
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      isActive: true,
    }
  })
}

function buildApprovals(products, clients, suppliers) {
  const types = ["product", "sale", "purchase", "client", "supplier"]
  const actions = ["create", "update", "delete"]
  const statuses = ["pending", "pending", "approved", "rejected"]

  return Array.from({ length: COUNT }, (_, i) => {
    const type = pick(types, i)
    const action = pick(actions, i)
    const status = pick(statuses, i)
    let entityLabel = `${DEMO_PREFIX}Approval Target`
    let entityId = `demo-${i + 1}`

    if (type === "product" && products[i % products.length]) {
      entityLabel = products[i % products.length].name
      entityId = String(products[i % products.length]._id)
    } else if (type === "client" && clients[i % clients.length]) {
      entityLabel = clients[i % clients.length].name
      entityId = String(clients[i % clients.length]._id)
    } else if (type === "supplier" && suppliers[i % suppliers.length]) {
      entityLabel = suppliers[i % suppliers.length].name
      entityId = String(suppliers[i % suppliers.length]._id)
    }

    return {
      type,
      action,
      entityId,
      entityLabel,
      status,
      requestedBy: pick(["user@example.com", "user@example.com", "admin@sheelwaterproofing.com"], i),
      requestedAt: daysAgo(i),
      reviewedBy: status === "pending" ? undefined : "admin@sheelwaterproofing.com",
      reviewedAt: status === "pending" ? undefined : daysAgo(Math.max(0, i - 1)),
      reviewNotes: status === "pending" ? "" : "Demo review",
      reason: "Demo approval request",
      changeSummary: `${action} ${type}`,
      changedFields: pick([["name"], ["name", "quantity"], ["quantity"], ["price"]], i),
      originalData: { name: entityLabel, quantity: pick(REPEATED_QTY, i) },
      proposedData: {
        name: entityLabel,
        quantity: pick(REPEATED_QTY, i + 1),
        unitPrice: pick(REPEATED_PRICES, i),
      },
    }
  })
}

async function clearPreviousDemo(products) {
  const demoProductIds = products.map((p) => p._id)

  const demoLedgerAccounts = await LedgerAccount.find({ name: /^Demo / })
  const demoLedgerIds = demoLedgerAccounts.map((a) => a._id)

  const results = await Promise.all([
    LedgerEntry.deleteMany({
      $or: [
        { ledgerAccountId: { $in: demoLedgerIds } },
        { voucherBillNo: /^DEMO-/ },
        { narration: /^Demo / },
      ],
    }),
    LedgerAccount.deleteMany({ name: /^Demo / }),
    Approval.deleteMany({
      $or: [{ entityLabel: /^Demo / }, { reason: "Demo approval request" }],
    }),
    Sale.deleteMany({
      $or: [{ client: /^Demo / }, { batchNumber: /^DEMO-BATCH-/ }],
    }),
    Purchase.deleteMany({ supplier: /^Demo / }),
    Batch.deleteMany({ batchNumber: /^DEMO-BATCH-/ }),
    Client.deleteMany({ name: /^Demo / }),
    Supplier.deleteMany({ name: /^Demo / }),
    Product.deleteMany({ name: /^Demo / }),
  ])

  const labels = [
    "ledger entries",
    "ledger accounts",
    "approvals",
    "sales",
    "purchases",
    "batches",
    "clients",
    "suppliers",
    "products",
  ]
  labels.forEach((label, i) => {
    console.log(`  cleared ${results[i].deletedCount} ${label}`)
  })

  return demoProductIds
}

async function run() {
  assertLocalOnlyUri(MONGODB_URI)
  const clearOnly = process.argv.includes("--clear-only")

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    console.log("MongoDB connected (local only)\n")

    console.log("Clearing demo rows (Demo* / DEMO-* only)...")
    const existingDemoProducts = await Product.find({ name: /^Demo / }).select("_id")
    await clearPreviousDemo(existingDemoProducts)

    if (clearOnly) {
      console.log("\nDemo data removed. No new seed was written.")
      console.log("Non-demo records were left untouched.")
      return
    }

    console.log("\nSeeding demo data (≥15 each, with repeated names/qty/fields)...")

    const products = await Product.insertMany(buildProducts())
    console.log(`  products: ${products.length}`)

    const clients = await Client.insertMany(buildClients())
    console.log(`  clients: ${clients.length}`)

    const suppliers = await Supplier.insertMany(buildSuppliers())
    console.log(`  suppliers: ${suppliers.length}`)

    const batches = await Batch.insertMany(buildBatches(products))
    console.log(`  batches: ${batches.length}`)

    const purchases = await Purchase.insertMany(buildPurchases(products))
    console.log(`  purchases: ${purchases.length}`)

    const sales = await Sale.insertMany(buildSales(products))
    console.log(`  sales: ${sales.length}`)

    const ledgerAccounts = await LedgerAccount.insertMany(buildLedgerAccounts())
    console.log(`  ledger accounts: ${ledgerAccounts.length}`)

    const ledgerEntries = await LedgerEntry.insertMany(buildLedgerEntries(ledgerAccounts))
    console.log(`  ledger entries: ${ledgerEntries.length}`)

    const approvals = await Approval.insertMany(buildApprovals(products, clients, suppliers))
    console.log(`  approvals: ${approvals.length}`)

    console.log("\nDemo data ready for local UI. Deployed backend is untouched.")
    console.log("Re-run anytime: npm run setup-demo")
    console.log("Clear only:     npm run clear-demo")
  } catch (error) {
    console.error("Demo setup error:", error.message || error)
    process.exitCode = 1
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log("\nMongoDB disconnected")
    }
  }
}

run()

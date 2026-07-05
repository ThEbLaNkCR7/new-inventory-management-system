const GLOBAL_OMIT = new Set([
  "_id",
  "__v",
  "id",
  "imageUrl",
  "image_url",
  "image",
  "version",
  "createdAt",
  "updatedAt",
  "isActive",
  "lastRestocked",
  "batchId",
  "batchNumber",
])

const FIELDS_BY_TYPE = {
  product: [
    "name",
    "description",
    "category",
    "stockQuantity",
    "unitPrice",
    "netWeight",
    "supplier",
    "stockType",
    "lowStockThreshold",
    "hsCode",
  ],
  sale: [
    "client",
    "clientType",
    "saleDate",
    "productId",
    "productName",
    "quantitySold",
    "salePrice",
  ],
  purchase: [
    "supplier",
    "supplierType",
    "purchaseDate",
    "productId",
    "productName",
    "quantityPurchased",
    "purchasePrice",
  ],
  client: ["name", "email", "phone", "company", "address", "taxId", "creditLimit", "clientType", "status"],
  supplier: ["name", "email", "phone", "company", "address", "status"],
}

export function pickImportantFields(type, data) {
  if (!data || typeof data !== "object") return undefined

  const allowed = new Set(FIELDS_BY_TYPE[type] || [])
  const result = {}

  for (const [key, value] of Object.entries(data)) {
    if (GLOBAL_OMIT.has(key)) continue
    if (allowed.size > 0 && !allowed.has(key)) continue
    if (value !== undefined) result[key] = value
  }

  return Object.keys(result).length ? result : undefined
}

export function getEntityLabel(type, proposedData, originalData) {
  const data = proposedData || originalData || {}

  switch (type) {
    case "product":
      return data.name || data.productName || "Product"
    case "sale":
      return data.client || data.productName || "Sale"
    case "purchase":
      return data.supplier || data.productName || "Purchase"
    case "client":
      return data.name || data.company || "Client"
    case "supplier":
      return data.name || data.company || "Supplier"
    default:
      return type
  }
}

export function getChangedFields(originalData, proposedData) {
  if (!originalData || !proposedData) return []

  const keys = new Set([...Object.keys(originalData), ...Object.keys(proposedData)])

  return [...keys].filter((key) => {
    if (GLOBAL_OMIT.has(key)) return false
    return JSON.stringify(originalData[key]) !== JSON.stringify(proposedData[key])
  })
}

export function buildChangeSummary(type, action, originalData, proposedData) {
  const label = getEntityLabel(type, proposedData, originalData)

  if (action === "create") return `Created ${type}: ${label}`
  if (action === "delete") return `Deleted ${type}: ${label}`

  const changed = getChangedFields(originalData, proposedData)
  if (!changed.length) return `Updated ${type}: ${label}`

  return `Updated ${type}: ${label} (${changed.join(", ")})`
}

export function sanitizeApprovalPayload(payload) {
  const { type, action, entityId, originalData, proposedData, requestedBy, reason, status, reviewedBy, reviewedAt, reviewNotes } =
    payload

  const sanitizedOriginal = pickImportantFields(type, originalData)
  const sanitizedProposed = pickImportantFields(type, proposedData)
  const entityLabel = getEntityLabel(type, sanitizedProposed, sanitizedOriginal)
  const changedFields = getChangedFields(sanitizedOriginal, sanitizedProposed)
  const changeSummary = buildChangeSummary(type, action, sanitizedOriginal, sanitizedProposed)

  const isPending = status === "pending"

  return {
    type,
    action,
    entityId: entityId || undefined,
    entityLabel,
    status: status || "pending",
    requestedBy,
    reason: reason || undefined,
    reviewedBy: reviewedBy || undefined,
    reviewedAt: reviewedAt || undefined,
    reviewNotes: reviewNotes || undefined,
    changeSummary,
    changedFields,
    ...(isPending
      ? {
          originalData: sanitizedOriginal,
          proposedData: sanitizedProposed,
        }
      : {}),
  }
}

export function toHistoryRecord(doc) {
  return {
    type: doc.type,
    action: doc.action,
    entityId: doc.entityId,
    entityLabel: doc.entityLabel,
    status: doc.status,
    requestedBy: doc.requestedBy,
    requestedAt: doc.requestedAt,
    reviewedBy: doc.reviewedBy,
    reviewedAt: doc.reviewedAt,
    reviewNotes: doc.reviewNotes,
    reason: doc.reason,
    changeSummary: doc.changeSummary,
    changedFields: doc.changedFields,
    originalData: undefined,
    proposedData: undefined,
  }
}

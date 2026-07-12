export function getPurchaseTotal(
  purchase: { items?: Array<{ quantityPurchased?: number; purchasePrice?: number }> },
): number {
  return Math.round(
    purchase.items?.reduce(
      (sum, item) => sum + (item.quantityPurchased || 0) * (item.purchasePrice || 0),
      0,
    ) ?? 0,
  )
}

export function formatPurchaseTotal(
  purchase: { items?: Array<{ quantityPurchased?: number; purchasePrice?: number }> },
): string {
  return getPurchaseTotal(purchase).toLocaleString()
}

export type PurchaseFormItem = {
  productId: string
  quantityPurchased: number
  purchasePrice: number
}

export type PurchaseFormData = {
  items: PurchaseFormItem[]
  supplier: string
  supplierType: string
  customSupplier?: string
  purchaseDate: string
  isVat?: boolean
}

export function validatePurchaseFormData(formData: PurchaseFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!formData.items?.length) {
    errors["items.0.productId"] = "Please add at least one product"
  }

  formData.items?.forEach((item, index) => {
    if (!item.productId?.trim() || item.productId === "__new__") {
      errors[`items.${index}.productId`] =
        item.productId === "__new__"
          ? "Please add the new product or select an existing one"
          : "Please select a product from the dropdown"
    }

    if (
      !item.quantityPurchased ||
      item.quantityPurchased <= 0 ||
      Number.isNaN(item.quantityPurchased)
    ) {
      errors[`items.${index}.quantityPurchased`] = "Quantity is required"
    }

    if (!item.purchasePrice || item.purchasePrice <= 0 || Number.isNaN(item.purchasePrice)) {
      errors[`items.${index}.purchasePrice`] = "Unit price is required"
    }
  })

  if (!formData.supplier?.trim() || formData.supplier === "__new__") {
    errors.supplier = "Please select a supplier from the dropdown"
  } else if (formData.supplier === "custom" && !formData.customSupplier?.trim()) {
    errors.customSupplier = "Please enter a custom supplier name"
  }

  if (!formData.supplierType?.trim()) {
    errors.supplierType = "Please select a supplier type from the dropdown"
  }

  if (!formData.purchaseDate?.trim()) {
    errors.purchaseDate = "Purchase date is required"
  }

  return errors
}

export function mapPurchaseItemErrorsToEditFields(
  fieldErrors: Record<string, string>,
): Record<string, string> {
  const mapped: Record<string, string> = {}
  const pairs: Array<[string, string]> = [
    ["productId", "items.0.productId"],
    ["quantityPurchased", "items.0.quantityPurchased"],
    ["purchasePrice", "items.0.purchasePrice"],
    ["supplier", "supplier"],
    ["customSupplier", "customSupplier"],
    ["supplierType", "supplierType"],
    ["purchaseDate", "purchaseDate"],
  ]

  pairs.forEach(([editKey, sourceKey]) => {
    if (fieldErrors[sourceKey]) {
      mapped[editKey] = fieldErrors[sourceKey]
    }
  })

  return mapped
}

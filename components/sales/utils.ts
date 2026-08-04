export function getSaleTotal(
  sale: { items?: Array<{ quantitySold?: number; salePrice?: number }> },
): number {
  return Math.round(
    sale.items?.reduce(
      (sum, item) => sum + (item.quantitySold || 0) * (item.salePrice || 0),
      0,
    ) ?? 0,
  )
}

export function formatSaleTotal(
  sale: { items?: Array<{ quantitySold?: number; salePrice?: number }> },
): string {
  return getSaleTotal(sale).toLocaleString()
}

export type SaleFormItem = {
  productId: string
  quantitySold: number
  salePrice: number
}

export type SaleFormData = {
  items: SaleFormItem[]
  batchId?: string
  client: string
  clientType: string
  customClient?: string
  saleType?: "client" | "site"
  projectName?: string
  paymentStatus?: "Pending" | "Received"
  saleDate: string
  isVat?: boolean
}

export function validateSaleFormData(formData: SaleFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  const saleType = formData.saleType || "client"
  const paymentStatus = formData.paymentStatus || "Pending"

  if (!formData.items?.length) {
    errors["items.0.productId"] = "Please add at least one product"
  }

  formData.items?.forEach((item, index) => {
    if (!item.productId?.trim()) {
      errors[`items.${index}.productId`] = "Please select a product from the dropdown"
    }

    if (!item.quantitySold || item.quantitySold <= 0 || Number.isNaN(item.quantitySold)) {
      errors[`items.${index}.quantitySold`] = "Quantity is required"
    }

    if (!item.salePrice || item.salePrice <= 0 || Number.isNaN(item.salePrice)) {
      errors[`items.${index}.salePrice`] = "Unit price is required"
    }
  })

  if (saleType !== "client" && saleType !== "site") {
    errors.saleType = "Please select a sale type"
  }

  if (!formData.client?.trim()) {
    errors.client = "Please select a client from the dropdown"
  } else if (formData.client === "custom" && !formData.customClient?.trim()) {
    errors.customClient = "Please enter a custom client name"
  }

  if (!formData.clientType?.trim()) {
    errors.clientType = "Please select a client type from the dropdown"
  }

  if (saleType === "site" && !formData.projectName?.trim()) {
    errors.projectName = "Project name is required for site sales"
  }

  if (paymentStatus !== "Pending" && paymentStatus !== "Received") {
    errors.paymentStatus = "Please select a payment status"
  }

  if (!formData.saleDate?.trim()) {
    errors.saleDate = "Sale date is required"
  }

  return errors
}

export function mapSaleItemErrorsToEditFields(
  fieldErrors: Record<string, string>,
): Record<string, string> {
  const mapped: Record<string, string> = {}
  const pairs: Array<[string, string]> = [
    ["productId", "items.0.productId"],
    ["quantitySold", "items.0.quantitySold"],
    ["salePrice", "items.0.salePrice"],
    ["saleType", "saleType"],
    ["client", "client"],
    ["customClient", "customClient"],
    ["clientType", "clientType"],
    ["projectName", "projectName"],
    ["paymentStatus", "paymentStatus"],
    ["saleDate", "saleDate"],
  ]

  pairs.forEach(([editKey, sourceKey]) => {
    if (fieldErrors[sourceKey]) {
      mapped[editKey] = fieldErrors[sourceKey]
    }
  })

  return mapped
}

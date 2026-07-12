export type SupplierFormData = {
  name: string
  email: string
  phone: string
  company: string
  customCompany?: string
  address?: string
  status?: string
}

export function validateSupplierFormData(formData: SupplierFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!formData.name?.trim()) {
    errors.name = "Full name is required"
  }

  if (!formData.email?.trim()) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = "Please enter a valid email address"
  }

  if (!formData.phone?.trim()) {
    errors.phone = "Phone number is required"
  }

  if (!formData.company?.trim()) {
    errors.company = "Please select a company type from the dropdown"
  } else if (formData.company === "custom" && !formData.customCompany?.trim()) {
    errors.customCompany = "Please enter a custom company type"
  }

  if (!formData.status?.trim()) {
    errors.status = "Please select status from the dropdown"
  }

  return errors
}

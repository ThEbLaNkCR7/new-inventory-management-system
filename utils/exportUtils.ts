import * as XLSX from "xlsx"

export type ExcelTableColumn = {
  key: string
  header: string
  width?: number
}

export const exportToExcel = (data: any[], filename: string, sheetName = "Sheet1") => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/** Export rows as a titled Excel table matching on-screen table columns. */
export const exportTableToExcel = (
  rows: Record<string, unknown>[],
  filename: string,
  options: {
    sheetName?: string
    title?: string
    columns: ExcelTableColumn[]
  },
) => {
  const { columns, title, sheetName = "Sheet1" } = options
  if (!columns.length) return

  const aoa: (string | number)[][] = []
  let headerRowIndex = 0

  if (title) {
    aoa.push([title])
    aoa.push([])
    headerRowIndex = 2
  }

  aoa.push(columns.map((col) => col.header))
  rows.forEach((row) => {
    aoa.push(columns.map((col) => (row[col.key] ?? "") as string | number))
  })

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)

  if (title && columns.length > 1) {
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }]
  }

  worksheet["!cols"] = columns.map((col) => ({
    wch: col.width ?? Math.max(col.header.length + 2, 14),
  }))

  const lastRow = headerRowIndex + rows.length
  const lastCol = XLSX.utils.encode_col(columns.length - 1)
  const headerCell = XLSX.utils.encode_cell({ r: headerRowIndex, c: 0 })
  worksheet["!autofilter"] = {
    ref: `${headerCell}:${lastCol}${lastRow + 1}`,
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToXML = (data: any[], filename: string, rootElement = "data") => {
  if (data.length === 0) return

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<${rootElement}>
${data
  .map((item) => {
    const itemName = rootElement.slice(0, -1) // Remove 's' from plural
    return `  <${itemName}>
${Object.entries(item)
  .map(([key, value]) => `    <${key}>${value}</${key}>`)
  .join("\n")}
  </${itemName}>`
  })
  .join("\n")}
</${rootElement}>`

  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.xml`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportMultipleSheets = (sheets: { name: string; data: any[] }[], filename: string) => {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export const exportMultipleFormats = (
  data: any[],
  filename: string,
  formats: ("excel" | "csv" | "xml")[] = ["excel", "csv", "xml"],
) => {
  formats.forEach((format) => {
    switch (format) {
      case "excel":
        exportToExcel(data, filename)
        break
      case "csv":
        exportToCSV(data, filename)
        break
      case "xml":
        exportToXML(data, filename)
        break
    }
  })
}

export const exportMultipleSheetsAllFormats = (
  sheets: { name: string; data: any[] }[],
  filename: string,
  formats: ("excel" | "csv" | "xml")[] = ["excel", "csv", "xml"],
) => {
  formats.forEach((format) => {
    if (format === "excel") {
      exportMultipleSheets(sheets, filename)
    } else {
      sheets.forEach((sheet) => {
        const sheetFilename = `${filename}-${sheet.name.toLowerCase().replace(/\s+/g, "-")}`
        if (format === "csv") {
          exportToCSV(sheet.data, sheetFilename)
        } else if (format === "xml") {
          exportToXML(sheet.data, sheetFilename, sheet.name.toLowerCase())
        }
      })
    }
  })
}

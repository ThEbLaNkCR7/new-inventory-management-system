import ExcelJS from "exceljs"
import * as XLSX from "xlsx"

export type ExcelTableColumn = {
  key: string
  header: string
  width?: number
  /** Hint only — community xlsx cannot persist cell styles; numbers still right-align by default. */
  align?: "left" | "center" | "right"
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
    /** Empty columns on left/right for visual page margin (character width). */
    sideMargin?: number
    /** Excel print margins in inches. */
    margins?: {
      left?: number
      right?: number
      top?: number
      bottom?: number
    }
  },
) => {
  const {
    columns,
    title,
    sheetName = "Sheet1",
    sideMargin = 0,
    margins,
  } = options
  if (!columns.length) return

  const marginPad = sideMargin > 0 ? [""] : []
  const dataColCount = columns.length
  const totalColCount = dataColCount + marginPad.length * 2
  const dataStartCol = marginPad.length

  const aoa: (string | number)[][] = []
  let headerRowIndex = 0

  if (title) {
    aoa.push([...marginPad, title, ...Array(Math.max(dataColCount - 1, 0)).fill(""), ...marginPad])
    aoa.push(Array(totalColCount).fill(""))
    headerRowIndex = 2
  }

  aoa.push([
    ...marginPad,
    ...columns.map((col) => col.header),
    ...marginPad,
  ])
  rows.forEach((row) => {
    aoa.push([
      ...marginPad,
      ...columns.map((col) => (row[col.key] ?? "") as string | number),
      ...marginPad,
    ])
  })

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)

  if (title && dataColCount > 1) {
    worksheet["!merges"] = [
      {
        s: { r: 0, c: dataStartCol },
        e: { r: 0, c: dataStartCol + dataColCount - 1 },
      },
    ]
  }

  const colDefs: { wch: number }[] = []
  if (sideMargin > 0) colDefs.push({ wch: sideMargin })
  columns.forEach((col) => {
    colDefs.push({
      wch: col.width ?? Math.max(col.header.length + 2, 14),
    })
  })
  if (sideMargin > 0) colDefs.push({ wch: sideMargin })
  worksheet["!cols"] = colDefs

  // Print margins (inches) — mirrors side spacing when printing from Excel
  worksheet["!margins"] = {
    left: margins?.left ?? 0.7,
    right: margins?.right ?? 0.7,
    top: margins?.top ?? 0.5,
    bottom: margins?.bottom ?? 0.5,
    header: 0.3,
    footer: 0.3,
  }

  const lastRow = headerRowIndex + rows.length
  const firstDataCol = XLSX.utils.encode_col(dataStartCol)
  const lastDataCol = XLSX.utils.encode_col(dataStartCol + dataColCount - 1)
  const headerCell = `${firstDataCol}${headerRowIndex + 1}`
  worksheet["!autofilter"] = {
    ref: `${headerCell}:${lastDataCol}${lastRow + 1}`,
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

/** App display colors / type for styled Excel tables */
const DISPLAY = {
  font: "Calibri",
  navy: "171717",
  muted: "71717A",
  border: "165E6C",
  headerBg: "F4F4F5",
  rowBorder: "E4E4E7",
  white: "FFFFFF",
}

export type StyledExcelColumn = {
  key: string
  header: string
  width?: number
  align?: "left" | "center" | "right"
  wrap?: boolean
  bold?: boolean
}

/**
 * Excel export styled like the on-screen table (font, header, borders, side margins).
 * Uses ExcelJS so formatting is preserved — unlike community `xlsx`.
 */
export type StyledExcelCellValue =
  | string
  | number
  | ExcelJS.CellRichTextValue
  | null
  | undefined

export async function exportStyledTableToExcel(
  rows: Record<string, StyledExcelCellValue>[],
  filename: string,
  options: {
    sheetName?: string
    title: string
    columns: StyledExcelColumn[]
    /** Character width of empty side margin columns */
    sideMargin?: number
    /** Optional totals / summary row rendered after the data */
    totalsRow?: Record<string, StyledExcelCellValue>
  },
): Promise<void> {
  const {
    sheetName = "Sheet1",
    title,
    columns,
    sideMargin = 3,
    totalsRow,
  } = options
  if (!columns.length) return

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Inventory Management"
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9, // A4
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.55,
        bottom: 0.55,
        header: 0.3,
        footer: 0.3,
      },
    },
  })

  const dataStartCol = 2 // column B (A is left margin)
  const dataEndCol = dataStartCol + columns.length - 1

  sheet.getColumn(1).width = sideMargin
  columns.forEach((col, index) => {
    sheet.getColumn(dataStartCol + index).width =
      col.width ?? Math.max(col.header.length + 2, 14)
  })
  sheet.getColumn(dataEndCol + 1).width = sideMargin

  // Title — matches section title weight on the page
  sheet.mergeCells(1, dataStartCol, 1, dataEndCol)
  const titleCell = sheet.getCell(1, dataStartCol)
  titleCell.value = title
  titleCell.font = {
    name: DISPLAY.font,
    size: 16,
    bold: true,
    color: { argb: `FF${DISPLAY.navy}` },
  }
  titleCell.alignment = { vertical: "middle", horizontal: "left" }
  sheet.getRow(1).height = 26

  // Spacer row (breathing room like page padding)
  sheet.getRow(2).height = 10

  // Header row — table header style
  const headerRowIndex = 3
  const headerRow = sheet.getRow(headerRowIndex)
  headerRow.height = 22
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(dataStartCol + index)
    cell.value = col.header
    cell.font = {
      name: DISPLAY.font,
      size: 11,
      bold: true,
      color: { argb: `FF${DISPLAY.muted}` },
    }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${DISPLAY.headerBg}` },
    }
    cell.alignment = {
      vertical: "middle",
      horizontal: col.align === "right" ? "right" : "left",
      wrapText: false,
    }
    cell.border = {
      top: { style: "medium", color: { argb: `FF${DISPLAY.border}` } },
      bottom: { style: "medium", color: { argb: `FF${DISPLAY.border}` } },
      left: { style: "thin", color: { argb: `FF${DISPLAY.headerBg}` } },
      right: { style: "thin", color: { argb: `FF${DISPLAY.headerBg}` } },
    }
  })

  // Data rows
  const baseRowHeight = columns.some((col) => col.wrap) ? 28 : 20
  rows.forEach((row, rowOffset) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowOffset)
    excelRow.height = baseRowHeight
    columns.forEach((col, index) => {
      const cell = excelRow.getCell(dataStartCol + index)
      const value = row[col.key]
      const isRichText =
        Boolean(value) &&
        typeof value === "object" &&
        "richText" in (value as object)
      const isNumber = typeof value === "number"
      const textValue = typeof value === "string" ? value : ""

      if (isRichText) {
        cell.value = value as ExcelJS.CellRichTextValue
      } else if (isNumber) {
        cell.value = value
        cell.numFmt = "#,##0"
      } else {
        cell.value = (value as string | number | null | undefined) ?? ""
      }

      if (!isRichText) {
        cell.font = {
          name: DISPLAY.font,
          size: 11,
          bold: Boolean(col.bold) || isNumber,
          color: { argb: `FF${DISPLAY.navy}` },
        }
      }

      // Payment status badge-like colors (matches sales table)
      if (col.key === "paymentStatus" && textValue === "Received") {
        cell.font = {
          name: DISPLAY.font,
          size: 11,
          bold: true,
          color: { argb: "FF047857" },
        }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFECFDF5" },
        }
      } else if (col.key === "paymentStatus" && textValue === "Pending") {
        cell.font = {
          name: DISPLAY.font,
          size: 11,
          bold: true,
          color: { argb: "FFB45309" },
        }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFBEB" },
        }
      }

      cell.alignment = {
        vertical: "top",
        horizontal: col.align === "right" ? "right" : "left",
        wrapText: Boolean(col.wrap) || isRichText,
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: `FF${DISPLAY.rowBorder}` } },
      }
    })
  })

  // Autofilter on header + data (exclude totals row)
  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: dataStartCol },
      to: {
        row: headerRowIndex + rows.length,
        column: dataEndCol,
      },
    }
  }

  // Totals row
  if (totalsRow) {
    const totalsRowIndex = headerRowIndex + rows.length + 1
    const excelRow = sheet.getRow(totalsRowIndex)
    excelRow.height = 24
    columns.forEach((col, index) => {
      const cell = excelRow.getCell(dataStartCol + index)
      const value = totalsRow[col.key]
      const isNumber = typeof value === "number"

      if (isNumber) {
        cell.value = value
        cell.numFmt = "#,##0"
      } else {
        cell.value = (value as string | number | null | undefined) ?? ""
      }

      cell.font = {
        name: DISPLAY.font,
        size: 12,
        bold: true,
        color: { argb: `FF${DISPLAY.navy}` },
      }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${DISPLAY.headerBg}` },
      }
      cell.alignment = {
        vertical: "middle",
        horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
      }
      cell.border = {
        top: { style: "medium", color: { argb: `FF${DISPLAY.border}` } },
        bottom: { style: "medium", color: { argb: `FF${DISPLAY.border}` } },
      }
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.xlsx`
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

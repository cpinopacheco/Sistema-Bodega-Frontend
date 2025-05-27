import * as XLSX from "xlsx"

export const ExportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")

  // Ajustar anchos de columna
  const columnsWidth: { [key: string]: number } = {}

  // Medir ancho de encabezados
  Object.keys(data[0] || {}).forEach((key) => {
    columnsWidth[key] = key.length + 2 // Ancho mínimo
  })

  // Medir ancho de datos
  data.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      const length = value ? String(value).length : 0
      columnsWidth[key] = Math.max(columnsWidth[key], length + 2)
    })
  })

  // Aplicar anchos de columna
  worksheet["!cols"] = Object.values(columnsWidth).map((width) => ({ width }))

  // Generar archivo
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

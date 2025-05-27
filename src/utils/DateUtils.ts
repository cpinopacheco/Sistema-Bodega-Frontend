export const formatDate = (dateString: string, format: "full" | "time" | "simple" = "full") => {
  const date = new Date(dateString)

  if (format === "time") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (format === "simple") {
    return date.toISOString().split("T")[0].replaceAll("-", "")
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

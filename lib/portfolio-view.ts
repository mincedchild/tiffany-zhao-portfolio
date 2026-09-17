import { projectSeriesOrder } from "@/lib/artworks"

export type View = "project" | "sketchbook" | "tattoo" | "about" | null
export type ProjectSeries = string

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function parseView(value: string | undefined): View {
  if (value === "project" || value === "sketchbook" || value === "tattoo" || value === "about") {
    return value
  }
  return null
}

export function parseSeries(value: string | undefined): ProjectSeries {
  if (value && projectSeriesOrder.includes(value)) return value
  return projectSeriesOrder[0] ?? ""
}

export function hrefFor(view: View, series: ProjectSeries) {
  const params = new URLSearchParams()
  if (view) params.set("view", view)
  if (view === "project") params.set("series", series)
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

export function parsePortfolioLocation(search: string) {
  const params = new URLSearchParams(search)
  return {
    view: parseView(params.get("view") ?? undefined),
    projectSeries: parseSeries(params.get("series") ?? undefined),
  }
}

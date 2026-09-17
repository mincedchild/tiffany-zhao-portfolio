import catalog from "@/lib/catalog.generated.json"

export type Category = "home" | "project" | "sketchbook" | "tattoo"

export type Artwork = {
  id: string
  title: string
  src: string
  category: Category
  series?: string
  kind?: "image" | "video"
  projectsOnly?: boolean
  quoteSrc?: string
  fullRow?: boolean
  lead?: boolean
}

export type ProjectLayout =
  | "recollection"
  | "book-grid"
  | "column-captions"
  | "centered-comic"
  | "column"

export type ProjectSeriesInfo = {
  name: string
  layout: ProjectLayout
  title: string
  meta: string
  description: string
  credit: string
  introVideoSrc: string | null
  headerAlign: boolean
  lightbox: boolean
}

export const projectSeries = catalog.projectSeries as ProjectSeriesInfo[]
export const projectSeriesOrder = projectSeries.map((series) => series.name)
export const homeDisplayOrder = catalog.homeOrder as readonly string[]
export const artworks = catalog.artworks as Artwork[]

export function getProjectSeries(name: string) {
  return projectSeries.find((series) => series.name === name) ?? projectSeries[0]
}

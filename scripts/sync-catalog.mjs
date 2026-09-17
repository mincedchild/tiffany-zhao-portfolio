import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artRoot = path.join(root, "public", "art")
const sitePath = path.join(root, "content", "site.json")
const outPath = path.join(root, "lib", "catalog.generated.json")

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".mov", ".mp4", ".webm"])
const VIDEO_EXT = new Set([".mov", ".mp4", ".webm"])

const site = JSON.parse(fs.readFileSync(sitePath, "utf8"))
const pieces = site.pieces ?? {}
const pieceOrder = site.pieceOrder ?? []
const homeOrder = [...(site.homeOrder ?? [])]
const projectOrder = [...(site.projectOrder ?? [])]

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.name.startsWith(".")) return []
    if (entry.isDirectory()) return listFiles(full)
    return [full]
  })
}

function prettyTitle(stem) {
  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function toPublicSrc(abs) {
  return `/${path.relative(path.join(root, "public"), abs).split(path.sep).join("/")}`
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function titleFromFolder(folder) {
  return folder
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const projectDirs = fs.existsSync(path.join(artRoot, "projects"))
  ? fs
      .readdirSync(path.join(artRoot, "projects"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_") && !entry.name.startsWith("."))
      .map((entry) => entry.name)
  : []

const projectSeries = []
const projectByFolder = new Map()

for (const folder of projectDirs) {
  const dir = path.join(artRoot, "projects", folder)
  const configPath = path.join(dir, "project.json")
  const config = fs.existsSync(configPath) ? readJson(configPath) : {}
  const series = {
    folder,
    name: config.name ?? titleFromFolder(folder),
    layout: config.layout ?? "column",
    title: config.title ?? config.name ?? titleFromFolder(folder),
    meta: config.meta ?? "",
    description: config.description ?? "",
    credit: config.credit ?? "",
    introVideo: config.introVideo ?? null,
    introVideoSrc: config.introVideo ? `/art/projects/${folder}/${config.introVideo}` : null,
    headerAlign: Boolean(config.headerAlign),
    lightbox: config.lightbox !== false,
  }
  projectByFolder.set(folder, series)
  projectSeries.push(series)
}

projectSeries.sort((a, b) => {
  const ai = projectOrder.indexOf(a.name)
  const bi = projectOrder.indexOf(b.name)
  const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai
  const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi
  if (av !== bv) return av - bv
  return a.name.localeCompare(b.name)
})

const artworks = []
const seenSrc = new Set()

function addArtwork(abs, guessed) {
  const ext = path.extname(abs).toLowerCase()
  if (!IMAGE_EXT.has(ext)) return
  const src = toPublicSrc(abs)
  if (seenSrc.has(src)) return
  const override = pieces[src] ?? {}
  if (override.skip) return

  const stem = path.basename(abs, path.extname(abs))
  const kind = override.kind ?? (VIDEO_EXT.has(ext) ? "video" : "image")
  const id = override.id ?? guessed.id ?? slug(`${guessed.idPrefix ?? "art"}-${stem}`)
  const title = override.title ?? guessed.title ?? prettyTitle(stem)
  const category = override.category ?? guessed.category
  const series = override.series ?? guessed.series
  const showOnHome = override.showOnHome ?? guessed.showOnHome ?? false
  const artwork = {
    id,
    title,
    src,
    category,
    kind,
    projectsOnly: !showOnHome,
  }
  if (series) artwork.series = series
  if (override.quote) artwork.quoteSrc = override.quote
  if (override.fullRow) artwork.fullRow = true
  if (override.lead) artwork.lead = true
  artworks.push(artwork)
  seenSrc.add(src)
  if (showOnHome && !homeOrder.includes(id)) homeOrder.push(id)
}

for (const abs of listFiles(path.join(artRoot, "home"))) {
  addArtwork(abs, { category: "home", idPrefix: "home", showOnHome: true })
}

for (const abs of listFiles(path.join(artRoot, "sketchbook"))) {
  addArtwork(abs, { category: "sketchbook", idPrefix: "sketchbook", showOnHome: false })
}

for (const abs of listFiles(path.join(artRoot, "tattoo", "flash"))) {
  addArtwork(abs, { category: "tattoo", series: "Flash", idPrefix: "tattoo-flash", showOnHome: false })
}

const tattooWorkDir = path.join(artRoot, "tattoo", "work")
for (const abs of listFiles(tattooWorkDir)) {
  addArtwork(abs, { category: "tattoo", series: "Work", idPrefix: "tattoo-work", showOnHome: false })
}

const tattooRoot = path.join(artRoot, "tattoo")
if (fs.existsSync(tattooRoot)) {
  for (const entry of fs.readdirSync(tattooRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    addArtwork(path.join(tattooRoot, entry.name), {
      category: "tattoo",
      series: "Work",
      idPrefix: "tattoo-work",
      showOnHome: false,
    })
  }
}

for (const folder of projectDirs) {
  const series = projectByFolder.get(folder)
  const dir = path.join(artRoot, "projects", folder)
  for (const abs of listFiles(dir)) {
    const rel = path.relative(dir, abs).split(path.sep).join("/")
    if (rel === "project.json") continue
    if (rel.startsWith("quotes/")) continue
    if (series.introVideo && path.basename(abs) === series.introVideo) continue
    addArtwork(abs, {
      category: "project",
      series: series.name,
      idPrefix: folder,
      showOnHome: false,
    })
  }
}

const introVideoSrcs = new Set(
  projectSeries.filter((series) => series.introVideoSrc).map((series) => series.introVideoSrc),
)

for (const [src, override] of Object.entries(pieces)) {
  if (seenSrc.has(src) || override.skip || introVideoSrcs.has(src)) continue
  const abs = path.join(root, "public", src.replace(/^\//, ""))
  if (!fs.existsSync(abs)) continue
  addArtwork(abs, {
    category: override.category ?? "home",
    series: override.series,
    idPrefix: override.id ?? "art",
    showOnHome: override.showOnHome ?? false,
    id: override.id,
    title: override.title,
  })
}

const orderIndex = new Map(pieceOrder.map((id, index) => [id, index]))
artworks.sort((a, b) => {
  const ai = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER
  const bi = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER
  if (ai !== bi) return ai - bi
  if (a.lead !== b.lead) return a.lead ? -1 : 1
  return a.src.localeCompare(b.src)
})

const catalog = {
  projectSeries: projectSeries.map(({ folder: _folder, introVideo: _introVideo, ...rest }) => rest),
  homeOrder,
  artworks,
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2) + "\n")
console.log(
  `Catalog: ${artworks.length} artworks, ${projectSeries.length} projects → ${path.relative(root, outPath)}`,
)

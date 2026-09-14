"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { artworks, type Artwork } from "@/lib/artworks"
import { homeDisplayOrder } from "@/lib/home-display-order"
import { applyHomeOrder } from "@/lib/apply-home-order"
import { Lightbox } from "@/components/lightbox"
import { ProjectsSplit } from "@/components/projects-split"
import type { ProjectSeries, View } from "@/components/floating-nav"

const homeArtworks = artworks.filter((artwork) => !artwork.projectsOnly)
const mixedHome = homeDisplayOrder.length
  ? applyHomeOrder(homeArtworks, homeDisplayOrder)
  : homeArtworks

function PolaroidMedia({ artwork }: { artwork: Artwork }) {
  const className = "pointer-events-none block aspect-square w-full object-cover"

  if (artwork.kind === "video") {
    return (
      <video
        src={artwork.src}
        muted
        playsInline
        preload="metadata"
        className={className}
      />
    )
  }

  if (artwork.src.toLowerCase().endsWith(".gif")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={artwork.src} alt={artwork.title} draggable={false} className={className} />
  }

  return (
    <Image
      src={artwork.src || "/placeholder.svg"}
      alt={artwork.title}
      width={466}
      height={466}
      draggable={false}
      className={className}
    />
  )
}

function GalleryCard({
  artwork,
  onOpen,
}: {
  artwork: Artwork
  onOpen: (a: Artwork) => void
}) {
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => onOpen(artwork)}
        aria-label={`View ${artwork.title}`}
        className="group block w-full cursor-pointer outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black/30"
      >
        <PolaroidMedia artwork={artwork} />
      </button>
    </div>
  )
}

const sketchbookArtworks = (() => {
  const items = artworks.filter((artwork) => artwork.category === "sketchbook")
  if (items.length < 2) return items
  return [items[1], items[0], ...items.slice(2)]
})()

const tattooFlashArtworks = artworks.filter(
  (artwork) => artwork.category === "tattoo" && artwork.series === "Flash",
)
const tattooWorkArtworks = artworks.filter(
  (artwork) => artwork.category === "tattoo" && artwork.series === "Work",
)

function SketchbookMedia({
  artwork,
  className,
  width,
  height,
}: {
  artwork: Artwork
  className: string
  width: number
  height: number
}) {
  if (artwork.src.toLowerCase().endsWith(".gif")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={artwork.src}
        alt={artwork.title}
        draggable={false}
        className={className}
      />
    )
  }

  return (
    <Image
      src={artwork.src || "/placeholder.svg"}
      alt={artwork.title}
      width={width}
      height={height}
      draggable={false}
      className={className}
    />
  )
}

function SketchbookStrip({
  items,
  selected,
  onSelect,
}: {
  items: Artwork[]
  selected: Artwork | null
  onSelect: (artwork: Artwork) => void
}) {
  const index = selected ? items.findIndex((item) => item.id === selected.id) : -1
  const wheelLock = useRef(false)
  const wheelCarry = useRef(0)

  useEffect(() => {
    if (selected || !items[0]) return
    if (!window.matchMedia("(max-width: 767px)").matches) return
    onSelect(items[0])
  }, [items, onSelect, selected])

  useEffect(() => {
    function isDesktop() {
      return window.matchMedia("(min-width: 768px)").matches
    }

    function step(direction: number) {
      const current = index < 0 ? (direction > 0 ? -1 : 0) : index
      onSelect(items[(current + direction + items.length) % items.length])
    }

    function onKey(e: KeyboardEvent) {
      if (!isDesktop()) return
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        step(-1)
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        step(1)
      }
    }

    function onWheel(e: WheelEvent) {
      if (!isDesktop()) return
      e.preventDefault()
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      wheelCarry.current += delta
      if (wheelLock.current) return
      if (Math.abs(wheelCarry.current) < 48) return
      const direction = wheelCarry.current > 0 ? 1 : -1
      wheelCarry.current = 0
      wheelLock.current = true
      step(direction)
      window.setTimeout(() => {
        wheelLock.current = false
      }, 320)
    }

    document.addEventListener("keydown", onKey)
    window.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("wheel", onWheel)
    }
  }, [index, items, onSelect])

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden md:h-dvh md:overflow-hidden">
      <section
        aria-label="Sketchbook"
        className="relative z-[60] order-2 shrink-0 pt-2 pr-2 pb-8 pl-2 md:order-1 md:pt-3 md:pr-3 md:pb-0 md:pl-[min(11.25rem,20vw)]"
      >
        <div className="flex flex-wrap content-start justify-start gap-[4px]">
          {items.map((artwork) => {
            const isSelected = selected?.id === artwork.id
            return (
              <button
                key={artwork.id}
                type="button"
                onClick={() => onSelect(artwork)}
                aria-label={`View ${artwork.title}`}
                aria-pressed={isSelected}
                className={`h-[76px] shrink-0 overflow-hidden bg-transparent p-0 leading-none outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-black/30 md:h-[88px] ${
                  isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                }`}
              >
                <SketchbookMedia
                  artwork={artwork}
                  width={280}
                  height={180}
                  className="block h-full w-auto max-w-none object-cover"
                />
              </button>
            )
          })}
        </div>
      </section>

      <div className="relative order-1 flex h-[min(52vh,28rem)] shrink-0 items-center justify-center overflow-hidden px-2 pb-4 pt-2 md:order-2 md:h-auto md:min-h-0 md:flex-1 md:px-0 md:pb-6 md:pt-5 md:pl-[min(11.25rem,20vw)] md:pr-6">
        {selected ? (
          <figure className="flex h-full max-h-full max-w-full items-center justify-center">
            <SketchbookMedia
              artwork={selected}
              width={1400}
              height={1400}
              className="max-h-[min(48vh,26rem)] w-auto max-w-full object-contain md:h-full md:max-h-full"
            />
          </figure>
        ) : null}
      </div>
    </div>
  )
}

function TattooFlashRow({ items }: { items: Artwork[] }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row || items.length === 0) return

    function update() {
      const box = rowRef.current
      if (!box) return
      const imgs = [...box.querySelectorAll("img")]
      if (imgs.length === 0 || imgs.some((img) => img.naturalWidth === 0)) return
      const styles = getComputedStyle(box)
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0
      const sumAspect = imgs.reduce((sum, img) => sum + img.naturalWidth / img.naturalHeight, 0)
      setHeight((box.clientWidth - gap * (imgs.length - 1)) / sumAspect)
    }

    update()
    const imgs = [...row.querySelectorAll("img")]
    for (const img of imgs) img.addEventListener("load", update)
    const ro = new ResizeObserver(update)
    ro.observe(row)
    return () => {
      for (const img of imgs) img.removeEventListener("load", update)
      ro.disconnect()
    }
  }, [items.length])

  if (items.length === 0) return null

  return (
    <div
      ref={rowRef}
      aria-label="Flash"
      className="flex w-full justify-center gap-2 overflow-hidden md:gap-3"
    >
      {items.map((artwork) => (
        <div
          key={artwork.id}
          style={height ? { height } : undefined}
          className="shrink-0 overflow-hidden"
        >
          <Image
            src={artwork.src || "/placeholder.svg"}
            alt={artwork.title}
            width={1400}
            height={1400}
            draggable={false}
            className="block h-full w-auto max-w-none"
          />
        </div>
      ))}
    </div>
  )
}

function TattooBannerStrip({ items }: { items: Artwork[] }) {
  return (
    <div className="flex gap-2 pr-2 md:gap-3 md:pr-3">
      {items.map((artwork) => (
        <div key={artwork.id} className="h-[7.5rem] shrink-0 overflow-hidden md:h-[9rem]">
          <Image
            src={artwork.src || "/placeholder.svg"}
            alt={artwork.title}
            width={1400}
            height={1400}
            draggable={false}
            className="block h-full w-auto max-w-none"
          />
        </div>
      ))}
    </div>
  )
}

function TattooRow({ label, items }: { label: string; items: Artwork[] }) {
  if (items.length === 0) return null

  return (
    <div aria-label={label} className="overflow-hidden">
      <div className="tattoo-banner-track">
        <TattooBannerStrip items={items} />
        <div aria-hidden>
          <TattooBannerStrip items={items} />
        </div>
      </div>
    </div>
  )
}

function TattooPage({
  flash,
  work,
}: {
  flash: Artwork[]
  work: Artwork[]
}) {
  return (
    <section
      aria-label="Tattoo"
      className="flex min-h-dvh w-full flex-col gap-6 px-2 pb-24 pt-2 md:gap-8 md:px-8 md:pl-[min(13rem,22vw)] md:pt-10"
    >
      <TattooRow label="Tattoo work" items={work} />
      <TattooFlashRow items={flash} />
    </section>
  )
}

function AboutNote() {
  const valley =
    "font-valley text-[16.5px] leading-snug text-black [font-weight:320] [font-variation-settings:'wght'_320]"

  return (
    <section
      aria-label="About"
      className="min-h-dvh w-full px-4 pb-24 pt-16 md:px-8 md:pl-[min(13rem,22vw)] md:pt-10"
    >
      <h1 className="font-hand text-2xl font-normal leading-none text-primary [font-synthesis:none] [font-variation-settings:normal] md:text-3xl">
        Tiffany Zhao{" "}
        <span lang="zh-Hans" className="font-valley text-[0.85em] [font-weight:320] [font-variation-settings:'wght'_320]">
          赵梦童
        </span>
      </h1>
      <div className={`mt-6 max-w-[34rem] ${valley}`}>
        <p>Doodling, illustrating, tattooing</p>
        <p className="mt-1">
          Available for freelance work, and tattoo bookings! Just shoot me an email! {"<3"}
        </p>
        <p className="mt-6">Education - School of Visual Arts, New York, 2022-2026</p>
        <p className="mt-1 text-primary">
          Email -{" "}
          <a href="mailto:mincedchild@gmail.com" className="underline-offset-2 hover:underline">
            mincedchild@gmail.com
          </a>
        </p>
        <p className="mt-1 text-primary">
          Socials -{" "}
          <a
            href="https://www.instagram.com/minced.child/"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            minced.child
          </a>
        </p>
      </div>
    </section>
  )
}

export function ScrapbookGallery({
  view,
  projectSeries,
}: {
  view: View
  projectSeries: ProjectSeries
}) {
  const [active, setActive] = useState<Artwork | null>(null)

  useEffect(() => {
    if (view === "sketchbook") {
      if (active?.category !== "sketchbook") {
        setActive(sketchbookArtworks[0] ?? null)
      }
      return
    }
    if (!active) return
    if (view === "about") {
      setActive(null)
      return
    }
    if (view === "project" && projectSeries === "Re:Collection") {
      setActive(null)
      return
    }
    if (view === null) {
      if (active.projectsOnly) setActive(null)
      return
    }
    if (active.category !== view) {
      setActive(null)
    }
  }, [view, active, projectSeries])

  const cards = useMemo(() => {
    if (view === "about" || view === "tattoo") return []
    return mixedHome
  }, [view])

  useLayoutEffect(() => {
    function firstImageOnSecondRow(grid: Element) {
      const items = [...grid.querySelectorAll(":scope > div:not([aria-hidden])")] as HTMLElement[]
      const buckets = new Map<number, HTMLElement[]>()
      for (const el of items) {
        const top = Math.round(el.getBoundingClientRect().top / 8) * 8
        const list = buckets.get(top) ?? []
        list.push(el)
        buckets.set(top, list)
      }
      const tops = [...buckets.keys()].sort((a, b) => a - b)
      if (tops.length < 2) return null
      const row2 = buckets.get(tops[1])!
      row2.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      return row2[0]
    }

    function update() {
      const box = document.querySelector<HTMLElement>("[data-home-stair]")
      if (!box) return
      if (getComputedStyle(box).display === "none") return
      const grid = document.querySelector(".home-grid")
      if (!grid) return
      const image = firstImageOnSecondRow(grid)
      if (!image) return
      const width = Math.max(0, Math.round(image.getBoundingClientRect().right - box.getBoundingClientRect().left))
      box.style.width = `${width}px`
    }

    update()
    const ro = new ResizeObserver(() => requestAnimationFrame(update))
    ro.observe(document.documentElement)
    const grid = document.querySelector(".home-grid")
    if (grid) ro.observe(grid)
    window.addEventListener("resize", update)
    void document.fonts?.ready.then(update)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [view, cards])

  const lightboxItems = useMemo(() => {
    if (view === "sketchbook") return sketchbookArtworks
    if (view === "project") {
      const items = artworks.filter((artwork) => artwork.series === projectSeries)
      if (projectSeries !== "The Little Green Monster") return items
      const flip = items.find((artwork) => artwork.id === "little-green-monster-flip")
      const rest = items.filter((artwork) => artwork.id !== "little-green-monster-flip")
      return flip ? [flip, ...rest] : rest
    }
    return mixedHome
  }, [view, projectSeries])

  const lightbox = (
    <Lightbox
      artwork={active}
      items={lightboxItems}
      onChange={setActive}
      onClose={() => setActive(null)}
    />
  )

  if (view === "project") {
    const recollection = projectSeries === "Re:Collection"
    const feedingFrenzy = projectSeries === "Feeding Frenzy"
    const skipLightbox = recollection || feedingFrenzy
    return (
      <>
        <ProjectsSplit series={projectSeries} onOpen={skipLightbox ? undefined : setActive} />
        {skipLightbox ? null : lightbox}
      </>
    )
  }

  if (view === "sketchbook") {
    return (
      <SketchbookStrip
        items={sketchbookArtworks}
        selected={active?.category === "sketchbook" ? active : null}
        onSelect={setActive}
      />
    )
  }

  if (view === "tattoo") {
    return <TattooPage flash={tattooFlashArtworks} work={tattooWorkArtworks} />
  }

  if (view === "about") {
    return <AboutNote />
  }

  return (
    <section className="relative min-h-dvh w-full px-2 pb-24 pt-1.5 md:px-8 md:pt-10">
      <div className="home-grid grid w-full justify-start gap-1.5 sm:gap-3.5 md:justify-center md:gap-4">
        {cards.length > 0 ? (
          <div aria-hidden className="col-span-1 row-span-1 hidden md:block" />
        ) : null}
        {cards.map((artwork) => (
          <GalleryCard key={artwork.id} artwork={artwork} onOpen={setActive} />
        ))}
      </div>

      {lightbox}
    </section>
  )
}

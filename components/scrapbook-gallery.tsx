"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { artworks, getProjectSeries, type Artwork } from "@/lib/artworks"
import { homeDisplayOrder } from "@/lib/home-display-order"
import { applyHomeOrder } from "@/lib/apply-home-order"
import { Lightbox } from "@/components/lightbox"
import { ProjectsSplit } from "@/components/projects-split"
import type { ProjectSeries, View } from "@/components/floating-nav"

const homeArtworks = artworks.filter((artwork) => !artwork.projectsOnly)
const mixedHome = homeDisplayOrder.length
  ? applyHomeOrder(homeArtworks, homeDisplayOrder)
  : homeArtworks

function PolaroidMedia({
  artwork,
  eager,
}: {
  artwork: Artwork
  eager?: boolean
}) {
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
      sizes="(max-width: 767px) 33vw, 20vw"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      draggable={false}
      className={className}
    />
  )
}

function GalleryCard({
  artwork,
  onOpen,
  eager,
}: {
  artwork: Artwork
  onOpen: (a: Artwork) => void
  eager?: boolean
}) {
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => onOpen(artwork)}
        aria-label={`View ${artwork.title}`}
        className="group block w-full cursor-pointer outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black/30"
      >
        <PolaroidMedia artwork={artwork} eager={eager} />
      </button>
    </div>
  )
}

const sketchbookArtworks = artworks.filter((artwork) => artwork.category === "sketchbook")

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
      sizes={width <= 280 ? "140px" : "(max-width: 767px) 90vw, 70vw"}
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
  if (items.length === 0) return null

  const odd = items.length % 2 === 1
  const left = items.filter((_, index) => index % 2 === 0 && !(odd && index === items.length - 1))
  const right = items.filter((_, index) => index % 2 === 1 || (odd && index === items.length - 1))

  return (
    <div aria-label="Flash" className="grid w-full grid-cols-2 items-start gap-2 md:gap-3">
      {[left, right].map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-col gap-2 md:gap-3">
          {column.map((artwork) => (
            <div key={artwork.id} className="overflow-hidden">
              <Image
                src={artwork.src || "/placeholder.svg"}
                alt={artwork.title}
                width={1400}
                height={1400}
                sizes="(max-width: 767px) 50vw, 40vw"
                draggable={false}
                className="block h-auto w-full"
              />
            </div>
          ))}
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
            sizes="220px"
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

function GobBarRow() {
  const rowRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    function align() {
      const row = rowRef.current
      if (!row) return
      if (!window.matchMedia("(min-width: 768px)").matches) {
        row.style.left = ""
        return
      }
      const header = document.querySelector("header.fixed.left-0.top-0")
      const tattoo = header
        ? [...header.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Tattoo")
        : null
      const section = row.offsetParent
      if (!tattoo || !(section instanceof HTMLElement)) return
      row.style.left = `${tattoo.getBoundingClientRect().left - section.getBoundingClientRect().left}px`
    }

    align()
    const mq = window.matchMedia("(min-width: 768px)")
    mq.addEventListener("change", align)
    window.addEventListener("resize", align)
    document.fonts?.ready.then(align)
    return () => {
      mq.removeEventListener("change", align)
      window.removeEventListener("resize", align)
    }
  }, [])

  return (
    <div
      ref={rowRef}
      className="mt-auto flex justify-center pt-10 md:absolute md:bottom-4 md:mt-0 md:justify-start md:pt-0"
    >
      {[0, 1, 2].map((i) => (
        <Image
          key={i}
          src="/art/about/gob-bar.png"
          alt={i === 0 ? "Gob bar" : ""}
          width={683}
          height={838}
          sizes="6rem"
          draggable={false}
          className="block h-auto w-[min(22vw,7.5rem)] md:w-[5.25rem]"
        />
      ))}
    </div>
  )
}

function AboutNote() {
  const valley =
    "font-valley text-[16.5px] leading-snug text-black [font-weight:320] [font-variation-settings:'wght'_320]"

  return (
    <section
      aria-label="About"
      className="relative flex min-h-dvh w-full flex-col px-4 pb-8 pt-16 md:h-dvh md:overflow-hidden md:px-8 md:pb-10 md:pl-[min(13rem,22vw)] md:pt-10"
    >
      <Image
        src="/art/about/selfie.jpg"
        alt="Tiffany Zhao"
        width={904}
        height={1241}
        sizes="11rem"
        draggable={false}
        className="mb-6 block h-auto w-[min(33.6vw,10.4rem)] md:hidden"
      />
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
      </div>
      <div className={`mt-1 flex items-start justify-between gap-6 ${valley}`}>
        <div className="min-w-0">
          <p className="text-primary">
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
            {"  |  "}
            <a
              href="https://www.instagram.com/teef.tats/"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              teef.tats
            </a>
          </p>
        </div>
        <Image
          src="/art/about/selfie.jpg"
          alt="Tiffany Zhao"
          width={904}
          height={1241}
          sizes="13rem"
          draggable={false}
          className="hidden h-auto w-[12.8rem] shrink-0 md:block"
        />
      </div>
      <GobBarRow />
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

  useLayoutEffect(() => {
    if (view === "sketchbook") {
      setActive((current) =>
        current?.category === "sketchbook" ? current : (sketchbookArtworks[0] ?? null),
      )
      return
    }
    if (view === "about" || view === "tattoo" || view === null) {
      setActive(null)
      return
    }
    if (view === "project" && !getProjectSeries(projectSeries).lightbox) {
      setActive(null)
    }
  }, [view, projectSeries])

  const cards = view === "about" || view === "tattoo" ? [] : mixedHome

  const lightboxItems = useMemo(() => {
    if (view === "sketchbook") return sketchbookArtworks
    if (view === "project") {
      const items = artworks.filter((artwork) => artwork.series === projectSeries)
      const lead = items.filter((artwork) => artwork.lead)
      const rest = items.filter((artwork) => !artwork.lead)
      return [...lead, ...rest]
    }
    return mixedHome
  }, [view, projectSeries])

  const lightbox = (
    <Lightbox
      artwork={active}
      items={lightboxItems}
      onChange={setActive}
      onClose={() => setActive(null)}
      hideSketchbookTitle={view === null}
    />
  )

  if (view === "project") {
    const skipLightbox = !getProjectSeries(projectSeries).lightbox
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
        {cards.map((artwork, index) => (
          <GalleryCard
            key={artwork.id}
            artwork={artwork}
            onOpen={setActive}
            eager={index < 6}
          />
        ))}
      </div>

      {lightbox}
    </section>
  )
}

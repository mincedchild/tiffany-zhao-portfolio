"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react"
import Image from "next/image"
import { artworks, type Artwork } from "@/lib/artworks"
import type { ProjectSeries } from "@/components/floating-nav"

type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
  webkitDisplayingFullscreen?: boolean
}

type SeriesIntroCopy = {
  title: string
  meta: string
  description: string
  credit: string
}

const recollectionIntro = {
  title: "Re:Collection- Senior Thesis Project",
  meta: "New York, 2026",
  description: "Reimagining and illustrating entries from my personal dream journal.",
  credit: "Tattooed with Ink on Silicone skin",
} as const satisfies SeriesIntroCopy

const littleGreenMonsterIntro = {
  title: "The Little Green Monster Book project",
  meta: "New York, 2025",
  description:
    "Illustrated Short story of “The Little Green Monster”- The Elephant vanishes, Haruki Murakami",
  credit: "Watercolour, Hand-bound Hard cover book",
} as const satisfies SeriesIntroCopy

const feedingFrenzyIntro = {
  title: "Feeding Frenzy",
  meta: "New York, 2025",
  description: "Narrative painting triptych",
  credit: '18" x 24" Oil on Artboard',
} as const satisfies SeriesIntroCopy

const grandCentralIntro = {
  title: "Grand Central (Infe)Station",
  meta: "New York, 2025",
  description: "Live Drawing",
  credit: "Procreate, Digital triptych comic",
} as const satisfies SeriesIntroCopy

function RecollectionBookVideo() {
  const videoRef = useRef<FullscreenVideo>(null)
  const [fullscreen, setFullscreen] = useState(false)

  function isThisVideoFullscreen(el: FullscreenVideo) {
    return (
      document.fullscreenElement === el ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ===
        el ||
      Boolean(el.webkitDisplayingFullscreen)
    )
  }

  async function enterFullscreen() {
    const el = videoRef.current
    if (!el) return
    el.controls = true
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen()
      } else {
        el.webkitEnterFullscreen?.()
      }
    } catch {
      el.webkitEnterFullscreen?.()
    }
  }

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const syncFullscreen = () => {
      const on = isThisVideoFullscreen(el)
      setFullscreen(on)
      el.controls = on
      if (!on) {
        el.muted = true
        el.loop = true
        void el.play().catch(() => {})
      }
    }

    const playInline = () => {
      if (isThisVideoFullscreen(el)) return
      el.muted = true
      void el.play().catch(() => {})
    }

    playInline()
    el.addEventListener("canplay", playInline)
    el.addEventListener("loadeddata", playInline)
    document.addEventListener("fullscreenchange", syncFullscreen)
    document.addEventListener("webkitfullscreenchange", syncFullscreen)
    el.addEventListener("webkitbeginfullscreen", syncFullscreen)
    el.addEventListener("webkitendfullscreen", syncFullscreen)

    return () => {
      el.removeEventListener("canplay", playInline)
      el.removeEventListener("loadeddata", playInline)
      document.removeEventListener("fullscreenchange", syncFullscreen)
      document.removeEventListener("webkitfullscreenchange", syncFullscreen)
      el.removeEventListener("webkitbeginfullscreen", syncFullscreen)
      el.removeEventListener("webkitendfullscreen", syncFullscreen)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src="/art/projects/recollection/book.mov"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={fullscreen}
      aria-label="Book"
      className="h-auto w-full cursor-pointer object-contain"
      onClick={() => {
        if (!fullscreen) void enterFullscreen()
      }}
    />
  )
}

function ProjectSeriesHeader({
  copy,
  titleRef,
  leftColumnMatch,
}: {
  copy: SeriesIntroCopy
  titleRef?: RefObject<HTMLHeadingElement | null>
  leftColumnMatch?: string
}) {
  const titleClassName =
    "font-hand text-base font-normal leading-none [font-synthesis:none] [font-variation-settings:normal] md:text-lg"

  return (
    <header className="pointer-events-none sticky top-12 z-30 bg-transparent pt-6 pb-4 font-valley text-[16.5px] leading-snug text-black md:top-0 md:z-20 md:pt-8 md:pb-6 [font-weight:320] [font-variation-settings:'wght'_320]">
      <div
        className={
          leftColumnMatch
            ? "flex flex-col gap-1.5 md:grid md:grid-cols-[max-content_minmax(0,28rem)] md:items-start md:gap-x-4 md:gap-y-0"
            : "flex flex-col gap-1.5 md:flex-row md:items-start md:gap-4"
        }
      >
        {leftColumnMatch ? (
          <span aria-hidden className={`invisible col-start-1 row-start-1 hidden whitespace-nowrap md:block ${titleClassName}`}>
            {leftColumnMatch}
          </span>
        ) : null}
        <div className={leftColumnMatch ? "col-start-1 row-start-1 shrink-0" : "shrink-0"}>
          <h1 ref={titleRef} className={titleClassName}>
            {copy.title}
          </h1>
          <p className="mt-0.5 leading-none">{copy.meta}</p>
        </div>
        <div className={leftColumnMatch ? "col-start-2 row-start-1 max-w-[28rem]" : "max-w-[28rem]"}>
          <p className="leading-snug">{copy.description}</p>
          <p className="mt-1 leading-snug">{copy.credit}</p>
        </div>
      </div>
    </header>
  )
}

function RecollectionIntro() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [titleWidth, setTitleWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    const update = () => setTitleWidth(el.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <ProjectSeriesHeader copy={recollectionIntro} titleRef={titleRef} />
      <div className="mb-6 mt-1 md:mb-8" style={titleWidth ? { width: titleWidth } : undefined}>
        <RecollectionBookVideo />
      </div>
    </>
  )
}

const LITTLE_GREEN_FULL_ROW_IDS = new Set([
  "little-green-monster-flip",
  "little-green-monster-3",
])

function ProjectMedia({
  artwork,
  className = "h-auto w-full object-contain",
}: {
  artwork: Artwork
  className?: string
}) {

  if (artwork.kind === "video") {
    return (
      <video
        src={artwork.src}
        muted
        playsInline
        controls
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
      width={1400}
      height={1400}
      draggable={false}
      className={className}
    />
  )
}

const grandCentralMediaClassName =
  "max-h-[min(48vh,26rem)] w-auto max-w-full object-contain md:max-h-[min(72vh,42rem)]"

function ProjectItem({
  artwork,
  onOpen,
  className = "block w-full outline-none focus-visible:ring-2 focus-visible:ring-black/30",
  mediaClassName,
}: {
  artwork: Artwork
  onOpen?: (artwork: Artwork) => void
  className?: string
  mediaClassName?: string
}) {
  if (artwork.kind === "video" || !onOpen) {
    return (
      <div>
        <ProjectMedia artwork={artwork} className={mediaClassName} />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(artwork)}
      aria-label={`View ${artwork.title}`}
      className={className}
    >
      <ProjectMedia artwork={artwork} className={mediaClassName} />
    </button>
  )
}

export function ProjectsSplit({
  series,
  onOpen,
}: {
  series: ProjectSeries
  onOpen?: (artwork: Artwork) => void
}) {
  const imagesRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const filtered = artworks.filter(
      (artwork) =>
        artwork.series === series &&
        !(series === "Re:Collection" && artwork.id === "recollection-book"),
    )
    if (series !== "The Little Green Monster") return filtered
    const flip = filtered.find((artwork) => artwork.id === "little-green-monster-flip")
    const rest = filtered.filter((artwork) => artwork.id !== "little-green-monster-flip")
    return flip ? [flip, ...rest] : rest
  }, [series])

  useEffect(() => {
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  useEffect(() => {
    imagesRef.current?.scrollTo({ top: 0 })
  }, [series])

  const isGrandCentral = series === "Grand Central (Infe)Station"

  return (
    <section
      ref={imagesRef}
      className="projects-pane h-dvh max-h-dvh w-full overflow-y-auto overscroll-contain"
    >
      <div
        className={
          isGrandCentral
            ? "mx-auto w-full px-5 pt-12 md:px-10 md:pl-[min(13rem,24vw)] md:pr-6 md:pt-8"
            : "mx-auto w-full max-w-4xl px-5 pt-12 md:px-10 md:pl-[min(13rem,24vw)] md:pt-8"
        }
      >
        {series === "Re:Collection" ? <RecollectionIntro /> : null}
        {series === "The Little Green Monster" ? (
          <ProjectSeriesHeader copy={littleGreenMonsterIntro} />
        ) : null}
        {series === "Feeding Frenzy" ? (
          <ProjectSeriesHeader
            copy={feedingFrenzyIntro}
            leftColumnMatch={recollectionIntro.title}
          />
        ) : null}
        {series === "Grand Central (Infe)Station" ? (
          <ProjectSeriesHeader
            copy={grandCentralIntro}
            leftColumnMatch={recollectionIntro.title}
          />
        ) : null}
        <div
          className={`${
            series === "The Little Green Monster"
              ? "mx-auto grid w-[85%] grid-cols-2 items-start gap-2 pb-6 md:gap-3 md:pb-8"
              : series === "Feeding Frenzy"
                ? "mx-auto flex w-[68%] flex-col gap-4 pb-6 md:gap-6 md:pb-8"
                : series === "Grand Central (Infe)Station"
                  ? "mx-auto flex w-full flex-col items-center gap-6 pb-6 md:gap-8 md:pb-8"
                : series === "Re:Collection"
                  ? "mx-auto flex w-[85%] flex-col gap-4 pb-6 md:gap-14 md:pb-8"
                  : "flex flex-col gap-10 pb-6 pt-6 md:gap-14 md:pb-8 md:pt-8"
          }`}
        >
          {items.map((artwork) => (
            <div
              key={artwork.id}
              className={
                series === "The Little Green Monster" &&
                LITTLE_GREEN_FULL_ROW_IDS.has(artwork.id)
                  ? "col-span-2"
                  : isGrandCentral
                    ? "flex w-full justify-center"
                    : undefined
              }
            >
              {series === "Re:Collection" ? (
                <div className="md:relative">
                  <p className="mb-1 text-right font-hand text-[11px] font-normal leading-none text-black [font-synthesis:none] [font-variation-settings:normal] md:text-xs">
                    {artwork.title}
                  </p>
                  <ProjectItem artwork={artwork} onOpen={onOpen} />
                  {artwork.quoteSrc ? (
                    <div
                      className={
                        artwork.id === "recollection-4"
                          ? "mt-1 h-[220px] w-full md:absolute md:bottom-0 md:right-full md:mt-0 md:mr-3 md:h-auto md:w-[42%] md:max-w-[16.5rem]"
                          : artwork.id === "recollection-1"
                            ? "mt-1 h-[148px] w-full md:absolute md:bottom-0 md:right-full md:mt-0 md:mr-3 md:h-auto md:w-[42%] md:max-w-[16.5rem]"
                            : "mt-1 h-[148px] w-full md:absolute md:bottom-0 md:right-full md:mt-0 md:mr-3 md:h-auto md:w-[46%] md:max-w-[18rem]"
                      }
                    >
                      <Image
                        src={artwork.quoteSrc}
                        alt=""
                        width={800}
                        height={800}
                        draggable={false}
                        className="h-full w-auto max-w-full object-contain object-left md:h-auto md:w-full"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <ProjectItem
                    artwork={artwork}
                    onOpen={onOpen}
                    className={
                      isGrandCentral
                        ? "block outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                        : undefined
                    }
                    mediaClassName={isGrandCentral ? grandCentralMediaClassName : undefined}
                  />
                  {series === "Feeding Frenzy" ? (
                    <p className="mt-1.5 text-right font-hand text-[26px] font-normal leading-none text-black [font-synthesis:none] [font-variation-settings:normal]">
                      {artwork.title}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

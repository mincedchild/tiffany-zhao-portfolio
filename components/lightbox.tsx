"use client"

import { useEffect } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { Artwork } from "@/lib/artworks"

export function Lightbox({
  artwork,
  items = [],
  onClose,
  onChange,
  hideSketchbookTitle = false,
}: {
  artwork: Artwork | null
  items?: Artwork[]
  onClose: () => void
  onChange?: (artwork: Artwork) => void
  hideSketchbookTitle?: boolean
}) {
  const index = artwork ? items.findIndex((item) => item.id === artwork.id) : -1
  const canNavigate = Boolean(onChange) && items.length > 1 && index >= 0

  useEffect(() => {
    if (!artwork) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (!canNavigate || !onChange) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onChange(items[(index - 1 + items.length) % items.length])
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        onChange(items[(index + 1) % items.length])
      }
    }
    document.addEventListener("keydown", onKey)
    const prevBody = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevBody
    }
  }, [artwork, canNavigate, index, items, onChange, onClose])

  if (!artwork) return null

  const caption = artwork.series ?? artwork.category
  const hideTitle =
    hideSketchbookTitle &&
    (artwork.category === "sketchbook" || artwork.series === "The Little Green Monster")

  function go(delta: number) {
    if (!onChange || !canNavigate) return
    onChange(items[(index + delta + items.length) % items.length])
  }

  const mediaClass =
    "h-auto w-auto max-h-[95%] max-w-[95%] object-contain"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col bg-foreground/40 px-3 pb-6 pt-[1.8rem] backdrop-blur-sm md:px-8 md:pb-8 md:pt-[2.1rem]"
      data-state="open"
      style={{ animation: "fadeIn 0.22s ease-out" }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-110 md:h-12 md:w-12"
      >
        <X className="h-4 w-4 md:h-6 md:w-6" />
      </button>

      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-[1] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-110 md:left-6 md:h-12 md:w-12"
          >
            <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-[1] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-110 md:right-6 md:h-12 md:w-12"
          >
            <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
          </button>
        </>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex min-h-0 w-full flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {artwork.kind === "video" ? (
            <video
              src={artwork.src}
              controls
              playsInline
              className={mediaClass}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.src || "/placeholder.svg"}
              alt={artwork.title}
              className={mediaClass}
            />
          )}
        </div>
        <figcaption className="flex min-h-[2.75rem] shrink-0 flex-col justify-start pt-1.5 text-center md:min-h-[3.75rem]">
          {hideTitle ? null : (
            <span className="font-hand text-xl text-card md:text-3xl">{artwork.title}</span>
          )}
          <span
            className={`block text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-card/70 md:text-xs md:tracking-[0.22em] ${
              hideTitle ? "" : "mt-1"
            }`}
          >
            {caption}
          </span>
        </figcaption>
      </figure>
    </div>
  )
}

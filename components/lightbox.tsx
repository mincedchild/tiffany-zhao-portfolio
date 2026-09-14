"use client"

import { useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { Artwork } from "@/lib/artworks"

function isGif(src: string) {
  return src.toLowerCase().endsWith(".gif")
}

export function Lightbox({
  artwork,
  items = [],
  onClose,
  onChange,
}: {
  artwork: Artwork | null
  items?: Artwork[]
  onClose: () => void
  onChange?: (artwork: Artwork) => void
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

  function go(delta: number) {
    if (!onChange || !canNavigate) return
    onChange(items[(index + delta + items.length) % items.length])
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-foreground/70 p-6 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in"
      data-state="open"
      style={{ animation: "fadeIn 0.22s ease-out" }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-[1] flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-110"
      >
        <X className="h-5 w-5" />
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
            className="absolute left-3 top-1/2 z-[1] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-110 md:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-[1] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-110 md:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-4"
      >
        <div className="relative overflow-hidden rounded-md bg-card p-2 shadow-2xl">
          {artwork.kind === "video" ? (
            <video
              src={artwork.src}
              controls
              playsInline
              className="max-h-[68vh] w-auto max-w-[86vw] rounded-sm"
            />
          ) : isGif(artwork.src) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.src}
              alt={artwork.title}
              className="max-h-[68vh] w-auto rounded-sm object-contain"
            />
          ) : (
            <Image
              src={artwork.src || "/placeholder.svg"}
              alt={artwork.title}
              width={900}
              height={900}
              className="max-h-[68vh] w-auto rounded-sm object-contain"
            />
          )}
        </div>
        <figcaption className="text-center">
          <span className="font-hand text-3xl text-card">{artwork.title}</span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.22em] text-card/70">
            {caption}
          </span>
        </figcaption>
      </figure>
    </div>
  )
}

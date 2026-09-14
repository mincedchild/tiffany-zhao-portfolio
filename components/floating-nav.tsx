"use client"

import { useEffect, useRef, useState } from "react"
import { projectSeriesOrder } from "@/lib/artworks"
import type { ProjectSeries, View } from "@/lib/portfolio-view"

export type { ProjectSeries, View }

const buttons: { label: string; view: View }[] = [
  { label: "Projects", view: "project" },
  { label: "Sketchbook", view: "sketchbook" },
  { label: "Tattoo", view: "tattoo" },
  { label: "About", view: "about" },
]

function NavList({
  view,
  setView,
  projectSeries,
  setProjectSeries,
  onNavigate,
  align = "start",
  pills = false,
  stair = false,
}: {
  view: View
  setView: (v: View) => void
  projectSeries: ProjectSeries
  setProjectSeries: (series: ProjectSeries) => void
  onNavigate?: () => void
  align?: "start" | "end"
  pills?: boolean
  stair?: boolean
}) {
  const projectsOpen = view === "project"
  const end = align === "end"
  const itemAlign = end ? "items-end" : "items-start"
  const textAlign = end ? "text-right" : "text-left"
  const pillClass = pills
    ? "rounded-lg bg-white/20 px-2 py-0.5 backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)]"
    : ""

  return (
    <nav aria-label="Primary" className="pointer-events-auto">
      <ul className={`flex flex-col ${itemAlign} ${pills ? "gap-1" : ""}`}>
        {buttons.map((b, i) => {
          const active = view === b.view
          const isProjects = b.view === "project"
          return (
            <li
              key={b.label}
              className={end ? "flex flex-col items-end" : undefined}
              data-stair={stair && i !== 0 && i !== buttons.length - 1 ? i : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  setView(b.view)
                  if (!isProjects) onNavigate?.()
                }}
                aria-pressed={active}
                aria-expanded={isProjects ? projectsOpen : undefined}
                className={`outline-none transition-colors ${textAlign} ${end ? "self-end" : ""} ${pills ? "text-base leading-snug" : ""} ${pillClass} ${
                  active ? "text-primary" : "text-black hover:text-black/70"
                }`}
              >
                {b.label}
              </button>
              {isProjects ? (
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    projectsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <ul
                      className={`mt-0.5 mb-0.5 flex flex-col ${itemAlign} ${
                        pills
                          ? "gap-0 rounded-lg bg-white/20 px-2 py-0.5 backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)]"
                          : "gap-0"
                      }`}
                    >
                  {projectSeriesOrder.map((name) => {
                    const selected = name === projectSeries
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectSeries(name)
                            onNavigate?.()
                          }}
                          aria-current={selected ? "true" : undefined}
                          className={`whitespace-nowrap outline-none transition-colors ${
                            pills
                              ? "font-hand p-0 text-[16px] leading-[0.55]"
                              : "font-valley text-[16.5px] leading-none [font-weight:320] [font-variation-settings:'wght'_320]"
                          } ${textAlign} ${
                            selected
                              ? "text-primary"
                              : "text-black/75 hover:text-black"
                          }`}
                        >
                          {name}
                        </button>
                      </li>
                    )
                  })}
                    </ul>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function BrandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto outline-none -m-4 p-4"
      aria-label="Home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/logo.png" alt="" className="block h-[2.3em] w-auto" />
    </button>
  )
}

export function FloatingNav({
  view,
  setView,
  projectSeries,
  setProjectSeries,
}: {
  view: View
  setView: (v: View) => void
  projectSeries: ProjectSeries
  setProjectSeries: (series: ProjectSeries) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown)
    }, 0)

    document.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  function goHome() {
    setView(null)
    setMenuOpen(false)
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[90] md:hidden">
        <div
          ref={menuRef}
          className="pointer-events-auto flex items-center justify-between px-3 py-3 font-hand text-2xl leading-[1.15] text-black"
        >
          <BrandButton onClick={goHome} />
          <div className="relative">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="flex h-8 w-8 items-center justify-center outline-none"
            >
              <span className="menu-morph" data-open={menuOpen ? "true" : "false"} aria-hidden>
                <span />
                <span />
              </span>
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-1 w-max">
                <NavList
                  view={view}
                  setView={setView}
                  projectSeries={projectSeries}
                  setProjectSeries={setProjectSeries}
                  onNavigate={() => setMenuOpen(false)}
                  align="end"
                  pills
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {view !== "project" ? (
        <div
          aria-hidden
          className="invisible flex items-center justify-between px-3 py-3 font-hand text-2xl leading-[1.15] md:hidden"
        >
          <BrandButton onClick={goHome} />
          <span className="h-8 w-8 shrink-0" />
        </div>
      ) : null}

      <header className="pointer-events-none fixed left-0 top-0 z-[90] hidden p-3 md:block md:p-4">
        <div className="pointer-events-none flex flex-col items-start font-hand text-2xl leading-[1.15] text-black">
          <BrandButton onClick={goHome} />
          <div data-home-stair className="pointer-events-none mt-3 min-w-0">
            <NavList
              view={view}
              setView={setView}
              projectSeries={projectSeries}
              setProjectSeries={setProjectSeries}
              stair
            />
          </div>
        </div>
      </header>
    </>
  )
}

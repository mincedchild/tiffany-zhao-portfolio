"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FloatingNav, type ProjectSeries, type View } from "@/components/floating-nav"
import { ScrapbookGallery } from "@/components/scrapbook-gallery"
import { hrefFor, parsePortfolioLocation } from "@/lib/portfolio-view"

export function ScrapbookApp({
  initialView,
  initialSeries,
}: {
  initialView: View
  initialSeries: ProjectSeries
}) {
  const [view, setViewState] = useState<View>(initialView)
  const [projectSeries, setSeriesState] = useState<ProjectSeries>(initialSeries)
  const lastSeries = useRef(initialSeries)
  lastSeries.current = projectSeries

  const setView = useCallback((next: View) => {
    const href = hrefFor(next, lastSeries.current)
    const current = `${window.location.pathname}${window.location.search}`
    setViewState(next)
    if (href === current || (href === "/" && (current === "/" || current === ""))) return
    window.history.pushState(null, "", href)
  }, [])

  const setProjectSeries = useCallback((series: ProjectSeries) => {
    lastSeries.current = series
    setSeriesState(series)
    setViewState("project")
    const href = hrefFor("project", series)
    const current = `${window.location.pathname}${window.location.search}`
    if (href === current) return
    window.history.pushState(null, "", href)
  }, [])

  useEffect(() => {
    function onPop() {
      const parsed = parsePortfolioLocation(window.location.search)
      lastSeries.current = parsed.projectSeries
      setViewState(parsed.view)
      setSeriesState(parsed.projectSeries)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  return (
    <main className="paper-grain relative min-h-dvh w-full overflow-x-hidden">
      <FloatingNav
        view={view}
        setView={setView}
        projectSeries={projectSeries}
        setProjectSeries={setProjectSeries}
      />
      <ScrapbookGallery
        key={view === "sketchbook" ? "sketchbook" : "rest"}
        view={view}
        projectSeries={projectSeries}
      />
    </main>
  )
}

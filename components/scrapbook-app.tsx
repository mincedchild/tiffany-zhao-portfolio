"use client"

import { useState } from "react"
import { projectSeriesOrder } from "@/lib/artworks"
import { FloatingNav, type ProjectSeries, type View } from "@/components/floating-nav"
import { ScrapbookGallery } from "@/components/scrapbook-gallery"

export function ScrapbookApp() {
  const [view, setView] = useState<View>(null)
  const [projectSeries, setProjectSeries] = useState<ProjectSeries>(projectSeriesOrder[0])

  return (
    <main className="paper-grain relative min-h-dvh w-full overflow-x-hidden">
      <FloatingNav
        view={view}
        setView={setView}
        projectSeries={projectSeries}
        setProjectSeries={setProjectSeries}
      />
      <ScrapbookGallery view={view} projectSeries={projectSeries} />
    </main>
  )
}

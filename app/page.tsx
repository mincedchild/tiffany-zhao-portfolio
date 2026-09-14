import { ScrapbookApp } from "@/components/scrapbook-app"
import { firstParam, parseSeries, parseView } from "@/lib/portfolio-view"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; series?: string | string[] }>
}) {
  const params = await searchParams
  return (
    <ScrapbookApp
      initialView={parseView(firstParam(params.view))}
      initialSeries={parseSeries(firstParam(params.series))}
    />
  )
}

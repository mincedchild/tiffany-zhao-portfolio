import { spawn } from "node:child_process"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

const chrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const port = 9334
const userData = await mkdtemp(path.join(tmpdir(), "tattoo-verify-"))

const child = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    "--window-size=1440,900",
    "--no-first-run",
    "--no-default-browser-check",
  ],
  { stdio: "ignore" },
)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return await res.json()
    } catch {}
    await sleep(150)
  }
  throw new Error(`timeout waiting for ${url}`)
}

const version = await waitJson(`http://127.0.0.1:${port}/json/version`)
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true })
  ws.addEventListener("error", reject, { once: true })
})

let id = 0
const pending = new Map()
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
})

function send(method, params = {}) {
  const current = ++id
  return new Promise((resolve, reject) => {
    pending.set(current, { resolve, reject })
    ws.send(JSON.stringify({ id: current, method, params }))
  })
}

await send("Page.enable")
await send("Runtime.enable")
await send("Page.navigate", { url: "http://localhost:3000/" })
await sleep(2500)

async function evalJson(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "eval failed")
  }
  return result.result.value
}

async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png" })
  const file = path.join(
    "/Users/tiffanyzhao/Desktop/tiffany-zhao-portfolio/.tmp",
    name,
  )
  await writeFile(file, Buffer.from(data, "base64"))
  return file
}

const homeBefore = await evalJson(`({
  title: document.title,
  homeCards: document.querySelectorAll('.home-grid button').length,
  tattooPressed: [...document.querySelectorAll('button')].find(b => b.textContent === 'Tattoo')?.getAttribute('aria-pressed'),
})`)

await evalJson(`([...document.querySelectorAll('button')].find(b => b.textContent === 'Tattoo') || { click(){} }).click(); true`)
await sleep(1200)
await shot("tattoo-rows.png")

const tattoo = await evalJson(`(() => {
  const flash = document.querySelector('[aria-label="Flash"]')
  const work = document.querySelector('[aria-label="Tattoo work"]')
  function info(el) {
    if (!el) return null
    const cs = getComputedStyle(el)
    const buttons = [...el.querySelectorAll(':scope > button')]
    const rects = buttons.map(b => {
      const r = b.getBoundingClientRect()
      const img = b.querySelector('img')
      return {
        label: b.getAttribute('aria-label'),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
        imgW: img ? img.clientWidth : 0,
        imgH: img ? img.clientHeight : 0,
      }
    })
    const tops = new Set(rects.map(r => r.top))
    return {
      display: cs.display,
      overflowX: cs.overflowX,
      flexWrap: cs.flexWrap,
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      count: buttons.length,
      uniqueTops: [...tops],
      oneRow: tops.size === 1,
      rects,
    }
  }
  const tattooNav = [...document.querySelectorAll('button')].find(b => b.textContent === 'Tattoo')
  return {
    tattooPressed: tattooNav?.getAttribute('aria-pressed'),
    homeGrid: !!document.querySelector('.home-grid'),
    flash: info(flash),
    work: info(work),
  }
})()`)

await evalJson(`(document.querySelector('[aria-label="Flash"] button') || { click(){} }).click(); true`)
await sleep(600)

const lightbox = await evalJson(`(() => {
  const dialog = document.querySelector('[role="dialog"]')
  const prev = document.querySelector('[aria-label="Previous image"]')
  const next = document.querySelector('[aria-label="Next image"]')
  return {
    open: !!dialog,
    label: dialog?.getAttribute('aria-label') || null,
    hasPrev: !!prev,
    hasNext: !!next,
  }
})()`)

await evalJson(`(document.querySelector('[aria-label="Next image"]') || { click(){} }).click(); true`)
await sleep(400)
const lightbox2 = await evalJson(`({
  label: document.querySelector('[role="dialog"]')?.getAttribute('aria-label') || null,
})`)

await evalJson(`(document.querySelector('[aria-label="Close"]') || { click(){} }).click(); true`)
await sleep(400)

await evalJson(`([...document.querySelectorAll('button')].find(b => b.textContent === 'Home') || { click(){} }).click(); true`)
await sleep(800)
const homeAfter = await evalJson(`({
  homeCards: document.querySelectorAll('.home-grid button').length,
  tattooRows: !!document.querySelector('[aria-label="Flash"]'),
})`)

await evalJson(`([...document.querySelectorAll('button')].find(b => b.textContent === 'Sketchbook') || { click(){} }).click(); true`)
await sleep(800)
const sketch = await evalJson(`({
  sketchPressed: [...document.querySelectorAll('button')].find(b => b.textContent === 'Sketchbook')?.getAttribute('aria-pressed'),
  sketchRegion: !!document.querySelector('[aria-label="Sketchbook"]'),
  flashVisible: !!document.querySelector('[aria-label="Flash"]'),
})`)

const report = { homeBefore, tattoo, lightbox, lightbox2, homeAfter, sketch }
console.log(JSON.stringify(report, null, 2))

ws.close()
child.kill("SIGTERM")
process.exit(0)

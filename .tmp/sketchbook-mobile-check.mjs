import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const PORT = 9333
const userData = `/tmp/chrome-sketchbook-${Date.now()}`

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userData}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=390,844",
  ],
  { stdio: "ignore" }
)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForDebugger() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) return await res.json()
    } catch {}
    await sleep(150)
  }
  throw new Error("Chrome debugger did not start")
}

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
}

async function main() {
  const version = await waitForDebugger()
  const ws = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve)
    ws.addEventListener("error", reject)
  })
  const cdp = new Cdp(ws)
  await cdp.send("Runtime.enable")
  await cdp.send("Page.enable")
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await cdp.send("Page.navigate", { url: "http://localhost:3000/" })
  await cdp.send("Page.loadEventFired")
  await sleep(800)

  async function evalExpr(expression) {
    const r = await cdp.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.text || "eval error")
    }
    return r.result.value
  }

  await evalExpr(`
    (async () => {
      const menu = document.querySelector('button[aria-label="Open menu"]');
      if (menu) menu.click();
      await new Promise(r => setTimeout(r, 200));
      const sketch = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Sketchbook');
      if (!sketch) throw new Error('Sketchbook button missing');
      sketch.click();
      await new Promise(r => setTimeout(r, 500));
    })()
  `)

  const layout1 = await evalExpr(`
    (() => {
      const region = document.querySelector('[aria-label="Sketchbook"]');
      const thumbs = [...region.querySelectorAll('button')];
      const imgs = [...document.querySelectorAll('img')].map(img => ({
        alt: img.alt,
        src: img.currentSrc || img.src,
        top: Math.round(img.getBoundingClientRect().top),
        height: Math.round(img.getBoundingClientRect().height),
        width: Math.round(img.getBoundingClientRect().width),
      }));
      const featured = imgs.find(i => i.height > 120);
      return {
        thumbCount: thumbs.length,
        firstThumbPressed: thumbs[0]?.getAttribute('aria-pressed'),
        featured,
        firstThumbTop: thumbs[0] ? Math.round(thumbs[0].getBoundingClientRect().top) : null,
        featuredAboveGallery: featured ? featured.top < (thumbs[0]?.getBoundingClientRect().top ?? 9999) : false,
      };
    })()
  `)

  const shot1 = await cdp.send("Page.captureScreenshot", { format: "png" })
  writeFileSync(".tmp/sketchbook-mobile-1.png", Buffer.from(shot1.data, "base64"))

  const beforeWheel = await evalExpr(`document.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label')`)
  await evalExpr(`
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }));
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true }));
  `)
  await sleep(200)
  const afterWheel = await evalExpr(`document.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label')`)

  await evalExpr(`
    const region = document.querySelector('[aria-label="Sketchbook"]');
    const thumbs = [...region.querySelectorAll('button')];
    thumbs[3]?.click();
  `)
  await sleep(400)
  const afterClick = await evalExpr(`
    (() => {
      const pressed = document.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label');
      const imgs = [...document.querySelectorAll('img')].map(img => ({
        alt: img.alt,
        top: Math.round(img.getBoundingClientRect().top),
        height: Math.round(img.getBoundingClientRect().height),
        width: Math.round(img.getBoundingClientRect().width),
      }));
      const featured = imgs.find(i => i.height > 120);
      return { pressed, featured };
    })()
  `)
  const shot2 = await cdp.send("Page.captureScreenshot", { format: "png" })
  writeFileSync(".tmp/sketchbook-mobile-2.png", Buffer.from(shot2.data, "base64"))

  console.log(JSON.stringify({ layout1, beforeWheel, afterWheel, afterClick, wheelUnchanged: beforeWheel === afterWheel }, null, 2))
  ws.close()
  chrome.kill("SIGTERM")
}

main().catch((err) => {
  console.error(err)
  chrome.kill("SIGTERM")
  process.exit(1)
})

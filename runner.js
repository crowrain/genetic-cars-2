const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const targetUrl = process.env.BOXCAR_URL || "http://192.168.1.87:8087/?runner=1";
const restartDelayMs = Number(process.env.BOXCAR_RUNNER_RESTART_DELAY_MS || 10000);
const heartbeatMs = Number(process.env.BOXCAR_RUNNER_HEARTBEAT_MS || 60000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  }

  const browserRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || "/ms-playwright";
  try {
    const candidates = fs.readdirSync(browserRoot)
      .filter((name) => name.startsWith("chromium-"))
      .sort()
      .reverse()
      .map((name) => path.join(browserRoot, name, "chrome-linux64", "chrome"));

    return candidates.find((candidate) => fs.existsSync(candidate));
  } catch (err) {
    return undefined;
  }
}

async function runOnce() {
  const executablePath = findChromiumExecutable();
  if (executablePath) {
    console.log(`Using Chromium executable: ${executablePath}`);
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });

    page.on("console", (msg) => {
      console.log(`[page:${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error(`[page:error] ${err.stack || err.message}`);
    });

    console.log(`Opening ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      () => window.__boxcarRunnerReady === true,
      undefined,
      { timeout: 60000 },
    ).catch(() => {
      console.warn("Runner-ready flag was not observed within 60s; continuing to monitor page.");
    });

    while (!page.isClosed()) {
      await page.waitForTimeout(heartbeatMs);
      const status = await page.evaluate(() => {
        const text = (id) => document.getElementById(id)?.textContent || "";
        return {
          generation: text("generation").trim(),
          population: text("population").trim(),
          distance: text("distancemeter").trim(),
          status: text("server-status").trim(),
        };
      });
      console.log(`[runner] ${JSON.stringify(status)}`);
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  for (;;) {
    try {
      await runOnce();
    } catch (err) {
      console.error(`[runner] ${err.stack || err.message}`);
      await sleep(restartDelayMs);
    }
  }
}

main();

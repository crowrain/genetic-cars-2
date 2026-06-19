const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.BOXCAR_API_PORT || process.env.PORT || 8089);
const dataDir = process.env.BOXCAR_DATA_DIR || path.join(__dirname, "data");
const stateFile = process.env.BOXCAR_STATE_FILE || path.join(dataDir, "state.json");
const maxBodyBytes = Number(process.env.BOXCAR_MAX_BODY_BYTES || 25 * 1024 * 1024);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function sendJson(res, status, payload) {
  setCors(res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendEmpty(res, status) {
  setCors(res);
  res.writeHead(status, { "Cache-Control": "no-store" });
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("Request body is too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function validateState(state) {
  if (!state || typeof state !== "object") {
    throw new Error("State must be an object");
  }
  if (!Array.isArray(state.savedGeneration)) {
    throw new Error("State savedGeneration must be an array");
  }
  if (!Number.isFinite(Number(state.generation))) {
    throw new Error("State generation must be numeric");
  }
}

async function readState() {
  const raw = await fs.readFile(stateFile, "utf8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await fs.mkdir(dataDir, { recursive: true });
  const tmp = path.join(dataDir, `state-${process.pid}-${Date.now()}.tmp`);
  await fs.writeFile(tmp, `${JSON.stringify(state)}\n`, "utf8");
  await fs.rename(tmp, stateFile);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      sendEmpty(res, 204);
      return;
    }

    if (url.pathname === "/health") {
      let generation = null;
      try {
        generation = Number((await readState()).generation);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
      sendJson(res, 200, { ok: true, generation, stateFile });
      return;
    }

    if (url.pathname !== "/api/state") {
      sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }

    if (req.method === "GET") {
      try {
        sendJson(res, 200, await readState());
      } catch (err) {
        if (err.code === "ENOENT") {
          sendJson(res, 404, { ok: false, error: "No saved state yet" });
          return;
        }
        throw err;
      }
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      const raw = await readBody(req);
      const state = JSON.parse(raw);
      validateState(state);
      state.savedAt = new Date().toISOString();
      await writeState(state);
      sendJson(res, 200, {
        ok: true,
        generation: Number(state.generation),
        savedAt: state.savedAt,
      });
      return;
    }

    sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
});

server.listen(port, host, () => {
  console.log(`BoxCar state API listening on http://${host}:${port}`);
  console.log(`State file: ${stateFile}`);
});

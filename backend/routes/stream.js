const express = require("express");
const axios = require("axios");
const router = express.Router();

const HEADERS = (server) => ({
  "User-Agent": "IPTV Smarters Pro",
  "Referer": server,
  "Origin": server,
});

// GET /api/stream/live/:id — tries m3u8 first, auto-falls back to ts
router.get("/live/:id", async (req, res) => {
  const { id } = req.params;
  const { server, username, password } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  const formats = [
    { ext: "m3u8", ct: "application/vnd.apple.mpegurl" },
    { ext: "ts",   ct: "video/mp2t" },
  ];

  for (const { ext, ct } of formats) {
    const url = `${server}/live/${username}/${password}/${id}.${ext}`;
    try {
      const response = await axios.get(url, {
        responseType: "stream",
        headers: HEADERS(server),
        timeout: 12000,
        validateStatus: (s) => s < 400,
      });
      res.setHeader("Content-Type", ct);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Stream-Format", ext);
      if (response.headers["content-length"])
        res.setHeader("Content-Length", response.headers["content-length"]);
      response.data.pipe(res);
      return;
    } catch (_) { continue; }
  }

  res.status(502).json({ error: "Stream unavailable for all formats" });
});

// GET /api/stream/ts/:id — explicit TS proxy
router.get("/ts/:id", async (req, res) => {
  const { id } = req.params;
  const { server, username, password } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  const url = `${server}/live/${username}/${password}/${id}.ts`;
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      headers: HEADERS(server),
      timeout: 12000,
    });
    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Accept-Ranges", "bytes");
    response.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: "TS stream unavailable", detail: err.message });
  }
});

// GET /api/stream/movie/:id
router.get("/movie/:id", async (req, res) => {
  const { id } = req.params;
  const { server, username, password, ext = "mp4" } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  const url = `${server}/movie/${username}/${password}/${id}.${ext}`;
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      headers: HEADERS(server),
      timeout: 15000,
    });
    res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.headers.range) res.setHeader("Accept-Ranges", "bytes");
    response.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: "Stream unavailable", detail: err.message });
  }
});

module.exports = router;

const express = require("express");
const axios = require("axios");
const router = express.Router();

// GET /api/stream/live/:id?server=&username=&password=
router.get("/live/:id", async (req, res) => {
  const { id } = req.params;
  const { server, username, password } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  const streamUrl = `${server}/live/${username}/${password}/${id}.m3u8`;

  try {
    const response = await axios.get(streamUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "IPTV Smarters Pro",
        "Referer": server,
      },
      timeout: 15000,
    });

    res.setHeader("Content-Type", response.headers["content-type"] || "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    response.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: "Stream unavailable", detail: err.message });
  }
});

// GET /api/stream/movie/:id?server=&username=&password=&ext=
router.get("/movie/:id", async (req, res) => {
  const { id } = req.params;
  const { server, username, password, ext = "mp4" } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  const streamUrl = `${server}/movie/${username}/${password}/${id}.${ext}`;

  try {
    const response = await axios.get(streamUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "IPTV Smarters Pro",
        "Referer": server,
      },
      timeout: 15000,
    });

    res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Support range requests for seeking
    if (req.headers.range) {
      res.setHeader("Accept-Ranges", "bytes");
    }

    response.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: "Stream unavailable", detail: err.message });
  }
});

module.exports = router;

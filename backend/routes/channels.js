const express = require("express");
const axios = require("axios");
const router = express.Router();

// GET /api/channels/live?server=&username=&password=
router.get("/live", async (req, res) => {
  const { server, username, password, category_id } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  try {
    let url = `${server}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    if (category_id) url += `&category_id=${category_id}`;

    const { data } = await axios.get(url, {
      headers: { "User-Agent": "IPTV Smarters Pro" },
      timeout: 15000,
    });

    const channels = data.map((ch) => ({
      id: ch.stream_id,
      name: ch.name,
      logo: ch.stream_icon,
      category_id: ch.category_id,
      epg_id: ch.epg_channel_id,
    }));

    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch channels", detail: err.message });
  }
});

// GET /api/channels/categories?server=&username=&password=
router.get("/categories", async (req, res) => {
  const { server, username, password } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  try {
    const url = `${server}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "IPTV Smarters Pro" },
      timeout: 10000,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories", detail: err.message });
  }
});

// GET /api/channels/movies?server=&username=&password=
router.get("/movies", async (req, res) => {
  const { server, username, password, category_id } = req.query;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing params" });

  try {
    let url = `${server}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
    if (category_id) url += `&category_id=${category_id}`;

    const { data } = await axios.get(url, {
      headers: { "User-Agent": "IPTV Smarters Pro" },
      timeout: 15000,
    });

    const movies = data.map((m) => ({
      id: m.stream_id,
      name: m.name,
      logo: m.stream_icon,
      category_id: m.category_id,
      rating: m.rating,
      container_extension: m.container_extension,
    }));

    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch movies", detail: err.message });
  }
});

module.exports = router;

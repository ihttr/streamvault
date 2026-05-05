const express = require("express");
const axios = require("axios");
const router = express.Router();

// POST /api/auth/login
// Body: { server, username, password }
router.post("/login", async (req, res) => {
  const { server, username, password } = req.body;
  if (!server || !username || !password)
    return res.status(400).json({ error: "Missing credentials" });

  try {
    const url = `${server}/player_api.php?username=${username}&password=${password}`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "IPTV Smarters Pro" },
      timeout: 10000,
    });

    if (!data.user_info || data.user_info.auth === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    // Never expose raw credentials — return a session token pattern
    res.json({
      status: "ok",
      exp_date: data.user_info.exp_date,
      max_connections: data.user_info.max_connections,
      active_cons: data.user_info.active_cons,
    });
  } catch (err) {
    res.status(500).json({ error: "Cannot reach server", detail: err.message });
  }
});

module.exports = router;

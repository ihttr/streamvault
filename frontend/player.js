// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  server: "", username: "", password: "",
  tab: "live",
  channels: [], filtered: [],
  currentCat: "all",
  hls: null,
};

const $ = id => document.getElementById(id);
const API = path => `/api${path}`;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function showError(msg) {
  const bar = $("errorBar");
  bar.textContent = msg;
  bar.style.display = "block";
  setTimeout(() => bar.style.display = "none", 6000);
}

function setLoading(on) {
  $("loadingOverlay").style.display = on ? "flex" : "none";
  if (!on && !$("videoPlayer").src) $("playerOverlay").style.display = "flex";
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function doLogin() {
  const server = $("loginServer").value.trim().replace(/\/$/, "");
  const username = $("loginUser").value.trim();
  const password = $("loginPass").value.trim();
  $("loginError").textContent = "";
  $("loginBtnText").textContent = "جاري الدخول...";

  try {
    const res = await fetch(API("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server, username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطأ في الاتصال");

    state.server = server;
    state.username = username;
    state.password = password;

    const exp = data.exp_date ? new Date(data.exp_date * 1000).toLocaleDateString("ar") : "—";
    $("accountInfo").innerHTML = `انتهاء: ${exp}<br>اتصالات: ${data.active_cons}/${data.max_connections}`;

    showScreen("appScreen");
    loadTab("live");
  } catch (e) {
    $("loginError").textContent = e.message;
  } finally {
    $("loginBtnText").textContent = "دخول";
  }
}

["loginServer", "loginUser", "loginPass"].forEach(id => {
  $(id)?.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
});

// ─── Tab Switching ────────────────────────────────────────────────────────────
function switchTab(tab, btn) {
  state.tab = tab;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  $("panelTitle").textContent = tab === "live" ? "القنوات" : "الأفلام";
  state.currentCat = "all";
  loadTab(tab);
}

async function loadTab(tab) {
  renderChannelsSkeleton();
  $("categoryList").innerHTML = "";

  const endpoint = tab === "live" ? "live" : "movies";
  const params = `?server=${encodeURIComponent(state.server)}&username=${encodeURIComponent(state.username)}&password=${encodeURIComponent(state.password)}`;

  try {
    const [chRes, catRes] = await Promise.all([
      fetch(`/api/channels/${endpoint}${params}`),
      fetch(`/api/channels/categories${params}`),
    ]);
    state.channels = await chRes.json();
    const cats = await catRes.json();
    state.filtered = [...state.channels];
    renderCategories(cats);
    renderChannels(state.filtered);
  } catch (e) {
    showError("تعذّر تحميل البيانات");
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
function renderCategories(cats) {
  const list = $("categoryList");
  list.innerHTML = "";

  const allBtn = document.createElement("div");
  allBtn.className = "cat-item active";
  allBtn.innerHTML = `<span>الكل</span><span class="cat-count">${state.channels.length}</span>`;
  allBtn.onclick = () => selectCategory("all", allBtn);
  list.appendChild(allBtn);

  cats.forEach(cat => {
    const count = state.channels.filter(c => c.category_id == cat.category_id).length;
    if (!count) return;
    const el = document.createElement("div");
    el.className = "cat-item";
    el.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis">${cat.category_name}</span><span class="cat-count">${count}</span>`;
    el.onclick = () => selectCategory(cat.category_id, el);
    list.appendChild(el);
  });
}

function selectCategory(id, el) {
  document.querySelectorAll(".cat-item").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  state.currentCat = id;
  state.filtered = id === "all"
    ? [...state.channels]
    : state.channels.filter(c => c.category_id == id);
  renderChannels(state.filtered);
}

// ─── Channel List ─────────────────────────────────────────────────────────────
function renderChannelsSkeleton() {
  $("channelList").innerHTML = Array.from({ length: 12 }, () => `
    <div class="ch-item">
      <div class="skeleton" style="width:38px;height:38px;border-radius:8px;flex-shrink:0"></div>
      <div><div class="skeleton" style="width:130px;height:12px;margin-bottom:6px"></div>
      <div class="skeleton" style="width:60px;height:9px"></div></div>
    </div>`).join("");
}

function renderChannels(list) {
  const el = $("channelList");
  $("channelCount").textContent = list.length;
  if (!list.length) {
    el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px">لا توجد نتائج</div>`;
    return;
  }
  el.innerHTML = list.map(ch => {
    const initials = ch.name.slice(0, 2).toUpperCase();
    const logo = ch.logo
      ? `<img class="ch-logo" src="${ch.logo}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="ch-logo-placeholder" style="display:none">${initials}</div>`
      : `<div class="ch-logo-placeholder">${initials}</div>`;
    return `<div class="ch-item" data-id="${ch.id}" onclick="playChannel(${ch.id},'${escHtml(ch.name)}','${escHtml(ch.logo||'')}')">
      ${logo}
      <div class="ch-info">
        <div class="ch-name">${escHtml(ch.name)}</div>
        <div class="ch-id">#${ch.id}</div>
      </div>
    </div>`;
  }).join("");
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function filterChannels(q) {
  const base = state.currentCat === "all"
    ? state.channels
    : state.channels.filter(c => c.category_id == state.currentCat);
  state.filtered = q ? base.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : [...base];
  renderChannels(state.filtered);
}

// ─── Playback — supports HLS (m3u8) and TS fallback ──────────────────────────
function playChannel(id, name, logo) {
  document.querySelectorAll(".ch-item").forEach(el => el.classList.remove("active"));
  document.querySelector(`.ch-item[data-id="${id}"]`)?.classList.add("active");

  $("npName").textContent = name;
  $("npStatus").textContent = "جاري التحميل...";
  $("npLogo").style.backgroundImage = logo ? `url(${logo})` : "none";
  $("liveBadge").style.display = "none";
  $("playerOverlay").style.display = "none";
  setLoading(true);

  const params = `?server=${encodeURIComponent(state.server)}&username=${encodeURIComponent(state.username)}&password=${encodeURIComponent(state.password)}`;
  const isLive = state.tab === "live";
  const streamUrl = isLive
    ? `/api/stream/live/${id}${params}`
    : `/api/stream/movie/${id}${params}`;
  const tsUrl = `/api/stream/ts/${id}${params}`;

  const video = $("videoPlayer");
  if (state.hls) { state.hls.destroy(); state.hls = null; }

  function onSuccess() {
    setLoading(false);
    $("npStatus").textContent = "يعمل";
    if (isLive) $("liveBadge").style.display = "block";
  }

  function tryTS() {
    // Fallback: play .ts directly via native video element
    if (video.canPlayType("video/mp2t") || true) {
      video.src = tsUrl;
      video.load();
      video.play()
        .then(onSuccess)
        .catch(() => {
          setLoading(false);
          showError(`تعذّر تشغيل القناة: ${name}`);
          $("npStatus").textContent = "خطأ";
        });
    }
  }

  if (Hls.isSupported()) {
    state.hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
    });
    state.hls.loadSource(streamUrl);
    state.hls.attachMedia(video);

    state.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().then(onSuccess).catch(() => {});
    });

    state.hls.on(Hls.Events.ERROR, (e, d) => {
      if (d.fatal) {
        state.hls.destroy();
        state.hls = null;
        // Auto-fallback to TS
        tryTS();
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari native HLS
    video.src = streamUrl;
    video.play().then(onSuccess).catch(() => tryTS());
  } else {
    tryTS();
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function doLogout() {
  if (state.hls) state.hls.destroy();
  state.server = state.username = state.password = "";
  $("videoPlayer").src = "";
  $("loginServer").value = "";
  $("loginUser").value = "";
  $("loginPass").value = "";
  showScreen("loginScreen");
}

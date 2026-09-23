/* =========================================================
   Laid Off To 8 Figures — interactions
   ========================================================= */

/* ---- Episode data ------------------------------------------------------
   The sync script (scripts/sync-youtube.mjs) pre-renders the episode list
   into index.html and embeds the same data in <script id="episodes-data">,
   so crawlers see the titles and the page paints without a fetch. This file
   only reveals hidden rows on VIEW MORE and powers search. If the inline
   data is missing (first run before any sync), we fall back to fetching
   episodes.json and rendering client-side.
--------------------------------------------------------------------- */
const FALLBACK_EPISODES = [
  { num: 34, title: "The Layoff", duration: "1:53:06", latest: true },
  { num: 33, title: "Rock Bottom", duration: "2:17:21" },
  { num: 32, title: "First Dollar", duration: "2:23:22" },
  { num: 31, title: "Six Figures", duration: "1:58:51" },
  { num: 30, title: "Seven Figures", duration: "2:15:52" },
];

const INITIAL_VISIBLE = 6; // episodes shown before "VIEW MORE"

let episodes = FALLBACK_EPISODES;

/* ---- Helpers ---------------------------------------------------------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function readInlineEpisodes() {
  const el = document.getElementById("episodes-data");
  if (!el) return null;
  try {
    const data = JSON.parse(el.textContent);
    return Array.isArray(data) && data.length ? data : null;
  } catch {
    return null;
  }
}

async function fetchEpisodes() {
  try {
    const res = await fetch("episodes.json", { cache: "no-cache" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.episodes) && data.episodes.length ? data.episodes : null;
  } catch {
    return null; /* offline or file missing */
  }
}

/* ---- Client-side render (fallback only) ------------------------------ */
function renderEpisodes() {
  const list = document.getElementById("episode-list");
  if (!list) return;

  list.innerHTML = episodes.map((ep, i) => {
    const meta = ep.latest
      ? `<span class="ep-meta">${escapeHtml(ep.duration || "")}<span class="ep-latest">LATEST</span></span>`
      : `<span class="ep-meta">${escapeHtml(ep.duration || "")}</span>`;
    const href = ep.url || "#episodes";
    const ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "";
    return `
      <li${i >= INITIAL_VISIBLE ? " hidden" : ""}>
        <a class="episode-row" href="${escapeHtml(href)}"${ext} data-num="${ep.num}" title="${escapeHtml(ep.title)}">
          <span class="ep-num">${String(ep.num).padStart(2, "0")}</span>
          <span class="ep-title">${escapeHtml(ep.title)}</span>
          ${meta}
        </a>
      </li>`;
  }).join("");

  syncViewMore();
}

/* ---- VIEW MORE: reveal the hidden rows -------------------------------- */
function syncViewMore() {
  const viewMore = document.querySelector(".view-more");
  if (!viewMore) return;
  const hiddenRows = document.querySelectorAll("#episode-list > li[hidden]").length;
  viewMore.hidden = hiddenRows === 0;
  if (hiddenRows) viewMore.textContent = `VIEW MORE (${hiddenRows})`;
}

function initViewMore() {
  const viewMore = document.querySelector(".view-more");
  if (!viewMore) return;
  viewMore.addEventListener("click", () => {
    document.querySelectorAll("#episode-list > li[hidden]").forEach((li) => li.removeAttribute("hidden"));
    syncViewMore();
  });
}

/* ---- Menu toggle ------------------------------------------------------ */
function initMenu() {
  const menu = document.getElementById("menu");
  const toggle = menu?.querySelector(".menu-toggle");
  if (!menu || !toggle) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  menu.querySelectorAll(".menu-list a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---- Search overlay --------------------------------------------------- */
function initSearch() {
  const overlay = document.getElementById("search-overlay");
  const openBtn = document.querySelector(".search-toggle");
  const closeBtn = overlay?.querySelector(".search-close");
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!overlay || !openBtn || !input || !results) return;

  const open = () => {
    overlay.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    setTimeout(() => input.focus(), 50);
    runSearch("");
  };
  const close = () => {
    overlay.hidden = true;
    input.value = "";
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus(); // return focus to where the overlay was opened from
  };

  const runSearch = (q) => {
    const query = q.trim().toLowerCase();
    const matches = query
      ? episodes.filter((e) => (e.title || "").toLowerCase().includes(query))
      : episodes;
    results.innerHTML = matches.length
      ? matches
          .map((e) => {
            const href = e.url || "#episodes";
            const ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "";
            return `
        <li>
          <a href="${escapeHtml(href)}"${ext}>
            <span class="r-title">${escapeHtml(e.title)}</span>
            <span class="r-meta">EP ${String(e.num).padStart(2, "0")} · ${escapeHtml(e.duration || "")}</span>
          </a>
        </li>`;
          })
          .join("")
      : `<li class="search-empty">No episodes match “${escapeHtml(q)}”.</li>`;
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  input.addEventListener("input", (e) => runSearch(e.target.value));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
  results.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });
}

/* ---- Newsletter (custom form -> Beehiiv submit API) ------------------
   Posts JSON to the same endpoint Beehiiv's own embed uses, so we get a
   real answer back and only say "you're in" when Beehiiv accepted the
   address. If the request fails (network, bot check), we send the reader
   to Beehiiv's hosted form instead of pretending it worked.
--------------------------------------------------------------------- */
const BEEHIIV_SUBMIT = "https://embeds.beehiiv.com/api/submit";

function initJoin() {
  const form = document.getElementById("join-form");
  const note = document.getElementById("join-note");
  if (!form || !note) return;
  const button = form.querySelector("button[type=submit]");
  const buttonHtml = button ? button.innerHTML : "";
  const idle = note.textContent;

  const setNote = (text, cls) => {
    note.textContent = text;
    note.className = "join-note" + (cls ? " " + cls : "");
  };
  const setBusy = (busy) => {
    if (!button) return;
    button.disabled = busy;
    button.innerHTML = busy ? "SENDING\u2026" : buttonHtml;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNote("Please enter a valid email.", "err");
      form.email.focus();
      return;
    }

    setBusy(true);
    setNote("Sending\u2026", "");

    let ok = false;
    let message = "";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(BEEHIIV_SUBMIT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          external_embed_id: form.dataset.embedId,
          publication_id: form.dataset.publicationId,
          email,
          captcha_token: null,
          utm_source: "laidoffto8figures.com",
          utm_medium: "website",
          utm_campaign: "join-form",
          referrer: location.href,
          slim: false,
          user_agent: navigator.userAgent,
        }),
      });
      clearTimeout(timer);
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }
      ok = res.ok && data.success !== false;
      message = data.message || "";
      if (!ok && res.status === 403) message = "";
    } catch {
      ok = false;
    }

    setBusy(false);
    if (ok) {
      setNote("You\u2019re in \u2014 check your inbox to confirm.", "ok");
      form.reset();
      return;
    }
    if (message && /email|address|valid|already/i.test(message)) {
      setNote(message, "err");
      return;
    }
    // Couldn't reach Beehiiv from here: hand off to their hosted form.
    const fallback = new URL(form.action);
    fallback.searchParams.set("email", email);
    window.open(fallback.href, "_blank", "noopener");
    setNote("Couldn\u2019t sign you up from here \u2014 we opened Beehiiv\u2019s form in a new tab.", "err");
    setTimeout(() => setNote(idle, ""), 8000);
  });
}

/* ---- Footer year ------------------------------------------------------ */
function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---- Init ------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  initMenu();
  initSearch();
  initJoin();
  initYear();
  initViewMore();

  const inline = readInlineEpisodes();
  const prerendered = document.querySelector("#episode-list > li") !== null;
  if (inline && prerendered) {
    episodes = inline;   // HTML already painted by the sync script
    syncViewMore();
    return;
  }
  // Fallback: nothing pre-rendered yet — render client-side.
  episodes = inline || FALLBACK_EPISODES;
  renderEpisodes();
  const fetched = await fetchEpisodes();
  if (fetched) { episodes = fetched; renderEpisodes(); }
});

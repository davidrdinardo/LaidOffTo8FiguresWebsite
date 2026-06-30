/* =========================================================
   Laid Off To 8 Figures — interactions
   ========================================================= */

/* ---- Fallback episode data -------------------------------------------
   Shown only if episodes.json hasn't been generated yet. Once the YouTube
   sync (GitHub Action) runs, episodes.json overrides this automatically.
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
let visible = INITIAL_VISIBLE;

/* ---- Helpers ---------------------------------------------------------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/* ---- Load episodes.json (falls back gracefully) ----------------------- */
async function loadEpisodes() {
  try {
    const res = await fetch("episodes.json", { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.episodes) && data.episodes.length) {
      episodes = data.episodes;
    }
  } catch {
    /* offline or file missing — keep fallback */
  }
}

/* ---- Render episodes -------------------------------------------------- */
function renderEpisodes() {
  const list = document.getElementById("episode-list");
  if (!list) return;

  const shown = episodes.slice(0, visible);
  list.innerHTML = shown.map((ep) => {
    const meta = ep.latest
      ? `<span class="ep-meta">${escapeHtml(ep.duration || "")}<span class="ep-latest">LATEST</span></span>`
      : `<span class="ep-meta">${escapeHtml(ep.duration || "")}</span>`;
    const href = ep.url || "#episodes";
    const ext = ep.url ? ' target="_blank" rel="noopener"' : "";
    return `
      <li>
        <a class="episode-row" href="${escapeHtml(href)}"${ext} data-num="${ep.num}" title="${escapeHtml(ep.title)}">
          <span class="ep-num">${String(ep.num).padStart(2, "0")}</span>
          <span class="ep-title">${escapeHtml(ep.title)}</span>
          ${meta}
        </a>
      </li>`;
  }).join("");

  // Toggle the VIEW MORE link based on remaining episodes
  const viewMore = document.querySelector(".view-more");
  if (viewMore) {
    if (visible >= episodes.length) {
      viewMore.hidden = true;
    } else {
      viewMore.hidden = false;
      viewMore.textContent = `VIEW MORE (${episodes.length - visible})`;
    }
  }
}

function initViewMore() {
  const viewMore = document.querySelector(".view-more");
  if (!viewMore) return;
  viewMore.addEventListener("click", (e) => {
    e.preventDefault();
    visible = episodes.length; // reveal all
    renderEpisodes();
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
    setTimeout(() => input.focus(), 50);
    runSearch("");
  };
  const close = () => {
    overlay.hidden = true;
    input.value = "";
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
            const ext = e.url ? ' target="_blank" rel="noopener"' : "";
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

/* ---- Newsletter (custom form -> Beehiiv via hidden iframe) ------------ */
function initJoin() {
  const form = document.getElementById("join-form");
  const note = document.getElementById("join-note");
  if (!form || !note) return;

  form.addEventListener("submit", (e) => {
    const email = form.email.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      e.preventDefault(); // block the POST; show error
      note.textContent = "Please enter a valid email.";
      note.className = "join-note err";
      return;
    }
    // Valid: let the form POST to Beehiiv (targets the hidden iframe so the
    // page doesn't navigate), then show confirmation.
    note.textContent = "You're in — check your inbox to confirm.";
    note.className = "join-note ok";
    setTimeout(() => form.reset(), 50);
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
  renderEpisodes();      // paint fallback immediately
  await loadEpisodes();  // then upgrade to live YouTube data
  renderEpisodes();
});

/* =========================================================
   Laid Off To 8 Figures — interactions
   ========================================================= */

/* ---- Episode data ----------------------------------------------------
   Replace these with your real episodes. `latest: true` flags the newest.
   Order them newest-first; the list renders in this order.
--------------------------------------------------------------------- */
const EPISODES = [
  { num: 34, title: "The Layoff", duration: "1:53:06", latest: true },
  { num: 33, title: "Rock Bottom", duration: "2:17:21" },
  { num: 32, title: "First Dollar", duration: "2:23:22" },
  { num: 31, title: "Six Figures", duration: "1:58:51" },
  { num: 30, title: "Seven Figures", duration: "2:15:52" },
];

/* ---- Render episodes -------------------------------------------------- */
function renderEpisodes() {
  const list = document.getElementById("episode-list");
  if (!list) return;
  list.innerHTML = EPISODES.map((ep) => {
    const meta = ep.latest
      ? `<span class="ep-meta">${ep.duration}<span class="ep-latest">LATEST</span></span>`
      : `<span class="ep-meta">${ep.duration}</span>`;
    return `
      <li class="episode-row" data-num="${ep.num}">
        <span class="ep-num">${String(ep.num).padStart(2, "0")}</span>
        <h2 class="ep-title">${ep.title}</h2>
        ${meta}
      </li>`;
  }).join("");
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

  // Close menu when a link is clicked
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
      ? EPISODES.filter((e) => e.title.toLowerCase().includes(query))
      : EPISODES;
    results.innerHTML = matches.length
      ? matches
          .map(
            (e) => `
        <li>
          <a href="#episodes">
            <span class="r-title">${e.title}</span>
            <span class="r-meta">EP ${String(e.num).padStart(2, "0")} · ${e.duration}</span>
          </a>
        </li>`
          )
          .join("")
      : `<li class="search-empty">No episodes match “${q}”.</li>`;
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  input.addEventListener("input", (e) => runSearch(e.target.value));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
  // Clicking a result closes the overlay
  results.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });
}

/* ---- Newsletter form (front-end only; wire to a backend later) -------- */
function initJoin() {
  const form = document.getElementById("join-form");
  const status = document.getElementById("join-status");
  if (!form || !status) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      status.textContent = "Please enter a valid email.";
      status.className = "join-status err";
      return;
    }
    // TODO: POST to your email provider (ConvertKit, Beehiiv, Mailchimp…).
    status.textContent = "You're in. Check your inbox to confirm.";
    status.className = "join-status ok";
    form.reset();
  });
}

/* ---- Footer year ------------------------------------------------------ */
function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---- Init ------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderEpisodes();
  initMenu();
  initSearch();
  initJoin();
  initYear();
});

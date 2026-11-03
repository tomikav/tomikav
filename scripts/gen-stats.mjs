// Generates dist/stats.svg and dist/langs.svg from the GitHub GraphQL API.
// Runs inside GitHub Actions with the built-in GITHUB_TOKEN.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const C = {
  bg: "#0a0a0f",
  border: "#2a1f40",
  title: "#a78bfa",
  label: "#8b7bb0",
  value: "#ede9fe",
  accent: "#8b5cf6",
  dim: "#4c3d66",
};
const FONT = "'Cascadia Code','JetBrains Mono','Fira Code',Consolas,'DejaVu Sans Mono',monospace";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));

const ICONS = {
  star: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z",
  commit: "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z",
  pr: "M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z",
  issue: "M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z",
  repo: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  contrib: "M1.643 3.143 .427 1.927A.25.25 0 0 1 .604 1.5h2.792a.25.25 0 0 1 .25.25v2.792a.25.25 0 0 1-.427.177L2.003 3.503a6.5 6.5 0 1 0 1.836 9.63.75.75 0 1 1 1.215.878A8 8 0 1 1 1.643 3.143ZM7.75 4a.75.75 0 0 1 .75.75v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5A.75.75 0 0 1 7.75 4Z",
};

const baseStyle = (extra = "") => `
  text { font-family: ${FONT}; }
  .t { fill: ${C.title}; font-size: 15px; font-weight: 700; letter-spacing: 2px; }
  .l { fill: ${C.label}; font-size: 13px; }
  .v { fill: ${C.value}; font-size: 13px; font-weight: 700; }
  .row { opacity: 0; animation: in .5s ease-out forwards; }
  @keyframes in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
  .scan { animation: sweep 5s linear infinite; }
  @keyframes sweep { from { transform: translateY(-30px); } to { transform: translateY(230px); } }
  ${extra}`;

const frame = (w, h, title, body, extraStyle) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>${baseStyle(extraStyle)}</style>
<defs><clipPath id="cl"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10"/></clipPath></defs>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
<g clip-path="url(#cl)"><rect class="scan" x="0" y="0" width="${w}" height="30" fill="${C.accent}" opacity=".04"/></g>
<g stroke="${C.accent}" stroke-width="1.5" fill="none" opacity=".7">
  <path d="M12 24 V12 H24"/><path d="M${w - 24} 12 H${w - 12} V24"/>
  <path d="M12 ${h - 24} V${h - 12} H24"/><path d="M${w - 24} ${h - 12} H${w - 12} V${h - 24}"/>
</g>
<text x="28" y="36" class="t">${esc(title)}</text>
<rect x="28" y="46" width="120" height="1" fill="${C.dim}"/>
${body}
</svg>`;

export function renderStats(d) {
  const rows = [
    ["star", "Total Stars", d.stars],
    ["commit", "Commits (last year)", d.commits],
    ["pr", "Pull Requests", d.prs],
    ["issue", "Issues", d.issues],
    ["repo", "Public Repos", d.repos],
    ["contrib", "Contributed to", d.contributedTo],
  ];
  const body = rows
    .map(([ic, label, val], i) => {
      const y = 76 + i * 25;
      return `<g class="row" style="animation-delay:${0.15 + i * 0.12}s">
  <svg x="28" y="${y - 12}" width="14" height="14" viewBox="0 0 16 16"><path fill="${C.accent}" d="${ICONS[ic]}"/></svg>
  <text x="52" y="${y}" class="l">${esc(label)}</text>
  <text x="250" y="${y}" class="v">${fmt(val)}</text>
</g>`;
    })
    .join("\n");

  // ring with total contributions
  const r = 46, cx = 390, cy = 118, circ = 2 * Math.PI * r;
  const ring = `
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="6"/>
<circle class="ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.accent}" stroke-width="6" stroke-linecap="round"
  stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
<text x="${cx}" y="${cy + 2}" text-anchor="middle" class="v" style="font-size:22px" dominant-baseline="middle">${fmt(d.total)}</text>
<text x="${cx}" y="${cy + r + 26}" text-anchor="middle" class="l" style="font-size:11px;letter-spacing:1px">contributions</text>`;
  const ringCss = `.ring { animation: draw 1.6s ease-out .3s forwards; }
  @keyframes draw { to { stroke-dashoffset: ${(circ * 0.12).toFixed(1)}; } }`;

  return frame(495, 240, "◈ STATS", body + ring, ringCss);
}

export function renderLangs(langs) {
  const top = langs.slice(0, 8);
  const sum = top.reduce((a, l) => a + l.size, 0) || 1;
  const W = 495, barX = 28, barW = W - 56;
  let x = barX;
  const segs = top
    .map((l) => {
      const w = (l.size / sum) * barW;
      const s = `<rect x="${x.toFixed(1)}" y="64" width="${Math.max(w, 1).toFixed(1)}" height="10" fill="${l.color || C.accent}"/>`;
      x += w;
      return s;
    })
    .join("");
  const bar = `<defs><clipPath id="bar"><rect class="grow" x="${barX}" y="64" width="${barW}" height="10" rx="5"/></clipPath></defs>
<rect x="${barX}" y="64" width="${barW}" height="10" rx="5" fill="${C.border}"/>
<g clip-path="url(#bar)">${segs}</g>`;
  const list = top
    .map((l, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const lx = 28 + col * 225, ly = 106 + row * 28;
      return `<g class="row" style="animation-delay:${0.4 + i * 0.1}s">
  <circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${l.color || C.accent}"/>
  <text x="${lx + 18}" y="${ly}" class="l">${esc(l.name)}</text>
  <text x="${lx + 190}" y="${ly}" class="v" text-anchor="end">${((l.size / sum) * 100).toFixed(1)}%</text>
</g>`;
    })
    .join("\n");
  const css = `.grow { transform-origin: ${barX}px 0; transform: scaleX(0); animation: g 1.2s ease-out .2s forwards; }
  @keyframes g { to { transform: scaleX(1); } }`;
  return frame(W, 240, "◈ MOST USED LANGUAGES", bar + list, css);
}

async function fetchData(login, token) {
  const query = `query($login:String!){ user(login:$login){
    contributionsCollection { totalCommitContributions restrictedContributionsCount totalPullRequestContributions totalIssueContributions contributionCalendar { totalContributions } }
    repositoriesContributedTo(first:1, contributionTypes:[COMMIT,PULL_REQUEST,ISSUE,REPOSITORY]) { totalCount }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC) {
      totalCount
      nodes { stargazerCount languages(first:10, orderBy:{field:SIZE, direction:DESC}) { edges { size node { name color } } } }
    }
  } }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-stats" },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const u = json.data.user;
  const cc = u.contributionsCollection;
  const langMap = new Map();
  let stars = 0;
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    for (const e of r.languages.edges) {
      const cur = langMap.get(e.node.name) || { name: e.node.name, color: e.node.color, size: 0 };
      cur.size += e.size;
      langMap.set(e.node.name, cur);
    }
  }
  return {
    stats: {
      stars,
      commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
      prs: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      repos: u.repositories.totalCount,
      contributedTo: u.repositoriesContributedTo.totalCount,
      total: cc.contributionCalendar.totalContributions,
    },
    langs: [...langMap.values()].sort((a, b) => b.size - a.size),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const login = process.env.GH_USER;
  const token = process.env.GITHUB_TOKEN;
  if (!login || !token) throw new Error("GH_USER and GITHUB_TOKEN are required");
  const { stats, langs } = await fetchData(login, token);
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/stats.svg", renderStats(stats));
  writeFileSync("dist/langs.svg", renderLangs(langs));
  console.log("ok", stats, langs.slice(0, 8).map((l) => l.name));
}

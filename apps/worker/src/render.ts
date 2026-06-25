import type { GateRecord } from "./types";
import type { SessionUser } from "./env";

const defaultDescription =
  "Make AI slop and PR spam knock before CI. GitHub login, browser verification, and exact commit SHA.";

type BadgeTone = "green" | "black" | "amber";
type BadgeStyle = "flat" | "rounded";

const GITHUB_APP_INSTALL_URL =
  "https://github.com/apps/pr-captcha/installations/new";

export function renderHome(baseUrl?: string): string {
  const canonical = baseUrl
    ? `<link rel="canonical" href="${escapeHtml(baseUrl)}" />`
    : "";
  const ogImage = baseUrl ? `${baseUrl}/og.svg` : "/og.svg";
  const mascot = `<svg viewBox="0 0 48 48" aria-hidden="true">
        <rect class="m-tile" x="3" y="3" width="42" height="42" rx="13"></rect>
        <circle class="m-blk" cx="15" cy="14.5" r="5.6"></circle>
        <circle class="m-blk" cx="33" cy="14.5" r="5.6"></circle>
        <circle class="m-face" cx="24" cy="26" r="14.2"></circle>
        <rect class="m-blk" x="12.4" y="21.6" width="23.2" height="7.4" rx="3.7"></rect>
        <rect class="m-blk" x="22.6" y="22.4" width="2.8" height="2"></rect>
        <rect class="m-glare" x="15" y="23" width="4.6" height="1.5" rx="0.75"></rect>
        <path class="m-blk" d="M22 31.2h4l-2 2.3z"></path>
        <path class="m-line" d="M21.3 33.6c.9 1.4 4.5 1.4 5.4 0"></path>
        <path class="m-blk" d="M24 40.5l-5 -3v6z"></path>
        <path class="m-blk" d="M24 40.5l5 -3v6z"></path>
        <circle class="m-blk" cx="24" cy="40.5" r="1.9"></circle>
      </svg>`;

  return `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0a0c10" />
    <title>pr-captcha</title>
    <meta name="description" content="pr-captcha makes AI slop and PR spam prove a human is present before it touches your queue or your CI. A GitHub-authenticated, SHA-bound human check at the door. Not AI detection." />
    ${canonical}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="pr-captcha" />
    <meta property="og:title" content="Your repo has a bouncer now." />
    <meta property="og:description" content="A GitHub-authenticated, SHA-bound human check at the door of your pull request queue. Not AI detection." />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Your repo has a bouncer now." />
    <meta name="twitter:description" content="A GitHub-authenticated, SHA-bound human check at the door of your pull request queue." />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
    <style>
      @view-transition {
        navigation: auto;
      }
      @media (prefers-reduced-motion: reduce) {
        ::view-transition-group(*),
        ::view-transition-old(*),
        ::view-transition-new(*) {
          animation: none !important;
        }
      }

      @font-face { font-family: "Hanken Grotesk"; font-style: normal; font-weight: 400 500; font-display: swap; src: url("/assets/fonts/hanken-400.woff2") format("woff2"); }
      @font-face { font-family: "Hanken Grotesk"; font-style: normal; font-weight: 600 800; font-display: swap; src: url("/assets/fonts/hanken-600.woff2") format("woff2"); }
      @font-face { font-family: "JetBrains Mono"; font-style: normal; font-weight: 400 700; font-display: swap; src: url("/assets/fonts/jetbrains-mono-500.woff2") format("woff2"); }
      :root {
        --sys: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        --sans: "Hanken Grotesk", var(--sys);
        --mono: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
        --mark-signal: #2ec27e;
        --paper: #0a0c10; --surface: #13161c; --ink: #f3f4f6; --text: #e6e8ec;
        --muted: #98a0ab; --faint: #6a7280; --line: #232831; --line-2: #1a1e25;
        --mark-bg: #f3f4f6; --mark-fg: #0a0c10; --btn-bg: #f3f4f6; --btn-fg: #0b0e14; --btn-bg-hover: #ffffff;
        --pass: #36c98a; --pass-wash: rgba(54,201,138,0.14);
        --deny: #ff6f5e; --deny-wash: rgba(255,111,94,0.14);
        --held: #97a0ad; --held-wash: rgba(151,160,173,0.13);
        --shadow: 0 1px 0 rgba(0,0,0,0.4), 0 26px 60px -34px rgba(0,0,0,0.8);
        --grid: rgba(255,255,255,0.022);
      }
      html[data-theme="light"] {
        color-scheme: light;
        --paper: #fafaf8; --surface: #ffffff; --ink: #0b0e14; --text: #16191f;
        --muted: #5b626d; --faint: #8b919b; --line: #e8e7e2; --line-2: #f0efeb;
        --mark-bg: #0b0e14; --mark-fg: #ffffff; --btn-bg: #0b0e14; --btn-fg: #ffffff; --btn-bg-hover: #23262e;
        --pass: #0a7d4f; --pass-wash: #e7f4ee; --deny: #c2392a; --deny-wash: #fbece9;
        --held: #6b7280; --held-wash: #f0f1f3;
        --shadow: 0 1px 0 rgba(11,14,20,0.02), 0 22px 48px -30px rgba(11,14,20,0.3);
        --grid: rgba(11,14,20,0.025); --mark-signal: #16a35c;
      }
      * { box-sizing: border-box; }
      button, a, .btn, .button, .tg { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      html { color-scheme: dark; background: var(--paper); scroll-behavior: smooth; scroll-padding-top: 84px; }
      body { margin: 0; background: linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 100% 112px, var(--paper); color: var(--text); font-family: var(--sans); font-size: 16px; line-height: 1.55; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; transition: background-color 0.3s ease, color 0.3s ease; }
      a { color: inherit; text-decoration: none; }
      ::selection { background: var(--mark-signal); color: var(--surface); }
      .wrap { width: min(1080px, calc(100% - 48px)); margin-inline: auto; }
      .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
      .eyebrow { font-family: var(--mono); font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
      :focus-visible { outline: 2px solid var(--mark-signal); outline-offset: 3px; border-radius: 4px; }
      .skip-link { position: fixed; top: 14px; left: 14px; z-index: 60; background: var(--ink); color: var(--paper); padding: 9px 13px; border-radius: 8px; font-size: 13px; font-weight: 700; transform: translateY(-160%); }
      .skip-link:focus { transform: none; }
      svg .m-tile { fill: #f3f3f4; } svg .m-blk { fill: #15181e; } svg .m-face { fill: #ffffff; stroke: #15181e; stroke-width: 1; } svg .m-glare { fill: #ffffff; opacity: 0.9; } svg .m-line { fill: none; stroke: #15181e; stroke-width: 1; stroke-linecap: round; }
      .mark { width: 30px; height: 30px; flex: none; display: inline-flex; }
      .mark svg, .brand svg { display: block; width: 100%; height: 100%; }
      .mascot-xl { width: 104px; height: 104px; }
      .mascot-xl svg { animation: bob 4.5s ease-in-out infinite; transform-origin: 50% 60%; }
      @keyframes bob { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-5px) rotate(1deg); } }
      header.site { position: sticky; top: 0; z-index: 30; background: color-mix(in srgb, var(--paper) 80%, transparent); backdrop-filter: saturate(150%) blur(10px); border-bottom: 1px solid var(--line); }
      .bar { display: flex; align-items: center; gap: 28px; height: 62px; }
      .brand { display: inline-flex; align-items: center; gap: 11px; font-weight: 680; letter-spacing: -0.02em; font-size: 18px; }
      .brand .tag { font-family: var(--mono); font-size: 11px; color: var(--faint); letter-spacing: 0.02em; padding: 2px 6px; border: 1px solid var(--line); border-radius: 5px; }
      nav.main { margin-left: auto; display: flex; gap: 24px; font-size: 14px; color: var(--muted); }
      nav.main a:hover { color: var(--text); }
      .tg { display: grid; place-items: center; width: 34px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--muted); cursor: pointer; font-size: 14px; }
      .tg:hover { color: var(--text); }
      .gh-star { display: inline-flex; align-items: center; gap: 7px; }
      .gh-star svg { width: 15px; height: 15px; fill: currentColor; flex: none; }
      .btn { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 560; letter-spacing: -0.01em; font-family: inherit; padding: 9px 16px; border-radius: 9px; border: 1px solid transparent; cursor: pointer; transition: transform 0.12s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s; }
      .btn:active { transform: translateY(1px); }
      .btn.primary { background: var(--btn-bg); color: var(--btn-fg); }
      .btn.primary:hover { background: var(--btn-bg-hover); }
      .btn.ghost { border-color: var(--line); color: var(--text); background: var(--surface); }
      .btn.ghost:hover { border-color: var(--text); }
      .btn.sm { padding: 7px 13px; font-size: 13px; }
      .hero { display: grid; grid-template-columns: 1.04fr 0.96fr; gap: 56px; align-items: center; padding: 88px 0 76px; }
      .hero h1 { font-size: clamp(40px, 6.2vw, 70px); line-height: 0.97; letter-spacing: -0.038em; font-weight: 680; margin: 18px 0 0; text-wrap: balance; }
      .hero h1 em { font-style: normal; background: linear-gradient(var(--mark-signal), var(--mark-signal)) left bottom / 100% 0.1em no-repeat; padding-bottom: 0.02em; }
      .hero .lede { font-size: 19px; color: var(--muted); margin: 22px 0 0; max-width: 33ch; line-height: 1.5; }
      .hero .cta { display: flex; gap: 12px; margin-top: 30px; flex-wrap: wrap; }
      .proofline { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 8px 18px; font-family: var(--mono); font-size: 12.5px; color: var(--muted); }
      .proofline span { display: inline-flex; align-items: center; gap: 6px; }
      .proofline b { color: var(--text); font-weight: 600; }
      .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--pass); display: inline-block; }
      .hero-right { position: relative; }
      .mascot-hero { position: absolute; top: -48px; left: 2px; z-index: 3; }
      .receipt { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; }
      .receipt .top { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-bottom: 1px solid var(--line-2); font-size: 13px; }
      .receipt .top .repo { font-family: var(--mono); color: var(--muted); }
      .receipt .top .pr { margin-left: auto; font-family: var(--mono); font-size: 12px; color: var(--faint); }
      .check { display: flex; align-items: flex-start; gap: 12px; padding: 16px; }
      .check + .check { border-top: 1px solid var(--line-2); }
      .check .ic { width: 22px; height: 22px; border-radius: 50%; flex: none; display: grid; place-items: center; margin-top: 1px; font-size: 12px; font-weight: 700; }
      .ic.ok { background: var(--pass-wash); color: var(--pass); } .ic.no { background: var(--held-wash); color: var(--held); }
      .check .name { font-family: var(--mono); font-size: 13.5px; font-weight: 600; }
      .check .desc { color: var(--muted); font-size: 13px; margin-top: 2px; }
      .check .state { margin-left: auto; font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; align-self: center; }
      .state.pass { background: var(--pass-wash); color: var(--pass); } .state.held { background: var(--held-wash); color: var(--held); }
      .receipt .foot { padding: 12px 16px; background: var(--line-2); display: flex; gap: 16px; font-family: var(--mono); font-size: 11.5px; color: var(--muted); flex-wrap: wrap; }
      .receipt .foot b { color: var(--text); font-weight: 600; }
      .band { border-block: 1px solid var(--line); background: var(--surface); }
      .band .wrap { display: grid; grid-template-columns: 1.3fr repeat(3, 1fr); gap: 36px; padding: 40px 0; align-items: center; }
      .band .pitch p { font-size: 17px; line-height: 1.5; letter-spacing: -0.01em; max-width: 32ch; margin: 12px 0 0; }
      .band .pitch b { font-weight: 620; }
      .stat .n { font-size: 34px; font-weight: 680; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
      .stat .l { font-size: 13px; color: var(--muted); margin-top: 4px; line-height: 1.35; }
      .stat .n.bad { color: var(--deny); }
      section.blk { padding: 76px 0; }
      .head { max-width: 56ch; }
      .head h2 { font-size: clamp(28px, 3.6vw, 38px); letter-spacing: -0.03em; font-weight: 660; margin: 12px 0 0; text-wrap: balance; }
      .head p { color: var(--muted); font-size: 17px; margin: 14px 0 0; }
      .steps { margin-top: 44px; display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--surface); }
      .step { padding: 22px 20px; border-right: 1px solid var(--line-2); }
      .step:last-child { border-right: none; }
      .step .k { font-family: var(--mono); font-size: 12px; color: var(--mark-signal); font-weight: 600; }
      .step h3 { font-size: 15px; margin: 12px 0 6px; letter-spacing: -0.01em; }
      .step p { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.45; }
      .step .mono { color: var(--text); }
      .twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: center; }
      .demo-twocol { grid-template-columns: 0.78fr 1.22fr; gap: 40px; }
      .drake-card { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow); }
      .drake-row { display: flex; align-items: center; gap: 16px; padding: 20px; }
      .drake-row + .drake-row { border-top: 1px solid var(--line-2); }
      .drake-row .face { width: 54px; height: 54px; border-radius: 13px; flex: none; display: grid; place-items: center; font-size: 28px; }
      .drake-row.reject .face { background: var(--deny-wash); } .drake-row.accept .face { background: var(--pass-wash); }
      .drake-row .txt { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.35; }
      .drake-row .sub { font-size: 13px; color: var(--muted); font-weight: 400; margin-top: 3px; }
      .quips { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .quips blockquote { margin: 0; padding: 22px 24px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); font-size: 19px; font-weight: 640; line-height: 1.4; letter-spacing: -0.01em; color: var(--ink); }
      .quips blockquote em { font-style: normal; background: linear-gradient(var(--mark-signal), var(--mark-signal)) left bottom / 100% 0.1em no-repeat; padding-bottom: 0.02em; }
      .quips blockquote code { font-family: var(--mono); font-size: 0.84em; color: var(--muted); }
      .quip-by { display: block; margin-top: 10px; font-size: 13px; font-weight: 500; color: var(--muted); }
      .quip-by::before { content: "- "; }
      .explore { margin-top: 44px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .explore a { border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: var(--surface); transition: border-color 0.15s, transform 0.12s; }
      .explore a:hover { border-color: var(--text); transform: translateY(-1px); }
      .explore .rn { font-family: var(--mono); font-size: 13px; font-weight: 600; }
      .explore .rd { font-size: 12.5px; color: var(--muted); margin-top: 4px; }
      .explore-note { margin-top: 18px; font-size: 13.5px; color: var(--muted); }
      .explore-note a { color: var(--text); text-decoration: underline; text-underline-offset: 2px; }
      .final { background: var(--ink); color: var(--paper); border-radius: 18px; padding: 56px 48px; display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; border: 1px solid var(--line); }
      .final h2 { font-size: clamp(26px, 3.4vw, 36px); letter-spacing: -0.03em; font-weight: 640; margin: 0; max-width: 18ch; text-wrap: balance; }
      .final .quip { font-family: var(--mono); font-size: 12.5px; color: color-mix(in srgb, var(--paper) 55%, transparent); margin-top: 12px; }
      .final .btn.primary { background: var(--paper); color: var(--ink); }
      .final .btn.ghost { background: transparent; color: var(--paper); border-color: color-mix(in srgb, var(--paper) 28%, transparent); }
      footer.site { border-top: 1px solid var(--line); padding: 40px 0; color: var(--muted); font-size: 13px; }
      footer.site .wrap { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
      footer.site nav { display: flex; gap: 18px; margin-left: auto; flex-wrap: wrap; }
      footer.site a:hover { color: var(--text); }
      @media (prefers-reduced-motion: reduce) { .mascot-xl svg { animation: none; } * { transition: none !important; } }
      @media (max-width: 860px) {
        .hero { grid-template-columns: 1fr; gap: 40px; padding: 52px 0; }
        .mascot-hero { position: static; margin-bottom: 14px; }
        .band .wrap { grid-template-columns: 1fr 1fr; gap: 28px; }
        .band .pitch { grid-column: 1 / -1; }
        .steps { grid-template-columns: 1fr 1fr; }
        .step { border-bottom: 1px solid var(--line-2); }
        .twocol { grid-template-columns: 1fr; }
        .explore { grid-template-columns: 1fr; }
        .quips { grid-template-columns: 1fr; }
        nav.main { display: none; }
      }
      .demo-figure { margin: 0; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: var(--surface); box-shadow: 0 40px 100px -48px rgba(0,0,0,0.6); }
      .demo-figure video, .demo-figure img { display: block; width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site">
      <div class="wrap bar">
        <a class="brand" href="/"><span class="mark" aria-hidden="true">${mascot}</span><span>pr-captcha</span><span class="tag">free · hosted</span></a>
        <nav class="main" aria-label="Primary navigation">
          <a href="#how">How it works</a>
          <a href="#short">The idea</a>
          <a href="/trust">Trust</a>
          <a href="/setup-wizard">Setup</a>
          <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
        </nav>
        <a class="btn ghost sm gh-star" href="https://github.com/aryabyte21/pr-captcha">${githubMark()}<span>Star</span></a>
        <button class="tg" id="theme" type="button" aria-label="Toggle light or dark">☀</button>
        <a class="btn primary sm" href="${GITHUB_APP_INSTALL_URL}">Install free</a>
      </div>
    </header>
    <main id="main">
      <div class="wrap">
        <section class="hero">
          <div>
            <span class="eyebrow">Human-presence check for pull requests</span>
            <h1>Your repo<br />has a <em>bouncer</em><br />now.</h1>
            <p class="lede">pr-captcha checks ID at the door. Every unknown PR has to prove a real GitHub human is present before it touches your queue or your CI.</p>
            <div class="cta">
              <a class="btn primary" href="${GITHUB_APP_INSTALL_URL}">Install the GitHub App</a>
              <a class="btn ghost" href="/evidence">Scan your repo</a>
            </div>
            <div class="proofline">
              <span><span class="dot"></span><b>1 user</b></span>
              <span><span class="dot"></span><b>1 commit</b></span>
              <span><span class="dot"></span><b>0 patch executed</b></span>
              <span>· bound to the exact head SHA</span>
            </div>
          </div>
          <div class="hero-right">
            <div class="mascot-hero mascot-xl" aria-hidden="true">${mascot}</div>
            <div class="receipt" aria-label="Example pull request checks">
              <div class="top"><span style="color: var(--pass)">●</span><span class="repo">octo-org/awesome-repo</span><span class="pr">#184 · a1b2c3d</span></div>
              <div class="check"><span class="ic ok">✓</span><div><div class="name">pr-captcha / human</div><div class="desc">Verified by @real-contributor for this exact commit.</div></div><span class="state pass">Pass</span></div>
              <div class="check"><span class="ic no">○</span><div><div class="name">ci / build &amp; test</div><div class="desc">Fork workflow held until a human is verified.</div></div><span class="state held">Held</span></div>
              <div class="foot"><span>identity <b>GitHub OAuth</b></span><span>presence <b>Turnstile</b></span><span>scope <b>head SHA</b></span></div>
            </div>
          </div>
        </section>
        <section class="blk demo-reel">
          <div class="twocol demo-twocol">
            <div class="head">
              <span class="eyebrow">30 seconds, start to finish</span>
              <h2>Watch it work.</h2>
              <p>A drive-by PR opens, the human check posts, a contributor clears the door, and held CI releases. No code ever runs.</p>
            </div>
            <figure class="demo-figure">
              <video src="/assets/pr-captcha-demo.mp4" autoplay loop muted playsinline preload="metadata" width="1624" height="1080" aria-label="pr-captcha gating a pull request from open to released CI"></video>
            </figure>
          </div>
        </section>
      </div>
      <div class="band">
        <div class="wrap">
          <div class="pitch">
            <span class="eyebrow">The inbox problem, for code</span>
            <p>When a PR costs nothing to send, maintainers inherit the spam. One fast-growing repo went from <b>2 PRs a week to 3,400</b> while its merge rate fell off a cliff.</p>
          </div>
          <div class="stat"><div class="n">3,400</div><div class="l">PRs per week at peak, up from 2</div></div>
          <div class="stat"><div class="n bad">9.3%</div><div class="l">merged, down from 48%</div></div>
          <div class="stat"><div class="n bad">106</div><div class="l">PRs from one account in a day, ~3s apart</div></div>
        </div>
      </div>
      <div class="wrap">
        <section class="blk" id="how">
          <div class="head">
            <span class="eyebrow">Deliberately boring</span>
            <h2>Not AI detection. A door.</h2>
            <p>pr-captcha never guesses whether a patch was written by a model, and never checks out or runs the code. It reads metadata, binds the commit, and asks for one logged-in human.</p>
          </div>
          <div class="steps">
            <div class="step"><div class="k">01</div><h3>PR opens</h3><p>A pull request lands under your policy: everything, or a narrower target.</p></div>
            <div class="step"><div class="k">02</div><h3>Check posted</h3><p>A SHA-bound <span class="mono">pr-captcha/human</span> check and one comment appear.</p></div>
            <div class="step"><div class="k">03</div><h3>Human shows</h3><p>Contributor signs in with GitHub and clears a browser check.</p></div>
            <div class="step"><div class="k">04</div><h3>Signal published</h3><p>The exact commit is marked human-verified. New commit, new check.</p></div>
            <div class="step"><div class="k">05</div><h3>You decide</h3><p>Use it for triage, branch protection, or releasing held CI.</p></div>
          </div>
        </section>
        <section class="blk" id="short" style="padding-top: 0">
          <div class="twocol">
            <div class="head">
              <span class="eyebrow">The short version</span>
              <h2>Stop refereeing taste. Charge at the door.</h2>
              <p>You can't reliably detect AI, and you shouldn't have to. Move the cost to the sender: a logged-in human, bound to one commit. Cheap for real contributors, annoying for spray-and-pray bots.</p>
            </div>
            <div class="drake-card" aria-label="Two ways to handle slop">
              <div class="drake-row reject"><div class="face">🙅‍♂️</div><div><div class="txt">Detect whether the patch was written by AI</div><div class="sub">false positives, an arms race, angry humans</div></div></div>
              <div class="drake-row accept"><div class="face">😎</div><div><div class="txt">Make the sender prove they're one human</div><div class="sub">bound to the commit, zero code executed</div></div></div>
            </div>
          </div>
        </section>
        <section class="blk" id="quips" style="padding-top: 0">
          <div class="head">
            <h2>It's not a Turing test. It's a <em>guest list</em>.</h2>
          </div>
          <div class="quips">
            <blockquote>★☆☆☆☆ "Tried to spam this repo. It made me <em>log in</em>. Like a human. Zero stars."<span class="quip-by">a bot, allegedly</span></blockquote>
            <blockquote>We don't run your PR's code. We've <em>seen</em> your PR's code. We're good.</blockquote>
            <blockquote><code>git push</code> &rarr; "200 OK, but who <em>are</em> you?" &rarr; <code>pr-captcha/human: pending</code></blockquote>
            <blockquote>Don't let your CI runners be some AI agent's <em>free GPU</em>.</blockquote>
          </div>
        </section>
        <section class="blk" id="explore" style="padding-top: 0">
          <div class="head">
            <span class="eyebrow">Kick the tires</span>
            <h2>See it before you install.</h2>
            <p>Every tool below runs on the free hosted Worker. No install required to look around.</p>
          </div>
          <div class="explore">
            <a href="/demo"><div class="rn">/demo</div><div class="rd">Interactive dry run of the full gate</div></a>
            <a href="/evidence"><div class="rn">/evidence</div><div class="rd">Scan a repo for queue risk</div></a>
            <a href="/setup-wizard"><div class="rn">/setup-wizard</div><div class="rd">Generate your policy in two minutes</div></a>
          </div>
          <p class="explore-note">After installing, generate a policy in the <a href="/setup-wizard">setup wizard</a> and check service health on the <a href="/status">status page</a>.</p>
        </section>
        <section class="blk" style="padding-top: 0">
          <div class="final">
            <div>
              <h2>Give your repo a door.</h2>
              <div class="quip">$ git push → "who sent this?" → review still decides.</div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap">
              <a class="btn primary" href="${GITHUB_APP_INSTALL_URL}">Install free</a>
              <a class="btn ghost gh-star" href="https://github.com/aryabyte21/pr-captcha">${githubMark()}<span>Star on GitHub</span></a>
              <a class="btn ghost" href="/trust">Read the trust docs</a>
            </div>
          </div>
        </section>
      </div>
      <footer class="site">
        <div class="wrap">
          <span class="brand" style="font-size: 14px"><span class="mark" style="width: 20px; height: 20px" aria-hidden="true">${mascot}</span>pr-captcha</span>
          <span>A bouncer for your pull request queue.</span>
          <nav aria-label="Footer">
            <a href="/trust">Trust</a>
            <a href="/status">Status</a>
            <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
          </nav>
        </div>
      </footer>
    </main>
    <script>
      (function () {
        var root = document.documentElement;
        function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
        function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
        root.setAttribute("data-theme", get("theme", "dark"));
        var btn = document.getElementById("theme");
        function sync() { btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀" : "☾"; }
        sync();
        btn.addEventListener("click", function () {
          var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
          root.setAttribute("data-theme", next); set("theme", next); sync();
        });
      })();
    </script>
  </body>
</html>`;
}

export function renderDemoPage(baseUrl?: string): string {
  return layout(
    "pr-captcha demo",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span><span class="tag">free · hosted</span></a>
      <nav class="site-nav" aria-label="Primary navigation"><a href="/">Home</a><a href="/demo">Demo</a><a href="/evidence">Evidence</a><a href="/setup-wizard">Setup</a><a href="/trust">Trust</a><a href="https://github.com/aryabyte21/pr-captcha">GitHub</a></nav>
      <span class="header-actions"><button class="header-tg" id="theme" type="button" aria-label="Toggle light or dark">☀</button><a class="button dark header-cta" href="${GITHUB_APP_INSTALL_URL}">Install free</a></span>
    </header>
    <main id="main" class="preview-page demo-page">
      <section class="preview-heading demo-heading">
        <div>
          <h1>PR captcha Gate Lab</h1>
          <p>Run the full intake story before installing the GitHub App: AI-slop PR arrives, human check is pending, GitHub login and CAPTCHA pass, exact SHA is verified, and CI is released.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-demo-replay>Run gate simulation</button>
            <button class="button light" type="button" data-copy-demo-policy>Copy install config</button>
            <a class="button light" href="/setup-wizard">Open setup wizard</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>No GitHub App install</span>
          <span><span class="mini-shield">✓</span>Exact SHA dry run</span>
          <span><span class="mini-shield">✓</span>Copy branch check</span>
        </div>
      </section>
      <section class="demo-lab-strip" aria-label="Gate Lab proof points">
        <div>
          <strong>0 jobs started</strong>
          <span>Fork CI stays held until human-origin proof exists.</span>
        </div>
        <div>
          <strong>1 GitHub user</strong>
          <span>The solver is tied to an OAuth session and repository policy.</span>
        </div>
        <div>
          <strong>1 exact SHA</strong>
          <span>New commits need a fresh gate before inheriting trust.</span>
        </div>
        <div>
          <strong>Metadata only</strong>
          <span>The Worker never checks out or executes PR code.</span>
        </div>
      </section>
      <section class="demo-shell" aria-label="pr-captcha demo flow">
        <div class="demo-control">
          <div class="panel-top">
            <strong>Demo timeline</strong>
            <span data-demo-stage-label>PR opened</span>
          </div>
          <div class="demo-steps">
            ${demoStepButton("0", "PR opened", "Untrusted fork PR enters the queue.", true)}
            ${demoStepButton("1", "Gate created", "pr-captcha posts a check and link.")}
            ${demoStepButton("2", "Human verified", "GitHub login and Turnstile pass.")}
            ${demoStepButton("3", "Check passed", "The exact commit receives the signal.")}
          </div>
          <div class="demo-copy-check">
            <span>Branch protection check</span>
            <code data-copy-check-source>pr-captcha/human</code>
            <button class="button light compact" type="button" data-copy-check>Copy</button>
          </div>
        </div>
        <div class="demo-stage">
          <div class="demo-status" data-demo-status>
            <span class="mini-shield" data-demo-status-icon>!</span>
            <div>
              <strong data-demo-title>AI-slop PR waiting</strong>
              <p data-demo-body>A PR opened under an enabled target. CI is held until the exact head SHA has a human-origin signal.</p>
            </div>
          </div>
          <div class="demo-pr-grid">
            <section class="demo-pr-panel" aria-label="Simulated pull request state">
              <div class="repo-topbar">
                <strong>open-source/app</strong>
                <span>Pull request #184</span>
              </div>
              <div class="repo-pr">
                <h2>Improve onboarding copy <span class="pr-num">#184</span></h2>
                <p><strong>Open</strong> drive-by-user wants to merge <code>8f31c9a</code> into <code>main</code></p>
              </div>
              <div class="demo-checks">
                <article class="demo-check" data-demo-ci data-state="held">
                  <span class="demo-check-mark"></span>
                  <div>
                    <strong>GitHub Actions / ci.yml</strong>
                    <p data-demo-ci-body>Fork workflow is held before the held workflow starts.</p>
                  </div>
                  <span data-demo-ci-label>Held</span>
                </article>
                <article class="demo-check" data-demo-human-check data-state="waiting">
                  <span class="demo-check-mark">${brandMark("tiny")}</span>
                  <div>
                    <strong>pr-captcha / human</strong>
                    <p data-demo-check-body>Waiting for the contributor to verify this exact SHA.</p>
                  </div>
                  <span data-demo-check-label>Waiting</span>
                </article>
              </div>
              <div class="demo-comment" data-demo-comment>
                <div class="card-top">${brandMark("small")}<strong>pr-captcha</strong><span>now</span></div>
                <p data-demo-comment-body>Open the verification link to prove a GitHub-authenticated human is present for commit <code>8f31c9a</code>.</p>
                <button class="button compact dark" type="button" data-demo-verify>Verify as PR author</button>
              </div>
            </section>
            <section class="demo-audit-panel" aria-label="Simulated audit trail">
              <div class="panel-top">
                <strong>Audit trail</strong>
                <span>metadata only</span>
              </div>
              <div class="demo-audit-list" data-demo-audit>
                <div data-level="warning"><strong>gate.pending</strong><span>Waiting on human-origin proof for 8f31c9a.</span></div>
              </div>
            </section>
          </div>
        </div>
      </section>
      <section class="demo-install-strip" aria-label="Copyable install handoff">
        <div>
          <h2>Take the same gate to branch protection.</h2>
          <p>Use the demo to align maintainers, then copy the required check and starter repository policy into the setup wizard.</p>
        </div>
        <pre data-demo-policy>mode: hybrid
require:
  github_login: true
  solver_must_be_pr_author: true
  new_sha_requires_new_captcha: true
checks:
  create_required_check: true
  name: pr-captcha/human</pre>
        <button class="button primary" type="button" data-copy-demo-policy>Copy install config</button>
      </section>
      <section class="demo-next">
        <div>
          <h2>Use the demo as the handoff.</h2>
          <p>Send maintainers to this page first, then move straight into the setup wizard and status page when they are ready to install.</p>
        </div>
        <div class="demo-next-actions">
          <a class="button primary" href="/setup-wizard">Generate policy</a>
          <a class="button light" href="/status">Check service status</a>
          <a class="button light" href="${GITHUB_APP_INSTALL_URL}">Install free</a>
        </div>
      </section>
    </main>
    ${demoPageScript()}`,
    {
      title: "pr-captcha demo",
      description:
        "Shareable pr-captcha dry run showing a SHA-bound human-origin check before installation.",
      canonicalUrl: baseUrl ? `${baseUrl}/demo` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderEvidenceScannerPage(
  baseUrl?: string,
  initialRepository = "godotengine/godot",
): string {
  const reportUrl = evidenceReportUrl(baseUrl, initialRepository);
  return layout(
    "Repo evidence",
    `<header class="site-header utility-header evidence-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span><span class="tag">free · hosted</span></a>
      <nav class="site-nav" aria-label="Primary navigation"><a href="/">Home</a><a href="/demo">Demo</a><a href="/evidence">Evidence</a><a href="/setup-wizard">Setup</a><a href="/trust">Trust</a><a href="https://github.com/aryabyte21/pr-captcha">GitHub</a></nav>
      <span class="header-actions"><button class="header-tg" id="theme" type="button" aria-label="Toggle light or dark">☀</button><a class="button dark header-cta" href="${GITHUB_APP_INSTALL_URL}">Install free</a></span>
    </header>
    <main id="main" class="preview-page evidence-page">
      <section class="preview-heading evidence-heading">
        <div>
          <p class="eyebrow">Quick repo sniff test</p>
          <h1>Would this repo benefit?</h1>
          <p>Paste a repository and see whether the queue has enough outside, fork, bot, or stale PR pressure to justify a human receipt check.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-evidence-run>Run live scan</button>
            <button class="button light" type="button" data-evidence-copy>Copy report</button>
            <a class="button light" href="/setup-wizard">Make policy</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Open PR pressure</span>
          <span><span class="mini-shield">✓</span>Fork and bot signals</span>
          <span><span class="mini-shield">✓</span>Clear recommendation</span>
        </div>
      </section>
      <section class="evidence-shell" aria-label="Repository evidence scanner">
        <form class="evidence-controls" data-evidence-form>
          <div class="panel-top">
            <strong>Repo evidence</strong>
            <span data-evidence-status>ready</span>
          </div>
          <div class="evidence-field">
            <label for="evidence-repo">GitHub repository</label>
            <div>
              <span>github.com/</span>
              <input id="evidence-repo" name="repo" value="${escapeHtml(initialRepository)}" autocomplete="off" data-evidence-repo />
            </div>
          </div>
          <div class="evidence-presets" aria-label="Repository presets">
            <button class="button light compact" type="button" data-evidence-preset="godotengine/godot">Godot</button>
            <button class="button light compact" type="button" data-evidence-preset="kubernetes/kubernetes">Kubernetes</button>
            <button class="button light compact" type="button" data-evidence-preset="freeCodeCamp/freeCodeCamp">freeCodeCamp</button>
            <button class="button light compact" type="button" data-evidence-preset="tldraw/tldraw">tldraw</button>
          </div>
          <div class="evidence-explain">
            <h2>What this checks</h2>
            <p>Open PR pressure, recent fork PRs, unknown authors, stale pull requests, bot traffic, repeated low-signal titles, and spam or invalid label counts when GitHub search allows it.</p>
          </div>
          <div class="evidence-actions">
            <a href="/setup-wizard">Generate policy</a>
            <a href="/demo">Try the gate</a>
            <a href="${GITHUB_APP_INSTALL_URL}">Install the app</a>
          </div>
        </form>
        <div class="evidence-results">
          <section class="evidence-recommendation" data-evidence-risk="medium">
            <div>
              <span class="mini-shield">✓</span>
              <div>
                <h2 data-evidence-recommendation-title>Recommended gate</h2>
                <p data-evidence-recommendation>Run a live scan to get a repo-specific install recommendation.</p>
              </div>
            </div>
            <dl>
              <div><dt>Repository</dt><dd data-evidence-repository>${escapeHtml(initialRepository)}</dd></div>
              <div><dt>Generated</dt><dd data-evidence-generated>not scanned yet</dd></div>
              <div><dt>Evidence quality</dt><dd data-evidence-quality>waiting</dd></div>
            </dl>
            <div class="evidence-share">
              <label for="evidence-report-link">Report link</label>
              <div>
                <input id="evidence-report-link" value="${escapeHtml(reportUrl)}" readonly data-evidence-link />
                <button class="button light compact" type="button" data-evidence-copy-link>Copy link</button>
              </div>
              <small>Share this with maintainers before installing a GitHub App.</small>
            </div>
          </section>
          <section class="evidence-metrics" aria-label="Repository evidence metrics">
            ${evidenceMetric("open", "Open PRs", "scan", "Total open pull requests from GitHub.")}
            ${evidenceMetric("fork", "Fork pressure", "scan", "Recent open pull requests from forks.")}
            ${evidenceMetric("unknown", "Unknown authors", "scan", "Recent PR authors outside trusted associations.")}
            ${evidenceMetric("stale", "Stale PRs", "scan", "Recent sample open for at least 14 days.")}
            ${evidenceMetric("labels", "Spam labels", "scan", "PRs carrying spam or invalid labels.")}
            ${evidenceMetric("bots", "Bot PRs", "scan", "Recent PRs opened by bot accounts.")}
          </section>
          <section class="evidence-prs">
            <div class="panel-top">
              <strong>Recent PR sample</strong>
              <span data-evidence-sample>waiting</span>
            </div>
            <div class="evidence-empty" data-evidence-empty>
              <strong>No scan yet</strong>
              <p>Run the default scan or paste a GitHub repository to see recent PRs, trust badges, and queue risk.</p>
            </div>
            <ol class="evidence-pr-list" data-evidence-prs></ol>
          </section>
          <section class="evidence-summary-card">
            <div class="panel-top">
              <strong>Shareable report</strong>
              <span data-evidence-report-status>ready</span>
            </div>
            <pre class="status-json evidence-summary" data-evidence-summary>Run a live scan to generate a maintainer-ready evidence report.</pre>
          </section>
          <section class="evidence-brief-card" aria-label="Maintainer evidence brief">
            <div class="panel-top">
              <strong>Maintainer evidence brief</strong>
              <span data-evidence-brief-status>ready</span>
            </div>
            <div class="evidence-brief-actions">
              <p>Paste this into an issue or discussion when a project needs proof before adding a required check.</p>
              <button class="button primary compact" type="button" data-evidence-copy-brief>Copy maintainer brief</button>
            </div>
            <pre class="status-json evidence-summary evidence-brief" data-evidence-brief>Run a live scan to generate a maintainer-ready adoption brief.</pre>
          </section>
        </div>
      </section>
    </main>
    ${evidenceScannerScript()}`,
    {
      title: "Repo evidence scanner",
      description:
        "Scan a GitHub repository for pull request queue pressure before installing pr-captcha.",
      canonicalUrl: baseUrl ? `${baseUrl}/evidence` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderTrustCenterPage(baseUrl?: string): string {
  return layout(
    "Trust Center",
    `<header class="site-header utility-header trust-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span><span class="tag">free · hosted</span></a>
      <nav class="site-nav" aria-label="Primary navigation"><a href="/">Home</a><a href="/demo">Demo</a><a href="/evidence">Evidence</a><a href="/setup-wizard">Setup</a><a href="/trust">Trust</a><a href="https://github.com/aryabyte21/pr-captcha">GitHub</a></nav>
      <span class="header-actions"><button class="header-tg" id="theme" type="button" aria-label="Toggle light or dark">☀</button><a class="button dark header-cta" href="${GITHUB_APP_INSTALL_URL}">Install free</a></span>
    </header>
    <main id="main" class="preview-page trust-page">
      <section class="preview-heading trust-heading">
        <div>
          <p class="eyebrow">Plain promises</p>
          <h1>What pr-captcha does not do.</h1>
          <p>It does not judge code quality, read private source beyond GitHub metadata, or run contributor code. It records one GitHub-authenticated human receipt for one commit SHA.</p>
          <div class="actions demo-actions">
            <a class="button primary" href="/security.md">Security contact</a>
            <a class="button light" href="/privacy.md">Privacy</a>
            <a class="button light" href="/terms.md">Terms</a>
          </div>
        </div>
        <aside class="trust-readiness" aria-label="Trust readiness">
          <div>
            <span>Public launch posture</span>
            <strong>Beta ready</strong>
            <small>Docs exist. Real support mailbox and production accounts still need setup.</small>
          </div>
          <div>
            <span>Data handling</span>
            <strong>Metadata only</strong>
            <small>No checkout, build, tests, or execution of pull request code.</small>
          </div>
          <div>
            <span>Security model</span>
            <strong>SHA bound</strong>
            <small>Verification binds GitHub login, PR author policy, repository, PR, and head SHA.</small>
          </div>
        </aside>
      </section>
      <section class="trust-shell" aria-label="Trust documents">
        <div class="trust-docs">
          <div class="panel-top">
            <strong>Trust documents</strong>
            <span>public</span>
          </div>
          ${trustDocRow("Security model", "What pr-captcha signs, verifies, stores, rate limits, and refuses to execute.", "/security.md", "ready")}
          ${trustDocRow("Privacy", "What metadata is processed for GitHub App, OAuth, Turnstile, and D1 verification records.", "/privacy.md", "ready")}
          ${trustDocRow("Terms", "Beta use terms for maintainers testing the service before a broader public traffic.", "/terms.md", "beta")}
          ${trustDocRow("Abuse reporting", "How maintainers and contributors report bypass attempts, harmful installs, and suspicious activity.", "/abuse.md", "ready")}
          ${trustDocRow("Incident process", "How operators triage, disclose, and recover from service or security incidents.", "/incident.md", "ready")}
          ${trustDocRow("Beta policy", "Scope, limits, support expectation, and best-effort beta language for closed beta repositories.", "/beta.md", "beta")}
          ${trustDocRow("Support path", "Where maintainers ask setup questions, report bugs, and request production help.", "/support.md", "beta")}
        </div>
        <aside class="trust-rail">
          <div class="panel-top">
            <strong>Launch blockers</strong>
            <span>external</span>
          </div>
          <ul class="trust-checklist">
            <li data-state="ready"><strong>Public docs</strong><span>Trust, setup, operations, GitHub App, and config docs are in the Worker asset bundle.</span></li>
            <li data-state="beta"><strong>Support mailbox</strong><span>Use GitHub issues during beta. Add a dedicated support mailbox before broader public traffic.</span></li>
            <li data-state="beta"><strong>Security advisory path</strong><span>Use GitHub private vulnerability reporting or a dedicated security mailbox before public launch.</span></li>
            <li data-state="blocked"><strong>Production accounts</strong><span>Cloudflare Worker, D1, Turnstile, GitHub App, and OAuth secrets are still required.</span></li>
          </ul>
          <div class="trust-actions">
            <a class="button primary" href="${GITHUB_APP_INSTALL_URL}">Install free</a>
            <a class="button light" href="/status">Check readiness</a>
          </div>
        </aside>
      </section>
    </main>`,
    {
      title: "Trust Center",
      description:
        "Public security, privacy, terms, incident, abuse, support, and beta-policy documents for pr-captcha.",
      canonicalUrl: baseUrl ? `${baseUrl}/trust` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderSetupWizardPage(baseUrl?: string): string {
  return layout(
    "Choose a policy",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span><span class="tag">free · hosted</span></a>
      <nav class="site-nav" aria-label="Primary navigation"><a href="/">Home</a><a href="/demo">Demo</a><a href="/evidence">Evidence</a><a href="/setup-wizard">Setup</a><a href="/trust">Trust</a><a href="https://github.com/aryabyte21/pr-captcha">GitHub</a></nav>
      <span class="header-actions"><button class="header-tg" id="theme" type="button" aria-label="Toggle light or dark">☀</button><a class="button dark header-cta" href="${GITHUB_APP_INSTALL_URL}">Install free</a></span>
    </header>
    <main id="main" class="preview-page">
      <section class="preview-heading">
        <div>
          <p class="eyebrow">One file, one check</p>
          <h1>Create your repository policy.</h1>
          <p>Pick a repo, choose who verifies, then copy <code>.github/pr-captcha.yml</code>. Start with fork, first-time, outside, and bot PRs.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Scan first</span>
          <span><span class="mini-shield">✓</span>Copy YAML</span>
          <span><span class="mini-shield">✓</span>Test before protecting</span>
        </div>
      </section>
      <section class="wizard-shell" aria-label="pr-captcha setup wizard">
        <form class="wizard-options" data-setup-wizard>
          <div class="panel-top">
            <strong>Guided policy</strong>
            <span>start here</span>
          </div>
          <fieldset class="wizard-group wizard-repository-group">
            <legend>Scan repository</legend>
            <label class="wizard-field wizard-repository-field">
              <span>GitHub repository</span>
              <input name="repository" value="kubernetes/kubernetes" autocomplete="off" data-wizard-repository />
            </label>
            <button class="button primary compact" type="button" data-wizard-scan>Scan public evidence</button>
            <div class="wizard-evidence" data-wizard-evidence data-risk="waiting">
              <div class="wizard-evidence-head">
                <strong data-wizard-recommendation>Scan first, then choose where the required check should apply.</strong>
                <span data-wizard-evidence-status>waiting</span>
              </div>
              <dl>
                <div><dt>Open PRs</dt><dd data-wizard-evidence-open>scan</dd></div>
                <div><dt>Fork pressure</dt><dd data-wizard-evidence-fork>scan</dd></div>
                <div><dt>Unknown authors</dt><dd data-wizard-evidence-unknown>scan</dd></div>
                <div><dt>Bot PRs</dt><dd data-wizard-evidence-bots>scan</dd></div>
                <div><dt>Stale PRs</dt><dd data-wizard-evidence-stale>scan</dd></div>
                <div><dt>Spam labels</dt><dd data-wizard-evidence-spam>scan</dd></div>
              </dl>
            </div>
            <div class="wizard-handoff" aria-label="Repository-aware setup links">
              <a data-wizard-link="evidence" href="/evidence?repo=kubernetes%2Fkubernetes">Evidence</a>
            </div>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Pick gate mode</legend>
            <label class="wizard-choice"><input type="radio" name="mode" value="hybrid" checked /><span><strong>Recommended default</strong><small>Creates the check, supports fork release, and can gate workflows later.</small></span></label>
            <label class="wizard-choice"><input type="radio" name="mode" value="native_fork" /><span><strong>Release held fork runs</strong><small>Use when GitHub already holds fork workflows.</small></span></label>
            <label class="wizard-choice"><input type="radio" name="mode" value="universal" /><span><strong>Gate heavy workflows</strong><small>Run a tiny job before expensive CI.</small></span></label>
            <label class="wizard-choice"><input type="radio" name="mode" value="required_check" /><span><strong>Check only</strong><small>Use branch protection without workflow release.</small></span></label>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Choose PR targets</legend>
            <label class="wizard-choice compact"><input type="checkbox" name="all_pull_requests" /><span><strong>Every PR</strong><small>Use after a pilot, not as the first install.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="first_time_contributors" checked /><span><strong>First-time contributors</strong><small>New people without repo history.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="outside_contributors" checked /><span><strong>Outside contributors</strong><small>Not an owner, member, or collaborator.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="fork_prs" checked /><span><strong>Fork PRs</strong><small>Pull requests from forks.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="bots" checked /><span><strong>Bots</strong><small>Bot-authored pull requests.</small></span></label>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Decide what happens</legend>
            <label class="wizard-choice compact"><input type="checkbox" name="require_pr_author" checked /><span><strong>Require PR author</strong><small>The contributor must solve their own check.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="maintainer_override" /><span><strong>Allow maintainer override</strong><small>Trusted maintainers may verify when needed.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="create_required_check" checked /><span><strong>Create required check</strong><small>Publish pr-captcha/human.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="post_comment" checked /><span><strong>Comment on the PR</strong><small>Contributor gets the verification link.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="rerun_after_verification" checked /><span><strong>Rerun gated workflow</strong><small>Useful when heavy jobs wait on the check.</small></span></label>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Skip trusted traffic</legend>
            <label class="wizard-field"><span>Skip authors</span><input name="skip_authors" value="" /></label>
            <label class="wizard-field"><span>Skip labels</span><input name="skip_labels" value="trusted-contributor, no-captcha" /></label>
          </fieldset>
        </form>
        <div class="wizard-output">
          <div class="workflow-panel">
            <div class="panel-top">
              <strong>.github/pr-captcha.yml</strong>
              <span>generated policy</span>
            </div>
            <pre><code data-wizard-yaml>${escapeHtml(configPreviewExampleYaml())}</code></pre>
            <div class="preview-actions">
              <button class="button primary" type="button" data-generate-policy>Generate policy</button>
              <button class="button light" type="button" data-copy-yaml>Copy YAML</button>
              <button class="button light" type="button" data-preview-generated>Preview generated YAML</button>
            </div>
          </div>
          <div class="wizard-install-grid">
            <section class="preview-card wizard-install-card">
              <div class="install-card-head">
                <div>
                  <h2>Branch protection</h2>
                  <p>Use this checklist only after a fork PR rehearsal passes.</p>
                </div>
                <span data-wizard-branch-state>waiting</span>
              </div>
              <ul class="install-checklist" data-wizard-branch-protection>
                <li><strong>Commit policy</strong><span>.github/pr-captcha.yml on the default branch.</span></li>
                <li><strong>Require check</strong><span>pr-captcha/human after the first solved fork PR.</span></li>
                <li><strong>Keep rollback simple</strong><span>Remove one required check if the pilot is noisy.</span></li>
              </ul>
            </section>
            <section class="preview-card wizard-install-card">
              <div class="install-card-head">
                <div>
                  <h2>Workflow guard</h2>
                  <p>Copy this before heavy CI jobs when workflow mode is active.</p>
                </div>
                <button class="button light compact" type="button" data-copy-workflow-guard>Copy workflow</button>
              </div>
              <pre class="status-json install-code"><code data-wizard-workflow>${escapeHtml(setupWizardWorkflowGuardYaml(baseUrl))}</code></pre>
            </section>
            <section class="preview-card wizard-install-card wide">
              <div class="install-card-head">
                <div>
                  <h2>Acceptance proof</h2>
                  <p>Paste this into the pilot issue after the rehearsal is green.</p>
                </div>
                <button class="button light compact" type="button" data-copy-acceptance-proof>Copy proof</button>
              </div>
              <pre class="status-json install-code" data-wizard-acceptance>${escapeHtml(setupWizardAcceptanceProof("kubernetes/kubernetes"))}</pre>
            </section>
          </div>
          <div class="preview-output">
            <div class="preview-status" data-wizard-status>
              <span class="mini-shield">✓</span>
              <div>
                <strong>Ready for branch protection</strong>
                <p>Generate policy to confirm the exact install consequences.</p>
              </div>
            </div>
            <section class="preview-card">
              <h2>Install consequences</h2>
              <dl data-wizard-summary>
                <div><dt>Mode</dt><dd>hybrid</dd></div>
                <div><dt>Required check</dt><dd>pr-captcha/human</dd></div>
                <div><dt>Comment</dt><dd>enabled</dd></div>
                <div><dt>Workflow gate</dt><dd>rerun after verification</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Diagnostics</h2>
              <ul class="diagnostic-list" data-wizard-diagnostics>
                <li data-level="info"><strong>Ready</strong><span>Generate policy and preview before committing.</span></li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${setupWizardScript(baseUrl)}`,
    {
      title: "Setup wizard",
      description:
        "Generate a safe pr-captcha repository policy and preview the effective human-origin gate.",
      canonicalUrl: baseUrl ? `${baseUrl}/setup-wizard` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderStatusPage(baseUrl?: string): string {
  return layout(
    "pr-captcha status",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span><span class="tag">free · hosted</span></a>
      <nav class="site-nav" aria-label="Primary navigation"><a href="/">Home</a><a href="/demo">Demo</a><a href="/evidence">Evidence</a><a href="/setup-wizard">Setup</a><a href="/trust">Trust</a><a href="https://github.com/aryabyte21/pr-captcha">GitHub</a></nav>
      <span class="header-actions"><button class="header-tg" id="theme" type="button" aria-label="Toggle light or dark">☀</button><a class="button dark header-cta" href="${GITHUB_APP_INSTALL_URL}">Install free</a></span>
    </header>
    <main id="main" class="preview-page">
      <section class="preview-heading">
        <div>
          <p class="eyebrow">Public service health</p>
          <h1>Is the little gate awake?</h1>
          <p>Check the hosted Worker, database binding, and readiness endpoint before you ask a repository to depend on <code>pr-captcha/human</code>.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Worker awake</span>
          <span><span class="mini-shield">✓</span>D1 connected</span>
          <span><span class="mini-shield">✓</span>Readiness probed</span>
        </div>
      </section>
      <section class="status-shell" aria-label="pr-captcha service status">
        <div class="status-board">
          <div class="panel-top">
            <strong>Public gate checks</strong>
            <span data-status-checked>checking now</span>
          </div>
          <div class="status-list">
            ${statusTile("worker", "Worker heartbeat", "Confirms the public Worker responds.")}
            ${statusTile("ready", "Readiness", "Confirms the service reports ready.")}
            ${statusTile("database", "D1 database", "Verifies the database binding is queryable.")}
          </div>
          <div class="diagnostics-actions">
            <button class="button primary" type="button" data-refresh-status>Refresh status</button>
          </div>
        </div>
        <div class="status-output">
          <div class="preview-output" aria-live="polite">
            <div class="preview-status" data-status-overall>
              <span class="mini-shield">✓</span>
              <div>
                <strong>Checking service</strong>
                <p>Loading public health checks.</p>
              </div>
            </div>
            <section class="preview-card">
              <h2>Readiness details</h2>
              <dl data-status-details>
                <div><dt>Worker</dt><dd>checking</dd></div>
                <div><dt>Readiness</dt><dd>checking</dd></div>
                <div><dt>D1 database</dt><dd>checking</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Next action</h2>
              <ul class="diagnostic-list" data-status-actions>
                <li data-level="info"><strong>Checking</strong><span>Waiting for health responses.</span></li>
              </ul>
            </section>
            <section class="preview-card">
              <h2>Response payload</h2>
              <pre class="status-json" data-status-json>{}</pre>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${statusPageScript()}`,
    {
      title: "Gate status",
      description:
        "Public pr-captcha status page for Worker heartbeat, readiness, and D1 database checks.",
      canonicalUrl: baseUrl ? `${baseUrl}/status` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

function liveCountScript(): string {
  return `<script>
    (function () {
      var root = document.querySelector("[data-pr-counts]");
      if (!root) return;
      var status = document.querySelector("[data-pr-count-status]");
      var formatter = new Intl.NumberFormat("en-US");
      fetch("/api/public/pr-counts", { headers: { Accept: "application/json" } })
        .then(function (response) {
          if (!response.ok) throw new Error("count fetch failed");
          return response.json();
        })
        .then(function (payload) {
          var liveCount = 0;
          payload.repos.forEach(function (item) {
            if (item.live) liveCount += 1;
            var card = root.querySelector('[data-pr-count-repo="' + item.repo + '"]');
            if (!card) return;
            var value = card.querySelector("[data-pr-count]");
            var source = card.querySelector("[data-pr-count-source]");
            if (value) value.textContent = formatter.format(item.open_prs);
            if (source) source.textContent = item.live ? "live from GitHub" : "fallback snapshot";
          });
          if (status && payload.as_of) {
            var date = new Date(payload.as_of);
            status.textContent =
              liveCount === payload.repos.length
                ? "Live open-PR counts from GitHub"
                : liveCount > 0
                  ? "Mixed live and snapshot PR counts"
                  : "Open-PR count snapshots";
            status.setAttribute("title", "Checked " + date.toLocaleString());
          }
        })
        .catch(function () {
          if (status) status.textContent = "Open-PR count snapshots";
        });
    })();
  </script>`;
}

function copyWorkflowScript(): string {
  return `<script>
    (function () {
      var button = document.querySelector("[data-copy-workflow]");
      var source = document.querySelector("[data-workflow-source]");
      if (!button || !source || !navigator.clipboard) return;
      var defaultLabel = button.textContent || "Copy workflow gate";
      var reset = function () {
        button.textContent = defaultLabel;
        button.removeAttribute("data-copied");
      };
      button.addEventListener("click", function () {
        navigator.clipboard.writeText(source.textContent || "").then(function () {
          button.textContent = "Copied";
          button.setAttribute("data-copied", "true");
          window.setTimeout(reset, 1800);
        }).catch(function () {
          button.textContent = "Copy failed";
          window.setTimeout(reset, 1800);
        });
      });
    })();
  </script>`;
}

function homeMotionScript(): string {
  return `<script>
    (function () {
      var targets = Array.prototype.slice.call(document.querySelectorAll(".motion-reveal, .queue-stat, .proof-card"));
      if (!targets.length) return;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !("IntersectionObserver" in window)) {
        targets.forEach(function (target) {
          target.classList.add("is-visible");
        });
        return;
      }
      document.documentElement.classList.add("motion-ready");
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
      targets.forEach(function (target, index) {
        target.style.setProperty("--reveal-delay", String(Math.min(index * 45, 240)) + "ms");
        observer.observe(target);
      });
    })();
  </script>`;
}

function demoPageScript(): string {
  const steps = [
    {
      label: "PR opened",
      title: "AI-slop PR waiting",
      body: "A PR opened under an enabled target. CI is held until the exact head SHA has a human-origin signal.",
      status: "warning",
      icon: "!",
      ciState: "held",
      ciLabel: "Held",
      ciBody: "Fork workflow is held before the held workflow starts.",
      checkState: "waiting",
      checkLabel: "Waiting",
      checkBody: "Waiting for the contributor to verify this exact SHA.",
      comment:
        "Open the verification link to prove a GitHub-authenticated human is present for commit 8f31c9a.",
      audit: [
        [
          "warning",
          "gate.pending",
          "Waiting on human-origin proof for 8f31c9a.",
        ],
      ],
    },
    {
      label: "Gate created",
      title: "Gate bound to 8f31c9a",
      body: "pr-captcha created the check run and comment. The verification URL only applies to this repository, PR number, author, and head SHA.",
      status: "warning",
      icon: "!",
      ciState: "held",
      ciLabel: "Held",
      ciBody: "No untrusted patch has reached a runner.",
      checkState: "waiting",
      checkLabel: "Waiting",
      checkBody: "Required check is present but not satisfied.",
      comment:
        "Verification link is live for drive-by-user and commit 8f31c9a.",
      audit: [
        [
          "info",
          "gate.created",
          "Created SHA-bound gate for open-source/app#184.",
        ],
        [
          "info",
          "comment.upserted",
          "One persistent PR comment points to the gate.",
        ],
        [
          "warning",
          "check.waiting",
          "pr-captcha/human is waiting on verification.",
        ],
      ],
    },
    {
      label: "Human verified",
      title: "GitHub user verified",
      body: "The contributor completed GitHub OAuth and Turnstile. The solver identity matches the configured policy for this PR.",
      status: "ready",
      icon: "✓",
      ciState: "held",
      ciLabel: "Held",
      ciBody: "CI remains held until the signal is published.",
      checkState: "verified",
      checkLabel: "Verified",
      checkBody: "Human-origin proof exists for 8f31c9a.",
      comment:
        "Verification succeeded for drive-by-user. Publishing the human-origin signal now.",
      audit: [
        [
          "info",
          "gate.created",
          "Created SHA-bound gate for open-source/app#184.",
        ],
        [
          "success",
          "gate.solved",
          "GitHub login and Turnstile matched policy.",
        ],
        ["success", "verification.stored", "Stored proof for commit 8f31c9a."],
      ],
    },
    {
      label: "Check passed",
      title: "Exact SHA approved",
      body: "The check is green for 8f31c9a. A new commit would require a new verification before it can inherit trust.",
      status: "ready",
      icon: "✓",
      ciState: "ready",
      ciLabel: "Released",
      ciBody: "Held fork workflow can now run under GitHub policy.",
      checkState: "ready",
      checkLabel: "Passed",
      checkBody: "pr-captcha/human passed for the exact head SHA.",
      comment:
        "The PR has a human-origin signal for 8f31c9a. New commits must verify again.",
      audit: [
        [
          "info",
          "gate.created",
          "Created SHA-bound gate for open-source/app#184.",
        ],
        [
          "success",
          "gate.solved",
          "GitHub login and Turnstile matched policy.",
        ],
        ["success", "check.published", "pr-captcha/human passed for 8f31c9a."],
        [
          "success",
          "workflow.released",
          "Matching held workflow runs were approved.",
        ],
      ],
    },
  ];
  return `<script>
    (function () {
      var steps = ${JSON.stringify(steps)};
      var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-demo-step]"));
      var replay = document.querySelector("[data-demo-replay]");
      var verify = document.querySelector("[data-demo-verify]");
      var copy = document.querySelector("[data-copy-check]");
      var copySource = document.querySelector("[data-copy-check-source]");
      var policyCopies = Array.prototype.slice.call(document.querySelectorAll("[data-copy-demo-policy]"));
      var policySource = document.querySelector("[data-demo-policy]");
      var stageLabel = document.querySelector("[data-demo-stage-label]");
      var status = document.querySelector("[data-demo-status]");
      var statusIcon = document.querySelector("[data-demo-status-icon]");
      var title = document.querySelector("[data-demo-title]");
      var body = document.querySelector("[data-demo-body]");
      var ci = document.querySelector("[data-demo-ci]");
      var ciLabel = document.querySelector("[data-demo-ci-label]");
      var ciBody = document.querySelector("[data-demo-ci-body]");
      var check = document.querySelector("[data-demo-human-check]");
      var checkLabel = document.querySelector("[data-demo-check-label]");
      var checkBody = document.querySelector("[data-demo-check-body]");
      var commentBody = document.querySelector("[data-demo-comment-body]");
      var audit = document.querySelector("[data-demo-audit]");
      var active = 0;
      var timer = null;
      var replayLabel = replay ? replay.textContent || "Run gate simulation" : "Run gate simulation";
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function renderAudit(items) {
        if (!audit) return;
        audit.innerHTML = items.map(function (item) {
          return '<div data-level="' + escapeHtml(item[0]) + '"><strong>' + escapeHtml(item[1]) + "</strong><span>" + escapeHtml(item[2]) + "</span></div>";
        }).join("");
      }
      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function setStep(index) {
        active = Math.max(0, Math.min(steps.length - 1, index));
        var step = steps[active];
        buttons.forEach(function (button) {
          var isActive = button.getAttribute("data-demo-step") === String(active);
          if (isActive) {
            button.setAttribute("data-active", "true");
            button.setAttribute("aria-pressed", "true");
          } else {
            button.removeAttribute("data-active");
            button.setAttribute("aria-pressed", "false");
          }
        });
        if (status) status.setAttribute("data-state", step.status);
        if (ci) ci.setAttribute("data-state", step.ciState);
        if (check) check.setAttribute("data-state", step.checkState);
        setText(stageLabel, step.label);
        setText(statusIcon, step.icon);
        setText(title, step.title);
        setText(body, step.body);
        setText(ciLabel, step.ciLabel);
        setText(ciBody, step.ciBody);
        setText(checkLabel, step.checkLabel);
        setText(checkBody, step.checkBody);
        setText(commentBody, step.comment);
        renderAudit(step.audit);
      }
      function replaySteps() {
        if (timer) window.clearInterval(timer);
        setStep(0);
        if (replay) replay.textContent = "Playing";
        timer = window.setInterval(function () {
          if (active >= steps.length - 1) {
            window.clearInterval(timer);
            timer = null;
            if (replay) replay.textContent = replayLabel;
            return;
          }
          setStep(active + 1);
          if (active >= steps.length - 1) {
            window.clearInterval(timer);
            timer = null;
            if (replay) replay.textContent = replayLabel;
          }
        }, 1100);
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          if (timer) {
            window.clearInterval(timer);
            timer = null;
            if (replay) replay.textContent = replayLabel;
          }
          setStep(Number(button.getAttribute("data-demo-step") || "0"));
        });
      });
      if (replay) replay.addEventListener("click", replaySteps);
      if (verify) verify.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
          if (replay) replay.textContent = replayLabel;
        }
        setStep(2);
      });
      if (copy && copySource) {
        copy.addEventListener("click", function () {
          var value = copySource.textContent || "pr-captcha/human";
          var finish = function (label) {
            copy.textContent = label;
            window.setTimeout(function () {
              copy.textContent = "Copy";
            }, 1500);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(value).then(function () {
              finish("Copied");
            }).catch(function () {
              finish("Copy failed");
            });
          } else {
            finish("Copy unavailable");
          }
        });
      }
      if (policySource) {
        policyCopies.forEach(function (button) {
          button.addEventListener("click", function () {
            var original = button.textContent || "Copy install config";
            var value = policySource.textContent || "";
            var finish = function (label) {
              button.textContent = label;
              window.setTimeout(function () {
                button.textContent = original;
              }, 1500);
            };
            if (navigator.clipboard) {
              navigator.clipboard.writeText(value).then(function () {
                finish("Copied");
              }).catch(function () {
                finish("Copy failed");
              });
            } else {
              finish("Copy unavailable");
            }
          });
        });
      }
      setStep(0);
    })();
  </script>`;
}

function evidenceScannerScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-evidence-form]");
      var input = document.querySelector("[data-evidence-repo]");
      var run = document.querySelector("[data-evidence-run]");
      var copy = document.querySelector("[data-evidence-copy]");
      var status = document.querySelector("[data-evidence-status]");
      var recommendation = document.querySelector("[data-evidence-recommendation]");
      var recommendationTitle = document.querySelector("[data-evidence-recommendation-title]");
      var recommendationCard = document.querySelector("[data-evidence-risk]");
      var repository = document.querySelector("[data-evidence-repository]");
      var generated = document.querySelector("[data-evidence-generated]");
      var quality = document.querySelector("[data-evidence-quality]");
      var sample = document.querySelector("[data-evidence-sample]");
      var list = document.querySelector("[data-evidence-prs]");
      var empty = document.querySelector("[data-evidence-empty]");
      var summary = document.querySelector("[data-evidence-summary]");
      var reportStatus = document.querySelector("[data-evidence-report-status]");
      var link = document.querySelector("[data-evidence-link]");
      var copyLink = document.querySelector("[data-evidence-copy-link]");
      var brief = document.querySelector("[data-evidence-brief]");
      var briefStatus = document.querySelector("[data-evidence-brief-status]");
      var copyBrief = document.querySelector("[data-evidence-copy-brief]");
      var latestReport = "";
      var latestBrief = "";
      if (!form || !input || !list || !summary) return;

      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        var copied = false;
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          copied = document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function metric(id, value, detail) {
        setText(document.querySelector("[data-evidence-" + id + "]"), value);
        setText(document.querySelector("[data-evidence-" + id + "-detail]"), detail);
      }
      function repoValue() {
        return String(input.value || "").trim();
      }
      function reportUrl(repo) {
        var url = new URL(window.location.href);
        url.pathname = "/evidence";
        url.search = "";
        url.searchParams.set("repo", repo);
        return url.toString();
      }
      function updateReportUrl(repo, replaceHistory) {
        var url = reportUrl(repo);
        if (link) link.value = url;
        if (replaceHistory && window.history && window.history.replaceState) {
          var parsed = new URL(url);
          window.history.replaceState({}, "", parsed.pathname + parsed.search);
        }
        return url;
      }
      function statusText(value) {
        setText(status, value);
        if (run) run.textContent = value === "scanning" ? "Scanning" : "Run live scan";
      }
      function setPreset(repo) {
        Array.prototype.slice.call(document.querySelectorAll("[data-evidence-preset]")).forEach(function (button) {
          var active = button.getAttribute("data-evidence-preset") === repo;
          if (active) {
            button.setAttribute("data-active", "true");
            button.setAttribute("aria-pressed", "true");
          } else {
            button.removeAttribute("data-active");
            button.setAttribute("aria-pressed", "false");
          }
        });
      }
      function badge(text, tone) {
        var span = document.createElement("span");
        span.className = "evidence-badge";
        span.setAttribute("data-tone", tone);
        span.textContent = text;
        return span;
      }
      function renderPulls(pulls) {
        list.textContent = "";
        if (empty) empty.hidden = pulls.length > 0;
        pulls.slice(0, 8).forEach(function (pull) {
          var item = document.createElement("li");
          item.className = "evidence-pr-row";
          var title = document.createElement("a");
          title.href = pull.url;
          title.target = "_blank";
          title.rel = "noreferrer";
          title.textContent = "#" + pull.number + " " + pull.title;
          var meta = document.createElement("div");
          meta.className = "evidence-pr-meta";
          meta.appendChild(badge(pull.author_association || "NONE", pull.author_association === "MEMBER" || pull.author_association === "OWNER" || pull.author_association === "COLLABORATOR" ? "ready" : "warning"));
          if (pull.is_fork) meta.appendChild(badge("fork", "warning"));
          if (pull.is_bot) meta.appendChild(badge("bot", "muted"));
          if (pull.age_days >= 14) meta.appendChild(badge(String(pull.age_days) + "d old", "danger"));
          if (Array.isArray(pull.labels)) {
            pull.labels.slice(0, 2).forEach(function (label) {
              meta.appendChild(badge(label, "muted"));
            });
          }
          var author = document.createElement("span");
          author.className = "evidence-author";
          author.textContent = pull.author || "unknown";
          item.appendChild(title);
          item.appendChild(author);
          item.appendChild(meta);
          list.appendChild(item);
        });
      }
      function reportText(data, url) {
        var labels = (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
        return [
          "pr-captcha repo evidence",
          "Repository: " + data.repository,
          "Report: " + url,
          "Open PRs: " + formatNumber(data.open_pull_requests),
          "Recent sample: " + formatNumber(data.sample_size) + " PRs",
          "Fork PRs in sample: " + formatNumber(data.fork_pull_requests),
          "Unknown authors in sample: " + formatNumber(data.unknown_authors),
          "Stale PRs in sample: " + formatNumber(data.stale_pull_requests),
          "Spam or invalid label matches: " + formatNumber(labels),
          "Risk: " + data.risk_level,
          "Recommendation: " + data.recommendation
        ].join("\\n");
      }
      function appLink(path, repo) {
        var url = new URL(path, window.location.origin);
        if (repo) url.searchParams.set("repo", repo);
        return url.toString();
      }
      function policyText(data) {
        if (data.risk_level === "high") {
          return "Require pr-captcha/human on fork PRs and outside contributors before maintainer review starts.";
        }
        if (data.risk_level === "medium") {
          return "Gate fork PRs and first-time contributors while trusted maintainers keep the fast path.";
        }
        return "Start in advisory mode, collect proof, then require the check when queue pressure rises.";
      }
      function sampleLines(data) {
        var pulls = Array.isArray(data.pulls) ? data.pulls.slice(0, 4) : [];
        if (!pulls.length) return ["- No recent PR sample was available from GitHub."];
        return pulls.map(function (pull) {
          var signals = [];
          if (pull.is_fork) signals.push("fork");
          if (pull.author_association) signals.push(pull.author_association);
          if (pull.is_bot) signals.push("bot");
          if (pull.age_days >= 14) signals.push(String(pull.age_days) + "d old");
          if (Array.isArray(pull.labels) && pull.labels.length) {
            signals = signals.concat(pull.labels.slice(0, 2));
          }
          return "- #" + pull.number + " " + pull.title + " by " + (pull.author || "unknown") + " [" + (signals.join(", ") || "no extra signals") + "]";
        });
      }
      function briefText(data, url) {
        var labels = (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
        return [
          "## Add pr-captcha before this PR queue burns CI",
          "",
          "This repository has visible PR triage pressure that a lightweight human gate can absorb before maintainers and CI pick it up.",
          "",
          "- Repository: " + data.repository,
          "- Risk: " + data.risk_level,
          "- Open PRs: " + formatNumber(data.open_pull_requests),
          "- Recent sample: " + formatNumber(data.sample_size) + " PRs",
          "- Fork PRs: " + formatNumber(data.fork_pull_requests),
          "- Unknown authors: " + formatNumber(data.unknown_authors),
          "- Bot PRs: " + formatNumber(data.bot_pull_requests),
          "- Stale PRs: " + formatNumber(data.stale_pull_requests),
          "- Spam or invalid label matches: " + formatNumber(labels),
          "",
          "Recommended policy",
          policyText(data),
          "",
          "Evidence sample",
          sampleLines(data).join("\\n"),
          "",
          "Next steps",
          "1. Review the live report: " + url,
          "2. Generate the policy: " + appLink("/setup-wizard", data.repository),
          "3. Test the gate flow: " + appLink("/demo"),
          "4. Install the app: https://github.com/apps/pr-captcha/installations/new",
        ].join("\\n");
      }
      function renderEvidence(data) {
        var labels = (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
        var url = updateReportUrl(data.repository, true);
        input.value = data.repository;
        setPreset(data.repository);
        setText(repository, data.repository);
        setText(generated, new Date(data.generated_at).toLocaleString());
        setText(quality, data.partial ? "partial" : "live");
        setText(sample, formatNumber(data.sample_size) + " recent PRs");
        setText(recommendationTitle, data.risk_level === "high" ? "Recommended gate: required" : data.risk_level === "medium" ? "Recommended gate: hybrid" : "Recommended gate: audit first");
        setText(recommendation, data.recommendation);
        if (recommendationCard) recommendationCard.setAttribute("data-evidence-risk", data.risk_level);
        metric("open", formatNumber(data.open_pull_requests), data.live ? "Live GitHub count" : "GitHub count unavailable");
        metric("fork", formatNumber(data.fork_pull_requests), "Recent sample from forks");
        metric("unknown", formatNumber(data.unknown_authors), "Outside trusted associations");
        metric("stale", formatNumber(data.stale_pull_requests), "Open for at least 14 days");
        metric("labels", data.spam_label_matches === null && data.invalid_label_matches === null ? "limited" : formatNumber(labels), "Spam plus invalid label matches");
        metric("bots", formatNumber(data.bot_pull_requests), "Bot accounts in sample");
        renderPulls(Array.isArray(data.pulls) ? data.pulls : []);
        latestReport = reportText(data, url);
        latestBrief = briefText(data, url);
        summary.textContent = latestReport;
        if (brief) brief.textContent = latestBrief;
        setText(reportStatus, data.partial ? "partial" : "ready");
        setText(briefStatus, data.partial ? "partial" : "ready");
      }
      function renderError(message) {
        metric("open", "failed", "GitHub evidence unavailable");
        metric("fork", "failed", "Try another repository");
        metric("unknown", "failed", "Try again later");
        metric("stale", "failed", "No sample loaded");
        metric("labels", "failed", "Search unavailable");
        metric("bots", "failed", "No sample loaded");
        setText(recommendationTitle, "Scan failed");
        setText(recommendation, message);
        setText(quality, "failed");
        setText(sample, "no sample");
        setText(reportStatus, "failed");
        if (empty) empty.hidden = false;
        list.textContent = "";
        latestReport = "pr-captcha repo evidence\\nReport: " + updateReportUrl(repoValue() || "godotengine/godot", false) + "\\nScan failed: " + message;
        latestBrief = "## pr-captcha evidence scan failed\\n\\n- Report: " + updateReportUrl(repoValue() || "godotengine/godot", false) + "\\n- Error: " + message + "\\n\\nRetry the scan before asking maintainers to adopt a required check.";
        summary.textContent = latestReport;
        if (brief) brief.textContent = latestBrief;
        setText(briefStatus, "failed");
      }
      async function scan() {
        var repo = repoValue();
        if (!repo) {
          renderError("Enter a GitHub repository.");
          return;
        }
        statusText("scanning");
        if (run) run.disabled = true;
        try {
          var response = await fetch("/api/public/repo-evidence?repo=" + encodeURIComponent(repo), { headers: { Accept: "application/json" } });
          var data = await response.json();
          if (!response.ok) {
            throw new Error(data && data.error ? data.error : "Scan failed");
          }
          renderEvidence(data);
          statusText(data.partial ? "partial" : "ready");
        } catch (error) {
          renderError(error && error.message ? error.message : "Scan failed");
          statusText("failed");
        } finally {
          if (run) run.disabled = false;
        }
      }
      Array.prototype.slice.call(document.querySelectorAll("[data-evidence-preset]")).forEach(function (button) {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function () {
          input.value = button.getAttribute("data-evidence-preset") || "godotengine/godot";
          scan();
        });
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        scan();
      });
      if (run) run.addEventListener("click", scan);
      if (copy) {
        copy.addEventListener("click", function () {
          var value = latestReport || summary.textContent || "";
          var finish = function (label) {
            copy.textContent = label;
            window.setTimeout(function () {
              copy.textContent = "Copy report";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied report");
          }).catch(function () {
            finish("Copy failed");
          });
        });
      }
      if (copyLink) {
        copyLink.addEventListener("click", function () {
          var value = link ? link.value : updateReportUrl(repoValue() || "godotengine/godot", false);
          var finish = function (label) {
            copyLink.textContent = label;
            window.setTimeout(function () {
              copyLink.textContent = "Copy link";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied");
          }).catch(function () {
            finish("Copy failed");
          });
        });
      }
      if (copyBrief) {
        copyBrief.addEventListener("click", function () {
          var value = latestBrief || (brief ? brief.textContent : "") || "";
          var finish = function (label) {
            copyBrief.textContent = label;
            window.setTimeout(function () {
              copyBrief.textContent = "Copy maintainer brief";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied brief");
          }).catch(function () {
            finish("Copy failed");
          });
        });
      }
      updateReportUrl(repoValue() || "godotengine/godot", false);
      window.setTimeout(scan, 0);
    })();
  </script>`;
}

function setupWizardScript(baseUrl?: string): string {
  return `<script>
    (function () {
      var workerUrl = ${JSON.stringify(baseUrl ?? "https://<worker-domain>")};
      var form = document.querySelector("[data-setup-wizard]");
      var yaml = document.querySelector("[data-wizard-yaml]");
      var generateButton = document.querySelector("[data-generate-policy]");
      var copyButton = document.querySelector("[data-copy-yaml]");
      var previewButton = document.querySelector("[data-preview-generated]");
      var status = document.querySelector("[data-wizard-status]");
      var summary = document.querySelector("[data-wizard-summary]");
      var diagnostics = document.querySelector("[data-wizard-diagnostics]");
      var repositoryInput = document.querySelector("[data-wizard-repository]");
      var scanButton = document.querySelector("[data-wizard-scan]");
      var evidence = document.querySelector("[data-wizard-evidence]");
      var evidenceStatus = document.querySelector("[data-wizard-evidence-status]");
      var recommendation = document.querySelector("[data-wizard-recommendation]");
      var branchProtection = document.querySelector("[data-wizard-branch-protection]");
      var branchState = document.querySelector("[data-wizard-branch-state]");
      var workflowGuard = document.querySelector("[data-wizard-workflow]");
      var acceptanceProof = document.querySelector("[data-wizard-acceptance]");
      var copyWorkflowGuard = document.querySelector("[data-copy-workflow-guard]");
      var copyAcceptanceProof = document.querySelector("[data-copy-acceptance-proof]");
      if (!form || !yaml || !generateButton || !status || !summary || !diagnostics) return;

      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function selectedValue(name) {
        var input = form.querySelector('[name="' + name + '"]:checked');
        return input ? input.value : "";
      }
      function checked(name) {
        var input = form.querySelector('[name="' + name + '"]');
        return Boolean(input && input.checked);
      }
      function inputValue(name) {
        var input = form.querySelector('[name="' + name + '"]');
        return input ? input.value : "";
      }
      function repoValue() {
        return repositoryInput && repositoryInput.value.trim() ? repositoryInput.value.trim() : "kubernetes/kubernetes";
      }
      function repoParts(value) {
        var cleaned = String(value || "kubernetes/kubernetes")
          .trim()
          .replace(/^https?:\\/\\/github\\.com\\//i, "")
          .replace(/^github\\.com\\//i, "")
          .replace(/^\\/+|\\/+$/g, "")
          .replace(/\\.git$/i, "");
        var parts = cleaned.split("/");
        return {
          owner: parts[0] || "kubernetes",
          repo: parts[1] || "kubernetes"
        };
      }
      function setMetric(name, value) {
        var node = document.querySelector("[data-wizard-evidence-" + name + "]");
        if (node) node.textContent = formatNumber(value);
      }
      function updateHandoffLinks() {
        var repo = repoParts(repoValue());
        var repository = repo.owner + "/" + repo.repo;
        var evidenceLink = document.querySelector('[data-wizard-link="evidence"]');
        if (evidenceLink) evidenceLink.href = "/evidence?repo=" + encodeURIComponent(repository);
      }
      function setMode(mode) {
        var input = form.querySelector('[name="mode"][value="' + mode + '"]');
        if (input) input.checked = true;
      }
      function modeForEvidence(data) {
        if (data.risk_level === "high") return "hybrid";
        if (data.fork_pull_requests > 0) return "native_fork";
        return "required_check";
      }
      function splitList(value) {
        return String(value)
          .split(",")
          .map(function (item) {
            return item.trim();
          })
          .filter(Boolean);
      }
      function yamlString(value) {
        return "'" + String(value).replaceAll("'", "''") + "'";
      }
      function yamlArray(name, values) {
        if (!values.length) return "  " + name + ": []";
        return "  " + name + ":\\n" + values.map(function (value) {
          return "    - " + yamlString(value);
        }).join("\\n");
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy unavailable"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function selectYaml() {
        if (!window.getSelection) return;
        var range = document.createRange();
        range.selectNodeContents(yaml);
        var selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(range);
      }
      function boolLabel(value) {
        return value ? "enabled" : "disabled";
      }
      function branchProtectionState(config) {
        if (!config.checks.create_required_check) return "advisory";
        if (config.mode === "universal") return "workflow";
        return "protect";
      }
      function workflowNeeded(config) {
        return config.mode === "hybrid" || config.mode === "universal";
      }
      function workflowGuardYaml(config) {
        var apiUrl = workerUrl || "https://<worker-domain>";
        return [
          "name: CI",
          "",
          "on:",
          "  pull_request:",
          "",
          "jobs:",
          "  pr-captcha:",
          "    name: pr-captcha / human",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: aryabyte21/pr-captcha/packages/action@v1",
          "        with:",
          "          api-url: " + apiUrl,
          "",
          "  heavy-ci:",
          "    needs: pr-captcha",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - run: npm test"
        ].filter(function (line) {
          return line !== null;
        }).join("\\n");
      }
      function branchRows(config) {
        var repository = repoParts(repoValue()).owner + "/" + repoParts(repoValue()).repo;
        var state = branchProtectionState(config);
        var rows = [
          ["Commit policy", "Add .github/pr-captcha.yml to " + repository + "."],
          ["Install GitHub App", "Grant checks, pull request, issue comment, and workflow permissions."],
          ["Rehearse fork PR", "Open a disposable fork PR and solve the gate as the PR author."],
          ["Require check", config.checks.create_required_check ? "Add " + config.checks.name + " to branch protection." : "Leave branch protection advisory until checks are enabled."],
          ["Workflow guard", workflowNeeded(config) ? "Place the pr-captcha job before heavy CI jobs." : "Optional. Native fork or required-check mode can ship without it."],
          ["Rollback", "Remove " + config.checks.name + " from required checks and keep audit logging on."]
        ];
        if (branchState) branchState.textContent = state;
        return rows;
      }
      function acceptanceText(config) {
        var repo = repoParts(repoValue());
        var repository = repo.owner + "/" + repo.repo;
        return [
          "Repository: " + repository,
          "Policy file: .github/pr-captcha.yml",
          "Mode: " + config.mode,
          "Required check: " + config.checks.name + " (" + boolLabel(config.checks.create_required_check) + ")",
          "Solver: " + (config.require.solver_must_be_pr_author ? "PR author only" : "maintainer override allowed"),
          "Workflow guard: " + (workflowNeeded(config) ? "required before heavy jobs" : "optional"),
          "",
          "Acceptance:",
          "- Signed pull_request webhook creates a pending gate.",
          "- Action fails before the exact head SHA is verified.",
          "- Contributor solves CAPTCHA while logged in to GitHub.",
          "- " + config.checks.name + " is updated to success for the same SHA.",
          "- Action passes after verification.",
          "- Branch protection is enabled only after the fork PR rehearsal passes."
        ].join("\\n");
      }
      function renderInstallHandoff(config) {
        if (branchProtection) {
          branchProtection.innerHTML = branchRows(config).map(function (row) {
            return "<li><strong>" + escapeHtml(row[0]) + "</strong><span>" + escapeHtml(row[1]) + "</span></li>";
          }).join("");
        }
        if (workflowGuard) workflowGuard.textContent = workflowGuardYaml(config);
        if (acceptanceProof) acceptanceProof.textContent = acceptanceText(config);
      }
      function setStatus(ok, title, body) {
        status.setAttribute("data-state", ok ? "ready" : "error");
        status.innerHTML =
          '<span class="mini-shield">' + (ok ? "✓" : "!") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function buildYaml() {
        var mode = selectedValue("mode") || "hybrid";
        var maintainerOverride = checked("maintainer_override");
        return [
          "mode: " + mode,
          "",
          "captcha:",
          "  provider: cloudflare_turnstile",
          "",
          "require:",
          "  github_login: true",
          "  solver_must_be_pr_author: " + String(checked("require_pr_author") && !maintainerOverride),
          "  new_sha_requires_new_captcha: true",
          "",
          "apply_to:",
          "  all_pull_requests: " + String(checked("all_pull_requests")),
          "  first_time_contributors: " + String(checked("first_time_contributors")),
          "  outside_contributors: " + String(checked("outside_contributors")),
          "  fork_prs: " + String(checked("fork_prs")),
          "  bots: " + String(checked("bots")),
          "",
          "skip:",
          yamlArray("authors", splitList(inputValue("skip_authors"))),
          yamlArray("labels", splitList(inputValue("skip_labels"))),
          "",
          "checks:",
          "  create_required_check: " + String(checked("create_required_check") || mode === "required_check"),
          "  name: pr-captcha/human",
          "",
          "comment:",
          "  enabled: " + String(checked("post_comment")),
          "  tone: direct",
          "",
          "universal_gate:",
          "  rerun_after_verification: " + String(checked("rerun_after_verification"))
        ].join("\\n");
      }
      function renderYaml() {
        yaml.textContent = buildYaml();
      }
      function renderEvidence(data) {
        var recommendedMode = modeForEvidence(data);
        setMode(recommendedMode);
        if (evidence) evidence.setAttribute("data-risk", data.risk_level || "medium");
        if (evidenceStatus) evidenceStatus.textContent = data.partial ? "partial" : data.risk_level;
        if (recommendation) recommendation.textContent = data.recommendation || "Repository evidence scanned.";
        setMetric("open", data.open_pull_requests);
        setMetric("fork", data.fork_pull_requests);
        setMetric("unknown", data.unknown_authors);
        setMetric("bots", data.bot_pull_requests);
        setMetric("stale", data.stale_pull_requests);
        setMetric("spam", data.spam_label_matches);
        renderYaml();
        previewGenerated();
      }
      function scanEvidence() {
        if (!scanButton) return;
        updateHandoffLinks();
        scanButton.disabled = true;
        scanButton.textContent = "Scanning";
        if (evidenceStatus) evidenceStatus.textContent = "loading";
        fetch("/api/public/repo-evidence?repo=" + encodeURIComponent(repoValue()), {
          headers: {
            Accept: "application/json"
          }
        }).then(function (response) {
          return response.json().then(function (payload) {
            if (!response.ok) throw new Error(payload.error || "Evidence scan failed");
            return payload;
          });
        }).then(renderEvidence).catch(function (error) {
          if (evidence) evidence.setAttribute("data-risk", "error");
          if (evidenceStatus) evidenceStatus.textContent = "failed";
          if (recommendation) recommendation.textContent = error && error.message ? error.message : "Evidence scan failed.";
        }).finally(function () {
          scanButton.disabled = false;
          scanButton.textContent = "Scan public evidence";
        });
      }
      function renderPreview(payload) {
        var config = payload.config;
        setStatus(
          payload.ok,
          payload.ok ? "Ready for branch protection" : "Fix before branch protection",
          payload.config_valid
            ? "Generated policy parsed successfully."
            : "Generated policy is invalid and defaults would apply."
        );
        summary.innerHTML = [
          ["Mode", config.mode],
          ["Required check", config.checks.name + " (" + boolLabel(config.checks.create_required_check) + ")"],
          ["Comment", boolLabel(config.comment.enabled)],
          ["Workflow gate", config.universal_gate.rerun_after_verification ? "rerun after verification" : "manual rerun"],
          ["Solver", config.require.solver_must_be_pr_author ? "PR author only" : "trusted maintainer override allowed"]
        ].map(function (row) {
          return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
        }).join("");
        diagnostics.innerHTML = payload.diagnostics.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.code) + "</strong><span>" + escapeHtml(item.message) + "</span></li>";
        }).join("");
        renderInstallHandoff(config);
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function previewGenerated() {
        renderYaml();
        generateButton.setAttribute("disabled", "disabled");
        if (previewButton) previewButton.setAttribute("disabled", "disabled");
        generateButton.textContent = "Generating";
        fetch("/api/public/config-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ config: yaml.textContent || "" })
        })
          .then(function (response) {
            return response.json().then(function (payload) {
              if (!response.ok) throw new Error(payload.error || "Preview failed");
              return payload;
            });
          })
          .then(renderPreview)
          .catch(function (error) {
            setStatus(false, "Preview failed", error.message || "Try again.");
          })
          .finally(function () {
            generateButton.removeAttribute("disabled");
            if (previewButton) previewButton.removeAttribute("disabled");
            generateButton.textContent = "Generate policy";
          });
      }
      form.addEventListener("change", renderYaml);
      form.addEventListener("input", renderYaml);
      if (repositoryInput) {
        repositoryInput.addEventListener("input", updateHandoffLinks);
      }
      if (scanButton) {
        scanButton.addEventListener("click", scanEvidence);
      }
      generateButton.addEventListener("click", previewGenerated);
      if (previewButton) {
        previewButton.addEventListener("click", previewGenerated);
      }
      if (copyButton) {
        var defaultCopyLabel = copyButton.textContent || "Copy YAML";
        copyButton.addEventListener("click", function () {
          renderYaml();
          copyText(yaml.textContent || "").then(function () {
            copyButton.textContent = "Copied";
            copyButton.setAttribute("data-copied", "true");
            window.setTimeout(function () {
              copyButton.textContent = defaultCopyLabel;
              copyButton.removeAttribute("data-copied");
            }, 1800);
          }).catch(function () {
            selectYaml();
            copyButton.textContent = "Select YAML";
            window.setTimeout(function () {
              copyButton.textContent = defaultCopyLabel;
            }, 1800);
          });
        });
      }
      if (copyWorkflowGuard && workflowGuard) {
        var defaultWorkflowLabel = copyWorkflowGuard.textContent || "Copy workflow";
        copyWorkflowGuard.addEventListener("click", function () {
          copyText(workflowGuard.textContent || "").then(function () {
            copyWorkflowGuard.textContent = "Copied";
            window.setTimeout(function () {
              copyWorkflowGuard.textContent = defaultWorkflowLabel;
            }, 1800);
          }).catch(function () {
            copyWorkflowGuard.textContent = "Copy failed";
            window.setTimeout(function () {
              copyWorkflowGuard.textContent = defaultWorkflowLabel;
            }, 1800);
          });
        });
      }
      if (copyAcceptanceProof && acceptanceProof) {
        var defaultProofLabel = copyAcceptanceProof.textContent || "Copy proof";
        copyAcceptanceProof.addEventListener("click", function () {
          copyText(acceptanceProof.textContent || "").then(function () {
            copyAcceptanceProof.textContent = "Copied";
            window.setTimeout(function () {
              copyAcceptanceProof.textContent = defaultProofLabel;
            }, 1800);
          }).catch(function () {
            copyAcceptanceProof.textContent = "Copy failed";
            window.setTimeout(function () {
              copyAcceptanceProof.textContent = defaultProofLabel;
            }, 1800);
          });
        });
      }
      renderYaml();
      renderInstallHandoff({
        mode: selectedValue("mode") || "hybrid",
        checks: {
          create_required_check: checked("create_required_check"),
          name: "pr-captcha/human"
        },
        require: {
          solver_must_be_pr_author: checked("require_pr_author") && !checked("maintainer_override")
        }
      });
      updateHandoffLinks();
      previewGenerated();
    })();
  </script>`;
}

function statusPageScript(): string {
  return `<script>
    (function () {
      var overall = document.querySelector("[data-status-overall]");
      var details = document.querySelector("[data-status-details]");
      var actions = document.querySelector("[data-status-actions]");
      var raw = document.querySelector("[data-status-json]");
      var checked = document.querySelector("[data-status-checked]");
      var refreshButton = document.querySelector("[data-refresh-status]");
      if (!overall || !details || !actions || !raw) return;

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function stateText(state) {
        if (state === "ready") return "ready";
        if (state === "warn") return "needs setup";
        if (state === "error") return "failing";
        return "checking";
      }
      function setOverall(state, title, body) {
        overall.setAttribute("data-state", state === "error" ? "error" : "ready");
        overall.setAttribute("data-service-state", state);
        overall.innerHTML =
          '<span class="mini-shield">' + (state === "error" ? "!" : "✓") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function setTile(id, state, label) {
        var tile = document.querySelector('[data-status-tile="' + id + '"]');
        if (!tile) return;
        tile.setAttribute("data-state", state);
        var mark = tile.querySelector(".status-mark");
        var statusLabel = tile.querySelector("[data-status-label]");
        if (mark) mark.setAttribute("data-state", state);
        if (statusLabel) statusLabel.textContent = label || stateText(state);
      }
      function renderRows(rows) {
        details.innerHTML = rows.map(function (row) {
          return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
        }).join("");
      }
      function renderActions(items) {
        actions.innerHTML = items.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.body) + "</span></li>";
        }).join("");
      }
      function checkedLabel(result) {
        if (!result || result.status === 0) return "unreachable";
        var ms = typeof result.ms === "number" ? " in " + result.ms + " ms" : "";
        return "HTTP " + result.status + ms;
      }
      function fetchJson(path) {
        var started = Date.now();
        return fetch(path, { headers: { Accept: "application/json" } })
          .then(function (response) {
            return response.json().catch(function () {
              return {};
            }).then(function (payload) {
              return {
                ok: response.ok && payload.ok === true,
                status: response.status,
                ms: Date.now() - started,
                payload: payload
              };
            });
          })
          .catch(function (error) {
            return {
              ok: false,
              status: 0,
              ms: Date.now() - started,
              payload: { error: error.message || "Request failed" }
            };
          });
      }
      function run() {
        if (refreshButton) {
          refreshButton.setAttribute("disabled", "disabled");
          refreshButton.textContent = "Refreshing";
        }
        setOverall("checking", "Checking service", "Loading public health checks.");
        setTile("worker", "checking", "checking");
        setTile("ready", "checking", "checking");
        setTile("database", "checking", "checking");
        Promise.all([fetchJson("/health"), fetchJson("/health/ready")])
          .then(function (results) {
            var health = results[0];
            var readiness = results[1];
            var databaseOk = readiness.payload.database === true;
            var workerState = health.ok ? "ready" : "error";
            var readinessState = readiness.ok ? "ready" : health.ok ? "warn" : "error";
            var databaseState = databaseOk ? "ready" : "error";
            setTile("worker", workerState, health.ok ? "online" : "failing");
            setTile("ready", readinessState, readiness.ok ? "ready" : "not ready");
            setTile("database", databaseState, databaseOk ? "queryable" : "unavailable");
            if (readiness.ok) {
              setOverall("ready", "Service ready", "Worker heartbeat, readiness, and D1 checks are passing.");
              renderActions([
                { level: "info", title: "Ready", body: "Use the setup wizard, then require pr-captcha/human where appropriate." }
              ]);
            } else if (health.ok) {
              setOverall("warn", "Not ready", "The Worker responds, but readiness checks are not all passing.");
              var items = [];
              if (!databaseOk) {
                items.push({ level: "error", title: "Check D1", body: "Bind D1 and apply migrations before production traffic." });
              }
              items.push({ level: "warning", title: "Inspect readiness", body: "Review /health/ready and retry health checks." });
              renderActions(items);
            } else {
              setOverall("error", "Service unavailable", "The public Worker heartbeat did not pass.");
              renderActions([
                { level: "error", title: "Worker unreachable", body: "Check Worker deploy, route, and Cloudflare service status." }
              ]);
            }
            renderRows([
              ["Worker", checkedLabel(health)],
              ["Readiness", readiness.ok ? "ready" : "not ready"],
              ["D1 database", databaseOk ? "queryable" : "not queryable"],
              ["Service", readiness.payload.service || health.payload.service || "pr-captcha"]
            ]);
            raw.textContent = JSON.stringify({ health: health, readiness: readiness }, null, 2);
            if (checked) checked.textContent = "checked " + new Date().toLocaleTimeString();
          })
          .finally(function () {
            if (refreshButton) {
              refreshButton.removeAttribute("disabled");
              refreshButton.textContent = "Refresh status";
            }
          });
      }
      if (refreshButton) refreshButton.addEventListener("click", run);
      run();
    })();
  </script>`;
}

export function renderFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="3" y="3" width="42" height="42" rx="13" fill="#f3f3f4"/>
    <circle cx="15" cy="14.5" r="5.6" fill="#15181e"/>
    <circle cx="33" cy="14.5" r="5.6" fill="#15181e"/>
    <circle cx="24" cy="26" r="14.2" fill="#fff" stroke="#15181e"/>
    <rect x="12.4" y="21.6" width="23.2" height="7.4" rx="3.7" fill="#15181e"/>
    <path fill="#15181e" d="M22 31.2h4l-2 2.3z"/>
  </svg>`;
}

export function renderBadgeSvg(
  input: {
    label?: string | undefined;
    message?: string | undefined;
    tone?: string | undefined;
    style?: string | undefined;
  } = {},
): string {
  const label = badgeText(input.label, "protected by");
  const message = badgeText(input.message, "pr-captcha");
  const tone = badgeTone(input.tone);
  const style = badgeStyle(input.style);
  const leftWidth = badgeWidth(label);
  const rightWidth = badgeWidth(message);
  const width = leftWidth + rightWidth;
  const radius = style === "flat" ? 0 : 6;
  const messageColor =
    tone === "black" ? "#080d14" : tone === "amber" ? "#b45309" : "#109b55";
  const title = `${label} ${message}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28" role="img" aria-label="${escapeXml(title)}">
    <title>${escapeXml(title)}</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
      <stop offset="1" stop-color="#000" stop-opacity=".08"/>
    </linearGradient>
    <clipPath id="r"><rect width="${width}" height="28" rx="${radius}"/></clipPath>
    <g clip-path="url(#r)">
      <rect width="${leftWidth}" height="28" fill="#080d14"/>
      <rect x="${leftWidth}" width="${rightWidth}" height="28" fill="${messageColor}"/>
      <rect width="${width}" height="28" fill="url(#s)"/>
    </g>
    <g fill="#fff" font-family="Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="750" text-anchor="middle">
      <text x="${Math.round(leftWidth / 2)}" y="18">${escapeXml(label)}</text>
      <text x="${leftWidth + Math.round(rightWidth / 2)}" y="18">${escapeXml(message)}</text>
    </g>
  </svg>`;
}

export function renderOpenGraphImageSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0a0c10"/>
    <g font-family="Hanken Grotesk, -apple-system, Segoe UI, Roboto, sans-serif">
      <g transform="translate(80 70)">
        <rect x="0" y="0" width="44" height="44" rx="12" fill="#f3f3f4"/>
        <circle cx="14" cy="13.5" r="5.2" fill="#15181e"/>
        <circle cx="30" cy="13.5" r="5.2" fill="#15181e"/>
        <circle cx="22" cy="24" r="13" fill="#ffffff" stroke="#15181e"/>
        <rect x="11.5" y="20" width="21" height="6.8" rx="3.4" fill="#15181e"/>
        <path d="M20 28.6h4l-2 2.2z" fill="#15181e"/>
        <text x="60" y="32" font-size="30" font-weight="700" fill="#f3f4f6">pr-captcha</text>
      </g>
      <text x="80" y="252" font-size="92" font-weight="800" fill="#f3f4f6" letter-spacing="-3">
        <tspan x="80" dy="0">Your repo has a</tspan>
        <tspan x="80" dy="100" fill="#36c98a">bouncer</tspan><tspan fill="#f3f4f6"> now.</tspan>
      </text>
      <text x="82" y="476" font-size="29" font-weight="500" fill="#98a0ab">
        <tspan x="82" dy="0">A GitHub-authenticated, SHA-bound human check at the door.</tspan>
        <tspan x="82" dy="42">Not AI detection. No PR code run.</tspan>
      </text>
      <text x="82" y="584" font-size="21" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="600" fill="#6a7280">1 user / 1 commit / 0 patch executed</text>
    </g>
    <g transform="translate(720 152)" font-family="JetBrains Mono, ui-monospace, monospace">
      <rect width="400" height="326" rx="14" fill="#13161c" stroke="#232831"/>
      <circle cx="26" cy="28" r="5" fill="#36c98a"/>
      <text x="44" y="33" font-size="16" fill="#98a0ab">octo-org/awesome-repo</text>
      <text x="376" y="33" font-size="14" fill="#6a7280" text-anchor="end">#184</text>
      <line x1="0" y1="54" x2="400" y2="54" stroke="#1a1e25"/>
      <g transform="translate(24 78)">
        <circle cx="11" cy="11" r="11" fill="rgba(54,201,138,0.18)"/>
        <path d="m6 11 3.5 3.5 6.5-8" fill="none" stroke="#36c98a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="34" y="9" font-size="15" font-weight="600" fill="#f3f4f6">pr-captcha / human</text>
        <text x="34" y="30" font-size="13" fill="#98a0ab" font-family="Hanken Grotesk, sans-serif">Verified for this exact commit.</text>
        <text x="352" y="13" font-size="12" fill="#36c98a" text-anchor="end">PASS</text>
      </g>
      <line x1="24" y1="142" x2="376" y2="142" stroke="#1a1e25"/>
      <g transform="translate(24 160)">
        <circle cx="11" cy="11" r="11" fill="rgba(151,160,173,0.18)"/>
        <text x="34" y="9" font-size="15" font-weight="600" fill="#f3f4f6">ci / build and test</text>
        <text x="34" y="30" font-size="13" fill="#98a0ab" font-family="Hanken Grotesk, sans-serif">Held until a human is verified.</text>
        <text x="352" y="13" font-size="12" fill="#97a0ad" text-anchor="end">HELD</text>
      </g>
      <rect x="24" y="230" width="352" height="72" rx="10" fill="#0a0c10"/>
      <text x="40" y="261" font-size="12" fill="#6a7280">identity GitHub OAuth</text>
      <text x="40" y="283" font-size="12" fill="#6a7280">presence Turnstile / scope head SHA</text>
    </g>
  </svg>`;
}

export function renderRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /api/admin/
Disallow: /auth/github/
Disallow: /gate/
Sitemap: ${baseUrl}/sitemap.xml
`;
}

export function renderSitemapXml(baseUrl: string): string {
  const urls = [
    "",
    "/demo",
    "/evidence",
    "/trust",
    "/setup-wizard",
    "/status",
    "/setup.md",
    "/trust.md",
    "/privacy.md",
    "/terms.md",
    "/security.md",
    "/abuse.md",
    "/incident.md",
    "/beta.md",
    "/support.md",
    "/github-app.md",
    "/config.md",
    "/operations.md",
    "/production-goal.md",
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

export function renderSecurityTxt(baseUrl: string, expiresAt: Date): string {
  return `Contact: https://github.com/aryabyte21/pr-captcha/issues
Policy: ${baseUrl}/trust
Policy: ${baseUrl}/security.md
Preferred-Languages: en
Expires: ${expiresAt.toISOString()}
Canonical: ${baseUrl}/.well-known/security.txt
`;
}

function githubMark(): string {
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>`;
}

function brandMark(size: "default" | "small" | "tiny" = "default"): string {
  const className = size === "default" ? "brand-mark" : `brand-mark ${size}`;
  return `<svg class="${className}" viewBox="0 0 48 48" aria-hidden="true">
    <rect class="m-tile" x="3" y="3" width="42" height="42" rx="13"></rect>
    <circle class="m-blk" cx="15" cy="14.5" r="5.6"></circle>
    <circle class="m-blk" cx="33" cy="14.5" r="5.6"></circle>
    <circle class="m-face" cx="24" cy="26" r="14.2"></circle>
    <rect class="m-blk" x="12.4" y="21.6" width="23.2" height="7.4" rx="3.7"></rect>
    <rect class="m-blk" x="22.6" y="22.4" width="2.8" height="2"></rect>
    <rect class="m-glare" x="15" y="23" width="4.6" height="1.5" rx="0.75"></rect>
    <path class="m-blk" d="M22 31.2h4l-2 2.3z"></path>
    <path class="m-line" d="M21.3 33.6c.9 1.4 4.5 1.4 5.4 0"></path>
    <path class="m-blk" d="M24 40.5l-5 -3v6z"></path>
    <path class="m-blk" d="M24 40.5l5 -3v6z"></path>
    <circle class="m-blk" cx="24" cy="40.5" r="1.9"></circle>
  </svg>`;
}

function demoStepButton(
  index: string,
  title: string,
  body: string,
  active = false,
): string {
  return `<button class="demo-step" type="button" data-demo-step="${escapeHtml(index)}"${active ? ' data-active="true" aria-pressed="true"' : ' aria-pressed="false"'}>
    <span>${escapeHtml(String(Number(index) + 1))}</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(body)}</small>
  </button>`;
}

function evidenceReportUrl(
  baseUrl: string | undefined,
  repository: string,
): string {
  const path = `/evidence?repo=${encodeURIComponent(repository)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function evidenceMetric(
  id: string,
  label: string,
  value: string,
  detail: string,
): string {
  return `<article class="evidence-metric" data-evidence-metric="${escapeHtml(id)}">
    <span>${escapeHtml(label)}</span>
    <strong data-evidence-${escapeHtml(id)}>${escapeHtml(value)}</strong>
    <p data-evidence-${escapeHtml(id)}-detail>${escapeHtml(detail)}</p>
  </article>`;
}

function trustDocRow(
  title: string,
  body: string,
  href: string,
  status: "ready" | "beta" | "blocked",
): string {
  return `<a class="trust-doc-row" href="${escapeHtml(href)}" data-state="${escapeHtml(status)}">
    <span class="trust-status">${escapeHtml(status)}</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(body)}</p>
    <code>${escapeHtml(href)}</code>
  </a>`;
}

function badgeText(value: string | undefined, fallback: string): string {
  const text = (value ?? fallback).trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, 28);
}

function badgeTone(value: string | undefined): BadgeTone {
  return value === "black" || value === "amber" ? value : "green";
}

function badgeStyle(value: string | undefined): BadgeStyle {
  return value === "flat" ? "flat" : "rounded";
}

function badgeWidth(value: string): number {
  return Math.max(76, Math.ceil(value.length * 7.2) + 24);
}

function statusTile(id: string, title: string, body: string): string {
  return `<article class="status-tile" data-status-tile="${escapeHtml(id)}">
    <span class="status-mark" data-state="checking"></span>
    <div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
    </div>
    <strong data-status-label>checking</strong>
  </article>`;
}

function setupWizardWorkflowGuardYaml(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://<worker-domain>";
  return `name: CI

on:
  pull_request:

jobs:
  pr-captcha:
    name: pr-captcha / human
    runs-on: ubuntu-latest
    steps:
      - uses: aryabyte21/pr-captcha/packages/action@v1
        with:
          api-url: ${workerUrl}

  heavy-ci:
    needs: pr-captcha
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test`;
}

function setupWizardAcceptanceProof(repository: string): string {
  return `Repository: ${repository}
Policy file: .github/pr-captcha.yml
Mode: hybrid
Required check: pr-captcha/human (enabled)
Solver: PR author only
Workflow guard: required before heavy jobs

Acceptance:
- Signed pull_request webhook creates a pending gate.
- Action fails before the exact head SHA is verified.
- Contributor solves CAPTCHA while logged in to GitHub.
- pr-captcha/human is updated to success for the same SHA.
- Action passes after verification.
- Branch protection is enabled only after the fork PR rehearsal passes.`;
}

function configPreviewExampleYaml(): string {
  return `mode: hybrid

captcha:
  provider: cloudflare_turnstile

require:
  github_login: true
  solver_must_be_pr_author: true
  new_sha_requires_new_captcha: true

apply_to:
  all_pull_requests: false
  first_time_contributors: true
  outside_contributors: true
  fork_prs: true
  bots: true

skip:
  authors: []
  labels:
    - trusted-contributor
    - no-captcha

checks:
  create_required_check: true
  name: pr-captcha/human

comment:
  enabled: true
  tone: direct

universal_gate:
  rerun_after_verification: true`;
}

export function renderGatePage(input: {
  gate: GateRecord;
  token: string;
  csrfToken: string;
  session: SessionUser;
  turnstileSiteKey: string;
  error?: string;
  verified?: boolean;
  successDetail?: string;
}): string {
  const shortSha = input.gate.head_sha.slice(0, 7);
  const repoFullName = `${input.gate.owner}/${input.gate.repo}`;
  const pullRequestUrl = `https://github.com/${input.gate.owner}/${input.gate.repo}/pull/${input.gate.pr_number}`;
  const prLink = `<a href="${escapeHtml(pullRequestUrl)}">${escapeHtml(repoFullName)}#${input.gate.pr_number}</a>`;
  const error = input.error
    ? `<div class="notice error">${escapeHtml(input.error)}</div>`
    : "";
  const gateState = input.verified ? "verified" : "pending";

  const verifiedBody = `<div class="gate-seal" aria-hidden="true">✓</div>
          <h1>You're verified</h1>
          <div class="notice success"><strong>Human check passed</strong> <span>${escapeHtml(input.successDetail ?? "The required check can turn green for this exact commit.")}</span></div>
          <p class="intro">Recorded for ${prLink} at <code>${escapeHtml(shortSha)}</code>, turning <code>pr-captcha/human</code> green.</p>
          <a class="button dark full" href="${escapeHtml(pullRequestUrl)}">Return to pull request</a>
          <p class="fine-print" data-gate-return>Taking you back to the pull request…</p>
          <script>
            window.setTimeout(function () {
              window.location.href = ${JSON.stringify(pullRequestUrl)};
            }, 2500);
          </script>`;

  const pendingBody = `<h1>Finish this PR check</h1>
          <p class="intro">Signed in as <strong>${escapeHtml(input.session.login)}</strong>. Verifying ${prLink} at <code>${escapeHtml(shortSha)}</code> to turn <code>pr-captcha/human</code> green.</p>
          ${error}
          <form method="post" action="/gate/${escapeHtml(input.gate.id)}" data-gate-form>
            <input type="hidden" name="token" value="${escapeHtml(input.token)}" />
            <input type="hidden" name="csrf_token" value="${escapeHtml(input.csrfToken)}" />
            <div class="turnstile-wrap">
              <div class="cf-turnstile" data-sitekey="${escapeHtml(input.turnstileSiteKey)}" data-callback="ptArm"></div>
            </div>
            <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
            <button class="button dark full" type="submit" data-gate-submit disabled>
              <span class="spinner" aria-hidden="true"></span>
              <span data-label>Solve the check to continue</span>
            </button>
          </form>
          <p class="fine-print">No PR code runs here. The receipt is bound to this commit only: a new commit needs a new check.</p>
          <script>
            (function () {
              var b = document.querySelector("[data-gate-submit]");
              var l = b && b.querySelector("[data-label]");
              var f = document.querySelector("[data-gate-form]");
              window.ptArm = function () {
                if (!b) return;
                b.disabled = false;
                if (l) l.textContent = "Complete human check";
              };
              window.setTimeout(function () {
                if (b && b.disabled && !b.classList.contains("is-loading")) window.ptArm();
              }, 7000);
              if (f && b) {
                f.addEventListener("submit", function () {
                  b.classList.add("is-loading");
                  b.setAttribute("aria-busy", "true");
                  b.disabled = true;
                  if (l) l.textContent = "Verifying…";
                });
              }
            })();
          </script>`;

  return layout(
    input.verified ? "Verified" : "Finish this PR check",
    `<main id="main" class="gate-page">
      <section class="gate-shell" data-gate-shell data-gate-status="${gateState}">
        <div class="gate">
          <div class="brand centered">${brandMark()}<span>pr-captcha</span></div>
          ${input.verified ? verifiedBody : pendingBody}
        </div>
      </section>
    </main>`,
  );
}

export function renderMessagePage(
  title: string,
  message: string,
  status: "success" | "error" = "success",
  link?: { href: string; label: string },
): string {
  const action = link
    ? `<a class="button dark full" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
    : "";
  return layout(
    title,
    `<main id="main" class="gate-page">
      <section class="gate small">
        <div class="brand centered">${brandMark()}<span>pr-captcha</span></div>
        <h1>${escapeHtml(title)}</h1>
        <div class="notice ${status}">${escapeHtml(message)}</div>
        ${action}
      </section>
    </main>`,
  );
}

function metaRow(label: string, value: string, code = false): string {
  const renderedValue = code
    ? `<code>${escapeHtml(value)}</code>`
    : escapeHtml(value);
  return `<div class="meta-row"><div>${escapeHtml(label)}</div><div>${renderedValue}</div></div>`;
}

function layout(
  title: string,
  body: string,
  metadata: {
    title?: string;
    description?: string;
    canonicalUrl?: string | undefined;
    imageUrl?: string;
  } = {},
): string {
  const metaTitle = metadata.title ?? title;
  const description = metadata.description ?? defaultDescription;
  const canonical = metadata.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`
    : "";
  const image = metadata.imageUrl ?? "/og.svg";

  return `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0a0c10" />
    <link rel="preconnect" href="https://challenges.cloudflare.com" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="pr-captcha" />
    <meta property="og:title" content="${escapeHtml(metaTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${canonical}
    <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
    <style>
      @view-transition {
        navigation: auto;
      }
      @media (prefers-reduced-motion: reduce) {
        ::view-transition-group(*),
        ::view-transition-old(*),
        ::view-transition-new(*) {
          animation: none !important;
        }
      }

      @font-face { font-family: "Hanken Grotesk"; font-style: normal; font-weight: 400 500; font-display: swap; src: url("/assets/fonts/hanken-400.woff2") format("woff2"); }
      @font-face { font-family: "Hanken Grotesk"; font-style: normal; font-weight: 600 800; font-display: swap; src: url("/assets/fonts/hanken-600.woff2") format("woff2"); }
      @font-face { font-family: "JetBrains Mono"; font-style: normal; font-weight: 400 700; font-display: swap; src: url("/assets/fonts/jetbrains-mono-500.woff2") format("woff2"); }
      :root {
        color-scheme: dark;
        --paper: #0a0c10;
        --surface: #13161c;
        --surface-2: #171b22;
        --bg: var(--paper);
        --ink: #f3f4f6;
        --text: #e6e8ec;
        --muted: #98a0ab;
        --faint: #11141a;
        --line: #232831;
        --line-dark: #2b313b;
        --green: #36c98a;
        --green-dark: #2bb37a;
        --green-soft: rgba(54, 201, 138, 0.14);
        --amber: #e0a93b;
        --red: #ff6f5e;
        --red-bg: rgba(255, 111, 94, 0.14);
        --success-bg: rgba(54, 201, 138, 0.14);
        --blue: #f3f4f6;
        --mark-signal: #2ec27e;
        --shadow: 0 1px 0 rgba(0, 0, 0, 0.4), 0 26px 60px -34px rgba(0, 0, 0, 0.85);
        --shadow-soft: 0 10px 30px -20px rgba(0, 0, 0, 0.7);
        --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        --sans: "Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        --mono: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
      }
      html[data-theme="light"] {
        color-scheme: light;
        --paper: #fafaf8;
        --surface: #ffffff;
        --surface-2: #f6f6f3;
        --ink: #0b0e14;
        --text: #16191f;
        --muted: #5b626d;
        --faint: #f3f6f4;
        --line: #e8e7e2;
        --line-dark: #d9dce0;
        --green: #0a7d4f;
        --green-dark: #0a5d56;
        --green-soft: #e7f4ee;
        --amber: #b8791a;
        --red: #c2392a;
        --red-bg: #fbece9;
        --success-bg: #e7f4ee;
        --blue: #0b0e14;
        --mark-signal: #16a35c;
        --shadow: 0 1px 0 rgba(11, 14, 20, 0.02), 0 22px 48px -30px rgba(11, 14, 20, 0.3);
        --shadow-soft: 0 10px 28px -22px rgba(11, 14, 20, 0.18);
      }
      * {
        box-sizing: border-box;
      }
      button,
      a,
      .button,
      .tg {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      html {
        scroll-behavior: smooth;
        scroll-padding-top: 84px;
        background: var(--paper);
      }
      body {
        margin: 0;
        min-height: 100vh;
        overflow-x: hidden;
        background:
          linear-gradient(rgba(127, 134, 145, 0.035) 1px, transparent 1px) 0 0 /
            100% 112px,
          var(--paper);
        color: var(--text);
        font-family: var(--sans);
        letter-spacing: 0;
        font-variant-numeric: tabular-nums;
      }
      a {
        color: inherit;
        text-decoration: none;
      }
      :focus-visible {
        outline: 2px solid var(--mark-signal);
        outline-offset: 3px;
      }
      .skip-link {
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 20;
        transform: translateY(-150%);
        border-radius: 8px;
        padding: 10px 12px;
        background: var(--ink);
        color: var(--paper);
        font-size: 14px;
        font-weight: 840;
      }
      .skip-link:focus {
        transform: translateY(0);
      }
      [hidden] {
        display: none !important;
      }
      .nowrap {
        white-space: nowrap;
      }
      button,
      .button {
        font: inherit;
      }
      .home,
      .site-footer {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
      }
      .site-header {
        position: sticky;
        top: 0;
        z-index: 10;
        width: 100%;
        min-height: 62px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 max(24px, calc((100% - 1180px) / 2));
        border-bottom: 1px solid var(--line);
        background: color-mix(in srgb, var(--paper) 82%, transparent);
        backdrop-filter: saturate(150%) blur(10px);
        -webkit-backdrop-filter: saturate(150%) blur(10px);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 840;
        font-size: 21px;
        color: var(--ink);
      }
      .brand.centered {
        display: flex;
        justify-content: center;
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        display: block;
        flex: 0 0 auto;
        color: var(--ink);
        filter: drop-shadow(0 1px 0 rgba(8, 13, 20, 0.12));
      }
      .brand-mark.small {
        width: 24px;
        height: 24px;
      }
      .brand-mark.tiny {
        width: 22px;
        height: 22px;
      }
      .brand .tag {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--muted);
        letter-spacing: 0.02em;
        font-weight: 600;
        padding: 2px 6px;
        border: 1px solid var(--line);
        border-radius: 5px;
      }
      .header-actions {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        flex: 0 0 auto;
      }
      .header-tg {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        flex: 0 0 auto;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--muted);
        cursor: pointer;
        font-size: 14px;
        transition: color 180ms var(--ease-out);
      }
      .header-tg:hover {
        color: var(--ink);
      }
      .site-nav {
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;
        scrollbar-width: none;
        color: var(--text);
        font-size: 13px;
        font-weight: 760;
      }
      .site-nav::-webkit-scrollbar {
        display: none;
      }
      .site-nav a {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border-radius: 6px;
        padding: 0 9px;
        color: var(--text);
        white-space: nowrap;
        transition:
          background 180ms var(--ease-out),
          color 180ms var(--ease-out);
      }
      .site-nav a:hover,
      .site-nav a[aria-current="page"] {
        background: rgba(17, 152, 95, 0.09);
        color: var(--green-dark);
      }
      .button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
        padding: 0 20px;
        border: 1px solid transparent;
        cursor: pointer;
        font-weight: 620;
        font-size: 15px;
        white-space: nowrap;
        transition:
          transform 180ms var(--ease-out),
          background 180ms var(--ease-out),
          border-color 180ms var(--ease-out),
          color 180ms var(--ease-out),
          box-shadow 180ms var(--ease-out);
      }
      .button:hover {
        transform: translateY(-1px);
      }
      .button:active {
        transform: translateY(1px) scale(0.99);
      }
      .button.primary,
      .button.dark,
      .gate-card button {
        background: var(--ink);
        color: var(--paper);
        box-shadow: 0 12px 24px rgba(21, 31, 44, 0.14);
      }
      .button.primary {
        background: var(--ink);
        border-color: var(--ink);
        box-shadow: var(--shadow-soft);
      }
      .button.primary:hover,
      .button.dark:hover,
      .gate-card button:hover {
        background: var(--text);
        border-color: var(--text);
      }
      .button.light {
        background: var(--surface);
        border-color: var(--line);
        color: var(--ink);
      }
      .button.light:hover {
        border-color: rgba(17, 152, 95, 0.36);
        background: var(--surface);
      }
      .button.compact {
        min-height: 40px;
        padding: 0 14px;
        font-size: 13px;
      }
      .header-cta {
        min-height: 42px;
      }
      .home {
        padding: 14px 0 46px;
      }
      .hero {
        min-height: min(680px, calc(100dvh - 96px));
        display: grid;
        grid-template-columns: minmax(360px, 0.82fr) minmax(560px, 1.18fr);
        align-items: center;
        gap: 54px;
        padding: 24px 0 34px;
      }
      .hero-copy {
        position: relative;
        z-index: 1;
      }
      .hero-copy h1 {
        max-width: 760px;
        margin: 0 0 18px;
        color: var(--ink);
        font-size: clamp(48px, 5.2vw, 76px);
        line-height: 0.98;
        letter-spacing: 0;
        text-wrap: balance;
      }
      .inline-proof-media {
        width: clamp(82px, 8vw, 126px);
        height: clamp(34px, 3.6vw, 48px);
        display: inline-block;
        margin: 0 0.08em;
        border: 2px solid var(--line);
        border-radius: 999px;
        background-image:
          linear-gradient(90deg, rgba(7, 11, 16, 0.18), rgba(17, 152, 95, 0.2)),
          url("/assets/anti-slop-gate-hero.png");
        background-position: 50% 48%;
        background-size: 360%;
        box-shadow:
          0 12px 30px rgba(7, 11, 16, 0.16),
          inset 0 1px 0 var(--surface);
        vertical-align: 0.02em;
      }
      .hero-copy p {
        max-width: 560px;
        margin: 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.5;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 24px;
      }
      .proof-line {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 22px !important;
        color: var(--ink) !important;
        font-size: 20px !important;
        font-weight: 850;
        text-wrap: balance;
      }
      .signal-rail {
        max-width: 540px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .signal-rail span {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: var(--surface);
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .success-shield,
      .mini-shield {
        display: inline-grid;
        place-items: center;
        color: #ffffff;
        background: var(--green);
        font-weight: 900;
      }
      .success-shield {
        width: 30px;
        height: 30px;
        border-radius: 8px;
      }
      .mini-shield {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        font-size: 12px;
      }
      .motion-ready .motion-reveal,
      .motion-ready .queue-stat,
      .motion-ready .proof-card {
        opacity: 0;
        transform: translateY(26px) scale(0.985);
        transition:
          opacity 720ms var(--ease-out),
          transform 720ms var(--ease-out);
        transition-delay: var(--reveal-delay, 0ms);
      }
      .motion-ready .motion-reveal.is-visible,
      .motion-ready .queue-stat.is-visible,
      .motion-ready .proof-card.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .hero-media {
        display: grid;
        gap: 14px;
      }
      .hero-media figure {
        position: relative;
        margin: 0;
        overflow: hidden;
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }
      .hero-media figure::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(180deg, transparent 52%, rgba(7, 11, 16, 0.22)),
          radial-gradient(circle at 76% 22%, var(--surface), transparent 28%);
        mix-blend-mode: multiply;
      }
      .hero-media img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        transform: scale(1.01);
      }
      .hero-media figcaption {
        position: absolute;
        left: 18px;
        bottom: 16px;
        z-index: 1;
        width: min(420px, calc(100% - 36px));
        margin: 0;
        color: #ffffff;
        font-size: 15px;
        font-weight: 780;
        text-shadow: 0 1px 16px rgba(7, 11, 16, 0.34);
      }
      .hero-proof-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
        box-shadow: 0 16px 40px rgba(21, 31, 44, 0.07);
      }
      .hero-proof-grid div {
        min-height: 84px;
        display: grid;
        align-content: center;
        gap: 7px;
        padding: 16px;
        background: var(--surface);
      }
      .hero-proof-grid span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 760;
      }
      .hero-proof-grid strong {
        color: var(--ink);
        font-size: 17px;
        line-height: 1.2;
      }
      .product-stage {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.9fr);
        align-items: start;
        gap: 16px;
        width: 100%;
      }
      .repo-shell,
      .bot-comment,
      .gate-card,
      .proof-card,
      .timeline-section,
      .integration-section,
      .roadmap-card {
        background: var(--surface);
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
      }
      .repo-shell {
        overflow: hidden;
        box-shadow: var(--shadow);
      }
      .repo-topbar {
        min-height: 54px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 16px;
        background: var(--surface);
        color: #ffffff;
      }
      .repo-topbar span {
        color: #b8c0cc;
        font-size: 13px;
      }
      .repo-pr {
        padding: 14px 16px;
      }
      .repo-pr h2,
      .gate-card h3 {
        margin: 0;
        color: var(--ink);
        line-height: 1.2;
      }
      .repo-pr h2 {
        font-size: 21px;
      }
      .pr-num {
        color: var(--muted);
        font-weight: 600;
      }
      .repo-pr p,
      .gate-card p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .repo-pr strong {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 9px;
        border-radius: 999px;
        background: #6f42c1;
        color: #ffffff;
        font-size: 12px;
        margin-right: 8px;
      }
      code {
        padding: 2px 6px;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: var(--faint);
        color: var(--ink);
        font-size: 0.92em;
      }
      .checks {
        margin: 0 16px 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
      }
      .check-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
      }
      .check-row + .check-row {
        border-top: 1px solid var(--line);
      }
      .check-row.warn {
        background: var(--surface);
      }
      .check-icon {
        align-self: start;
        margin-top: 1px;
      }
      .warn-dot {
        width: 18px;
        height: 18px;
        border: 2px solid var(--amber);
        border-radius: 999px;
      }
      .req-dot {
        width: 22px;
        height: 22px;
      }
      .check-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .check-head strong {
        color: var(--ink);
        font-size: 14px;
      }
      .check-head span {
        color: var(--muted);
        font-size: 12px;
        white-space: nowrap;
      }
      .check-body p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .check-row button {
        min-height: 34px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface);
        color: var(--ink);
        padding: 0 16px;
        font-weight: 760;
        cursor: pointer;
        white-space: nowrap;
      }
      .check-row button:hover {
        border-color: var(--line);
      }
      .bot-comment {
        margin: 0 16px 14px;
        padding: 14px;
      }
      .bot-comment p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .card-top {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text);
        font-size: 13px;
        font-weight: 760;
      }
      .card-top span:last-child {
        margin-left: auto;
        color: var(--muted);
        font-weight: 400;
      }
      .gate-card {
        padding: 16px;
        box-shadow: 0 24px 60px rgba(21, 31, 44, 0.12);
      }
      .audit-stream {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        margin: 0 16px 14px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
      }
      .audit-stream div {
        min-height: 76px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 8px;
        align-content: center;
        background: var(--surface);
        padding: 12px;
      }
      .audit-stream strong {
        color: var(--ink);
        font-size: 12px;
      }
      .audit-stream small {
        grid-column: 2;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.25;
      }
      .audit-dot {
        width: 10px;
        height: 10px;
        align-self: center;
        border-radius: 999px;
        background: var(--green);
      }
      .audit-dot.warn-dot {
        width: 10px;
        height: 10px;
        border-width: 2px;
        background: transparent;
      }
      .gate-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
      }
      .gate-card h3 {
        font-size: 20px;
      }
      .gate-card dl {
        display: grid;
        gap: 12px;
        margin: 18px 0;
      }
      .gate-card dl div {
        display: grid;
        gap: 3px;
      }
      .gate-card dt {
        color: var(--muted);
        font-size: 12px;
      }
      .gate-card dd {
        margin: 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 650;
      }
      .captcha-box {
        min-height: 64px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px 10px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 5px;
        padding: 10px;
        background: var(--faint);
      }
      .captcha-box span {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 4px;
        border: 1px solid #b9c2cf;
        color: var(--green);
        font-weight: 900;
      }
      .captcha-box strong {
        font-size: 12px;
      }
      .captcha-box small {
        grid-column: 2;
        color: var(--muted);
      }
      .gate-card button {
        width: 100%;
        min-height: 44px;
        margin-top: 14px;
        border: 0;
        border-radius: 5px;
        font-weight: 820;
        cursor: pointer;
      }
      .timeline-section,
      .proof-section,
      .integration-section,
      .roadmap-section {
        margin-top: 40px;
      }
      .proof-section {
        display: grid;
        gap: 24px;
        margin-top: 18px;
      }
      .section-heading {
        max-width: 760px;
        margin: 0 auto 28px;
        text-align: center;
      }
      .section-heading.split {
        max-width: none;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
        gap: 28px;
        margin-bottom: 0;
        text-align: left;
      }
      .section-heading h2 {
        margin: 0;
        color: var(--ink);
        font-size: 36px;
        line-height: 1.1;
      }
      .section-heading p {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.55;
      }
      .section-heading span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 720;
        white-space: nowrap;
      }
      .proof-grid {
        display: grid;
        grid-template-columns: 1.12fr 0.94fr 0.94fr;
        gap: 16px;
        align-items: start;
      }
      .queue-stat {
        min-height: 150px;
        display: grid;
        align-content: start;
        background: var(--surface);
        padding: 20px;
      }
      .queue-stat span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 820;
      }
      .queue-stat strong {
        margin-top: 16px;
        color: var(--ink);
        font-size: clamp(38px, 5vw, 64px);
        line-height: 0.95;
        letter-spacing: 0;
      }
      .queue-stat p {
        margin: 8px 0 0;
        color: var(--ink);
        font-size: 16px;
        font-weight: 800;
      }
      .queue-stat small {
        margin-top: 18px;
        color: var(--muted);
        font-size: 12px;
      }
      .proof-card {
        overflow: hidden;
        box-shadow: 0 16px 42px rgba(8, 13, 20, 0.08);
      }
      .proof-card:first-child {
        transform: translateY(18px);
      }
      .proof-card:nth-child(2) {
        transform: translateY(-8px);
      }
      .proof-card:nth-child(3) {
        transform: translateY(28px);
      }
      .proof-card img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        object-position: top left;
        border-bottom: 1px solid var(--line);
      }
      .proof-card div {
        padding: 16px;
      }
      .proof-card strong {
        color: var(--muted);
        font-size: 12px;
        font-weight: 820;
      }
      .proof-card h3 {
        margin: 8px 0 8px;
        color: var(--ink);
        font-size: 17px;
        line-height: 1.25;
      }
      .proof-card p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .proof-footnote {
        max-width: 840px;
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }
      .pressure-section {
        display: grid;
        grid-template-columns: minmax(300px, 0.7fr) minmax(0, 1.3fr);
        gap: 32px;
        align-items: stretch;
        margin-top: 72px;
      }
      .pressure-copy {
        align-self: center;
        max-width: 480px;
      }
      .pressure-copy h2 {
        margin: 0;
        color: var(--ink);
        font-size: clamp(38px, 4.8vw, 68px);
        line-height: 0.98;
        letter-spacing: 0;
        text-wrap: balance;
      }
      .pressure-copy p {
        margin: 20px 0 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.55;
      }
      .pressure-accordion {
        min-height: 470px;
        display: flex;
        overflow: hidden;
        border: 1px solid rgba(21, 31, 44, 0.12);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }
      .pressure-panel {
        position: relative;
        min-width: 0;
        flex: 1 1 0;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        border-right: 1px solid var(--surface);
        transition:
          flex 620ms var(--ease-out),
          opacity 720ms var(--ease-out),
          transform 720ms var(--ease-out);
      }
      .pressure-panel:last-child {
        border-right: 0;
      }
      .pressure-panel:first-child,
      .pressure-panel:hover,
      .pressure-panel:focus-within {
        flex-grow: 1.75;
      }
      .pressure-panel img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(0.85) contrast(1.12) saturate(0.72);
        opacity: 0.54;
        transform: scale(1.02);
        transition:
          transform 760ms var(--ease-out),
          opacity 760ms var(--ease-out),
          filter 760ms var(--ease-out);
      }
      .pressure-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(7, 11, 16, 0.08), rgba(7, 11, 16, 0.84)),
          radial-gradient(circle at 18% 16%, rgba(17, 152, 95, 0.24), transparent 34%);
      }
      .pressure-panel:hover img,
      .pressure-panel:focus-within img {
        opacity: 0.72;
        filter: grayscale(0.3) contrast(1.12) saturate(0.92);
        transform: scale(1.08);
      }
      .pressure-panel div {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 12px;
        padding: 24px;
        color: #ffffff;
      }
      .pressure-panel h3 {
        margin: 0;
        font-size: clamp(22px, 2vw, 30px);
        line-height: 1;
        text-wrap: balance;
      }
      .pressure-panel p {
        width: min(340px, 48vw);
        margin: 0;
        color: var(--surface);
        font-size: 14px;
        line-height: 1.5;
      }
      .timeline-section,
      .integration-section {
        padding: 32px;
      }
      .timeline-section h2,
      .integration-section h2,
      .roadmap-section h2 {
        margin: 0;
      }
      .timeline {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0;
        border-top: 1px solid var(--line);
      }
      .timeline-item {
        position: relative;
        min-height: 170px;
        padding: 22px 18px 0;
        border: 0;
        border-left: 1px solid var(--line);
        background: transparent;
      }
      .timeline-item:first-child {
        border-left: 0;
      }
      .timeline-item span,
      .roadmap-title span {
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ink);
        color: var(--paper);
        font-weight: 850;
      }
      .timeline-item h3 {
        margin: 22px 0 10px;
        color: var(--ink);
        font-size: 17px;
        line-height: 1.25;
      }
      .timeline-item p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.55;
      }
      .comparison-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .integration-mobile {
        display: none;
      }
      .comparison-table {
        width: 100%;
        min-width: 860px;
        border-collapse: collapse;
        background: var(--surface);
      }
      .comparison-table th,
      .comparison-table td {
        border: 1px solid var(--line);
        padding: 18px;
        vertical-align: top;
        text-align: left;
        font-size: 14px;
        line-height: 1.5;
      }
      .comparison-table thead th {
        color: var(--ink);
        background: var(--surface);
        font-size: 16px;
      }
      .comparison-table tbody th {
        width: 160px;
        color: var(--ink);
        background: var(--surface);
        font-weight: 800;
      }
      .setup-section {
        display: grid;
        grid-template-columns: minmax(0, 0.82fr) minmax(520px, 1fr);
        gap: 30px;
        align-items: start;
        margin-top: 48px;
        padding-top: 6px;
      }
      .setup-copy h2 {
        margin: 0;
        color: var(--ink);
        font-size: 40px;
        line-height: 1.08;
        text-wrap: balance;
      }
      .setup-copy > p {
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.6;
      }
      .setup-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }
      .setup-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .setup-steps {
        display: grid;
        gap: 10px;
        margin-top: 24px;
      }
      .setup-step {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 14px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
        background: var(--surface);
      }
      .step-number {
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ink);
        color: var(--paper);
        font-weight: 850;
      }
      .setup-step h3,
      .ready-panel h3 {
        margin: 0;
        color: var(--ink);
        font-size: 18px;
        line-height: 1.25;
      }
      .setup-step p,
      .ready-panel p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .setup-step a {
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
      }
      .setup-step a:hover {
        color: var(--green-dark);
      }
      .setup-board {
        display: grid;
        gap: 14px;
      }
      .workflow-panel,
      .ready-panel {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .panel-top {
        min-height: 52px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 0 18px;
        background: var(--surface);
        color: #ffffff;
      }
      .panel-top strong {
        font-size: 15px;
      }
      .panel-top span {
        color: #b8c0cc;
        font-size: 13px;
        font-weight: 650;
      }
      .workflow-panel pre {
        margin: 0;
        overflow-x: auto;
        padding: 20px;
        background: var(--surface);
      }
      .workflow-panel code {
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--text);
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 13px;
        line-height: 1.55;
        white-space: pre;
      }
      .ready-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(280px, 1fr);
        gap: 18px;
        align-items: center;
        padding: 20px;
      }
      .setup-signals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .setup-signal {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 3px 8px;
        align-items: center;
        min-height: 62px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px;
        background: var(--surface);
      }
      .setup-signal strong {
        color: var(--ink);
        font-size: 13px;
      }
      .setup-signal small {
        grid-column: 2;
        color: var(--muted);
        font-size: 12px;
      }
      .yes,
      .partial,
      .no {
        font-weight: 850;
      }
      .yes {
        color: var(--green);
      }
      .partial {
        color: var(--amber);
      }
      .no {
        color: var(--muted);
      }
      .security-band {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.76fr);
        gap: 34px;
        align-items: center;
        margin-top: 46px;
        padding: 34px;
        border-radius: 7px;
        background: var(--surface);
        color: #ffffff;
      }
      .security-band h2 {
        margin: 0 0 12px;
        font-size: 34px;
        line-height: 1.12;
      }
      .security-band p {
        margin: 0;
        max-width: 660px;
        color: #c3ccd7;
        font-size: 17px;
        line-height: 1.6;
      }
      .security-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .security-grid span {
        min-height: 48px;
        display: flex;
        align-items: center;
        border: 1px solid #24303d;
        border-radius: 6px;
        padding: 0 14px;
        background: var(--surface);
        color: #dce4ed;
        font-weight: 720;
      }
      .roadmap-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 28px;
      }
      .roadmap-card {
        padding: 22px;
      }
      .roadmap-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .roadmap-title h3 {
        margin: 0;
        color: var(--ink);
        font-size: 20px;
      }
      .roadmap-card ul {
        display: grid;
        gap: 9px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .roadmap-card li {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .roadmap-card li::before {
        content: "✓";
        color: var(--green);
        font-weight: 900;
        margin-right: 8px;
      }
      .roadmap-card p {
        margin: 18px 0 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 780;
        line-height: 1.45;
      }
      .site-footer {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 1fr) auto;
        gap: 34px;
        align-items: center;
        margin-bottom: 30px;
        padding: 30px;
        border-radius: 7px;
        background: var(--surface);
        color: #ffffff;
      }
      .footer-brand {
        color: #ffffff;
      }
      .site-footer p {
        margin: 14px 0;
        color: #b8c4d2;
      }
      .site-footer strong {
        color: var(--green);
      }
      .footer-points {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .footer-points span {
        min-height: 42px;
        display: flex;
        align-items: center;
        border: 1px solid #25313d;
        border-radius: 6px;
        padding: 0 12px;
        background: var(--surface);
      }
      .footer-actions {
        display: grid;
        gap: 10px;
      }
      .light-on-dark {
        background: var(--surface);
        color: var(--ink);
      }
      .ghost-on-dark {
        border-color: #394758;
        color: #ffffff;
      }
      .preview-page {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
        padding: 52px 0 72px;
      }
      .preview-heading {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.56fr);
        gap: 32px;
        align-items: end;
        margin-bottom: 34px;
      }
      .preview-heading > * {
        min-width: 0;
      }
      .preview-heading h1 {
        max-width: 860px;
        margin: 0;
        color: var(--ink);
        font-size: clamp(46px, 5vw, 72px);
        line-height: 0.98;
        font-weight: 930;
        text-wrap: balance;
      }
      .preview-heading p {
        max-width: 650px;
        margin: 16px 0 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.55;
      }
      .eyebrow {
        margin: 0 0 14px !important;
        font-family: var(--mono);
        color: var(--muted) !important;
        font-size: 12px !important;
        font-weight: 600;
        letter-spacing: 0.15em;
        line-height: 1.4 !important;
        text-transform: uppercase;
      }
      .preview-guarantees {
        display: grid;
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
        box-shadow: var(--shadow-soft);
      }
      .preview-guarantees span {
        min-height: 52px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        background: var(--surface);
        color: var(--ink);
        font-weight: 780;
      }
      .queue-presets .button {
        min-width: 0;
        padding: 0 10px;
      }

      .evidence-shell {
        display: grid;
        grid-template-columns: minmax(320px, 0.58fr) minmax(0, 1.42fr);
        gap: 18px;
        align-items: start;
      }
      .evidence-shell > * {
        min-width: 0;
      }
      .evidence-controls,
      .evidence-results,
      .evidence-prs,
      .evidence-summary-card,
      .evidence-brief-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .evidence-controls {
        position: sticky;
        top: 18px;
      }
      .evidence-field {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-bottom: 1px solid var(--line);
      }
      .evidence-field label {
        color: var(--ink);
        font-size: 13px;
        font-weight: 840;
      }
      .evidence-field div {
        min-height: 46px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0 12px;
        background: var(--surface);
      }
      .evidence-field div:focus-within {
        border-color: rgba(54, 201, 138, 0.28);
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
      }
      .evidence-field span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 780;
      }
      .evidence-field input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 780;
      }
      .evidence-presets {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
      }
      .evidence-presets .button {
        min-width: 0;
        padding: 0 10px;
      }
      .evidence-presets .button[data-active="true"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .evidence-explain {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-bottom: 1px solid var(--line);
      }
      .evidence-explain h2 {
        margin: 0;
        color: var(--ink);
        font-size: 17px;
      }
      .evidence-explain p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .evidence-actions {
        display: grid;
        gap: 1px;
        background: var(--line);
      }
      .evidence-actions a {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 18px;
        background: var(--surface);
        color: var(--ink);
        font-size: 14px;
        font-weight: 820;
        text-decoration: none;
      }
      .evidence-actions a::after {
        content: ">";
        color: var(--green);
      }
      .evidence-results {
        display: grid;
        gap: 14px;
        padding: 14px;
      }
      .evidence-recommendation {
        display: grid;
        gap: 14px;
        border: 1px solid rgba(54, 201, 138, 0.28);
        border-radius: 8px;
        padding: 16px;
        background: var(--green-soft);
      }
      .evidence-recommendation[data-evidence-risk="high"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
      }
      .evidence-recommendation[data-evidence-risk="medium"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
      }
      .evidence-recommendation[data-evidence-risk="low"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .evidence-recommendation > div:first-child {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }
      .evidence-recommendation h2 {
        margin: 0;
        color: var(--ink);
        font-size: 22px;
        line-height: 1.2;
      }
      .evidence-recommendation p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .evidence-recommendation dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
      }
      .evidence-recommendation dl div {
        display: grid;
        gap: 5px;
        min-height: 70px;
        border: 1px solid rgba(8, 13, 20, 0.08);
        border-radius: 7px;
        padding: 10px;
        background: var(--surface);
      }
      .evidence-recommendation dt {
        color: var(--muted);
        font-size: 12px;
        font-weight: 840;
      }
      .evidence-recommendation dd {
        margin: 0;
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }
      .evidence-share {
        display: grid;
        gap: 8px;
        border: 1px solid rgba(8, 13, 20, 0.08);
        border-radius: 8px;
        padding: 12px;
        background: var(--surface);
      }
      .evidence-share label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 860;
      }
      .evidence-share div {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
      }
      .evidence-share input {
        width: 100%;
        min-width: 0;
        min-height: 40px;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 0 11px;
        background: var(--surface);
        color: var(--ink);
        font: inherit;
        font-size: 13px;
        font-weight: 760;
        outline: none;
      }
      .evidence-share input:focus {
        border-color: rgba(54, 201, 138, 0.28);
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
      }
      .evidence-share small {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .evidence-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .evidence-metric {
        min-height: 132px;
        display: grid;
        align-content: start;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 15px;
        background: var(--surface);
      }
      .evidence-metric span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 860;
      }
      .evidence-metric strong {
        margin-top: 12px;
        color: var(--ink);
        font-size: clamp(30px, 3vw, 44px);
        line-height: 1;
      }
      .evidence-metric p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .evidence-prs {
        box-shadow: none;
      }
      .evidence-empty {
        display: grid;
        gap: 8px;
        padding: 22px;
        color: var(--muted);
      }
      .evidence-empty strong {
        color: var(--ink);
      }
      .evidence-empty p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .evidence-pr-list {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .evidence-pr-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(90px, 0.22fr);
        gap: 8px 14px;
        padding: 13px 14px;
        background: var(--surface);
      }
      .evidence-pr-row > a {
        min-width: 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 820;
        line-height: 1.35;
        text-decoration: none;
        overflow-wrap: anywhere;
      }
      .evidence-pr-row > a:hover {
        color: var(--green);
      }
      .evidence-author {
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
        text-align: right;
        overflow-wrap: anywhere;
      }
      .evidence-pr-meta {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .evidence-badge {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0 9px;
        background: var(--surface);
        color: var(--muted);
        font-size: 12px;
        font-weight: 820;
      }
      .evidence-badge[data-tone="ready"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
        color: var(--green);
      }
      .evidence-badge[data-tone="warning"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
        color: var(--amber);
      }
      .evidence-badge[data-tone="danger"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
        color: var(--red);
      }
      .evidence-summary-card {
        box-shadow: none;
      }
      .evidence-brief-card {
        box-shadow: none;
      }
      .evidence-brief-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 14px;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
      }
      .evidence-brief-actions p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .evidence-summary {
        max-height: 220px;
        border: 0;
        border-radius: 0;
      }
      .evidence-summary.evidence-brief {
        max-height: 310px;
      }
      .radar-row .evidence-pr-meta {
        grid-column: auto;
        align-content: start;
      }
      .radar-row .evidence-badge {
        min-height: 22px;
        padding: 0 7px;
        font-size: 11px;
      }
      .pilot-issue-actions .button {
        flex: 1 1 180px;
        justify-content: center;
      }
      .trust-heading {
        align-items: stretch;
      }
      .trust-readiness,
      .trust-docs,
      .trust-rail {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .trust-readiness {
        display: grid;
      }
      .trust-readiness div {
        display: grid;
        gap: 8px;
        min-height: 104px;
        align-content: center;
        border-bottom: 1px solid var(--line);
        padding: 18px;
      }
      .trust-readiness div:last-child {
        border-bottom: 0;
      }
      .trust-readiness span,
      .trust-doc-row p,
      .trust-checklist span {
        color: var(--muted);
      }
      .trust-readiness span {
        font-size: 12px;
        font-weight: 860;
      }
      .trust-readiness strong {
        color: var(--ink);
        font-size: 28px;
        font-weight: 900;
        line-height: 1;
      }
      .trust-readiness small {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.42;
      }
      .trust-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
        gap: 18px;
        align-items: start;
      }
      .trust-shell > * {
        min-width: 0;
      }
      .trust-docs {
        display: grid;
      }
      .trust-doc-row {
        min-height: 96px;
        display: grid;
        grid-template-columns: minmax(96px, 0.16fr) minmax(170px, 0.22fr) minmax(0, 1fr) minmax(120px, 0.2fr);
        gap: 14px;
        align-items: center;
        border-top: 1px solid var(--line);
        padding: 14px 18px;
        background: var(--surface);
      }
      .trust-doc-row > * {
        min-width: 0;
      }
      .trust-doc-row:hover {
        background: var(--surface);
      }
      .trust-status {
        width: max-content;
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(54, 201, 138, 0.28);
        border-radius: 999px;
        padding: 0 10px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 12px;
        font-weight: 880;
      }
      .trust-doc-row[data-state="beta"] .trust-status {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
        color: var(--amber);
      }
      .trust-doc-row[data-state="blocked"] .trust-status {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
        color: var(--red);
      }
      .trust-doc-row strong {
        color: var(--ink);
        font-size: 16px;
        line-height: 1.25;
      }
      .trust-doc-row p {
        margin: 0;
        font-size: 14px;
        line-height: 1.42;
      }
      .trust-doc-row code {
        color: var(--green);
        font: inherit;
        font-size: 13px;
        font-weight: 820;
        text-align: right;
        overflow-wrap: anywhere;
      }
      .trust-rail {
        position: sticky;
        top: 18px;
      }
      .trust-checklist {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .trust-checklist li {
        display: grid;
        gap: 6px;
        padding: 14px 18px;
        background: var(--surface);
      }
      .trust-checklist li[data-state="ready"] {
        background: var(--green-soft);
      }
      .trust-checklist li[data-state="beta"] {
        background: rgba(224, 169, 59, 0.14);
      }
      .trust-checklist li[data-state="blocked"] {
        background: var(--red-bg);
      }
      .trust-checklist strong {
        color: var(--ink);
        font-size: 14px;
      }
      .trust-checklist span {
        font-size: 13px;
        line-height: 1.42;
      }
      .trust-actions {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .trust-actions .button {
        width: 100%;
      }
      .badge-toggle-group .button,
      .proof-toggle-group .button {
        min-width: 0;
        padding: 0 10px;
      }
      .badge-toggle-group .button[aria-pressed="true"],
      .proof-toggle-group .button[aria-pressed="true"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .badge-preview-panel,
      .proof-preview-panel {
        display: grid;
        gap: 14px;
      }
      .badge-preview-frame {
        min-height: 142px;
        display: grid;
        align-content: center;
        justify-items: start;
        gap: 16px;
        padding: 24px;
        background:
          linear-gradient(#ffffff, #fbfcfd),
          linear-gradient(90deg, rgba(217, 222, 230, 0.55) 1px, transparent 1px),
          linear-gradient(rgba(217, 222, 230, 0.55) 1px, transparent 1px);
        background-size: auto, 28px 28px, 28px 28px;
      }
      .badge-preview-frame img {
        max-width: 100%;
        height: 28px;
      }
      .badge-preview-frame a {
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .proof-preview-frame {
        display: grid;
        gap: 16px;
        padding: 18px;
        background:
          linear-gradient(#ffffff, #fbfcfd),
          linear-gradient(90deg, rgba(217, 222, 230, 0.55) 1px, transparent 1px),
          linear-gradient(rgba(217, 222, 230, 0.55) 1px, transparent 1px);
        background-size: auto, 28px 28px, 28px 28px;
      }
      .proof-preview-frame img {
        width: 100%;
        height: auto;
        aspect-ratio: 1200 / 630;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        object-fit: contain;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
      }
      .proof-preview-frame a {
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .badge-snippets .panel-top,
      .proof-snippets .panel-top {
        min-height: 54px;
      }
      .badge-snippet,
      .proof-snippet {
        max-height: 152px;
        border: 0;
        border-radius: 0;
      }
      .scorecard-page {
        --scorecard-blue: var(--green);
      }
      .scorecard-heading .actions {
        align-items: stretch;
      }
      .scorecard-preview-frame {
        padding: 24px;
      }
      .scorecard-url-card .proof-snippet,
      .scorecard-share {
        max-height: 112px;
      }
      .scorecard-page .proof-snippet {
        background: var(--surface);
        color: var(--ink);
      }
      .scorecard-adoption-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1fr);
        gap: 18px;
        align-items: stretch;
        margin-top: 18px;
      }
      .scorecard-issue-card,
      .scorecard-routing-card {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .scorecard-issue {
        max-height: 232px;
        white-space: pre-wrap;
      }
      .scorecard-issue-card .preview-actions {
        border-top: 1px solid var(--line);
        padding: 14px;
      }
      .scorecard-action-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1px;
        background: var(--line);
      }
      .scorecard-action {
        min-width: 0;
        min-height: 128px;
        display: grid;
        gap: 8px;
        align-content: start;
        border: 0;
        border-radius: 0;
        padding: 16px;
        background: var(--surface);
        color: inherit;
        font: inherit;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
      }
      .scorecard-action:hover,
      .scorecard-action:focus-visible {
        background: var(--green-soft);
        outline: none;
      }
      .scorecard-action[data-copied="true"] {
        background: var(--green-soft);
      }
      .scorecard-action[data-copied="failed"] {
        background: var(--red-bg);
      }
      .scorecard-action strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.25;
      }
      .scorecard-action span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.42;
      }
      .scorecard-routing-card .scorecard-share {
        border-top: 1px solid var(--line);
      }
      .manifest-output .workflow-panel pre {
        max-height: 520px;
        overflow: auto;
      }
      .launch-panel,
      .launch-commands,
      .launch-proof-lane,
      .launch-gaps > .preview-status,
      .launch-gaps > .preview-card,
      .launch-actions-row a {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .receipt-story {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        border-top: 1px solid var(--line);
        background: var(--line);
      }
      .receipt-story div {
        display: grid;
        gap: 8px;
        padding: 18px;
        background: var(--surface);
      }
      .receipt-story span {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 13px;
        font-weight: 930;
      }
      .receipt-story strong {
        color: var(--ink);
        font-size: 15px;
      }
      .receipt-story p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 650;
        line-height: 1.45;
      }
      .launch-readiness .preview-status {
        align-items: flex-start;
      }
      .rehearsal-output-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .trace-secret-note .mini-shield {
        background: var(--amber);
      }
      .trace-output-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .demo-actions {
        margin-top: 22px;
      }
      .demo-lab-strip,
      .demo-install-strip {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
      }
      .demo-lab-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-bottom: 18px;
        overflow: hidden;
      }
      .demo-lab-strip div {
        min-width: 0;
        padding: 18px;
        border-right: 1px solid var(--line);
      }
      .demo-lab-strip div:last-child {
        border-right: 0;
      }
      .demo-lab-strip strong {
        display: block;
        color: var(--ink);
        font-size: 18px;
        line-height: 1.15;
      }
      .demo-lab-strip span {
        display: block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .demo-shell {
        display: grid;
        grid-template-columns: minmax(340px, 0.68fr) minmax(620px, 1.2fr);
        gap: 18px;
        align-items: start;
      }
      .demo-control,
      .demo-pr-panel,
      .demo-audit-panel,
      .demo-next {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .demo-steps {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .demo-step {
        min-height: 78px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: var(--surface);
        color: inherit;
        cursor: pointer;
        text-align: left;
      }
      .demo-step:hover,
      .demo-step[data-active="true"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .demo-step span {
        grid-row: 1 / 3;
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ink);
        color: var(--paper);
        font-weight: 850;
      }
      .demo-step strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.2;
      }
      .demo-step small {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .demo-copy-check {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border-top: 1px solid var(--line);
        padding: 14px 18px;
      }
      .demo-copy-check span {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 12px;
        font-weight: 820;
      }
      .demo-copy-check code {
        width: fit-content;
        min-width: 0;
      }
      .demo-stage {
        min-width: 0;
        display: grid;
        gap: 14px;
      }
      .demo-status {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(224, 169, 59, 0.3);
        border-radius: 8px;
        padding: 14px;
        background: rgba(224, 169, 59, 0.14);
      }
      .demo-status[data-state="ready"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .demo-status[data-state="ready"] .mini-shield {
        background: var(--green);
      }
      .demo-status .mini-shield {
        background: var(--amber);
      }
      .demo-status strong {
        display: block;
        color: var(--ink);
        font-size: 17px;
      }
      .demo-status p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .demo-pr-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 0.62fr);
        gap: 14px;
        align-items: start;
      }
      .demo-pr-panel {
        box-shadow: none;
      }
      .demo-checks {
        display: grid;
        gap: 10px;
        padding: 0 16px 14px;
      }
      .demo-check {
        min-height: 74px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: var(--surface);
      }
      .demo-check[data-state="held"],
      .demo-check[data-state="waiting"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
      }
      .demo-check[data-state="verified"],
      .demo-check[data-state="ready"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .demo-check-mark {
        display: inline-grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: var(--surface);
      }
      .demo-check[data-state="held"] .demo-check-mark,
      .demo-check[data-state="waiting"] .demo-check-mark {
        border-color: var(--amber);
      }
      .demo-check[data-state="verified"] .demo-check-mark,
      .demo-check[data-state="ready"] .demo-check-mark {
        border-color: var(--green);
        background: var(--green);
      }
      .demo-check strong {
        display: block;
        color: var(--ink);
        font-size: 14px;
      }
      .demo-check p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .demo-check > span:last-child {
        color: var(--text);
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
      }
      .demo-comment {
        margin: 0 16px 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: var(--surface);
      }
      .demo-comment p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .demo-comment .button {
        margin-top: 12px;
      }
      .demo-audit-panel {
        box-shadow: none;
      }
      .demo-audit-list {
        display: grid;
        gap: 8px;
        padding: 14px;
      }
      .demo-audit-list div {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 12px;
        background: var(--surface);
      }
      .demo-audit-list div[data-level="warning"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
      }
      .demo-audit-list div[data-level="success"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .demo-audit-list strong {
        color: var(--ink);
        font-size: 13px;
      }
      .demo-audit-list span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .demo-next {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: center;
        margin-top: 18px;
        padding: 24px;
      }
      .demo-next h2 {
        margin: 0;
        color: var(--ink);
        font-size: 26px;
      }
      .demo-next p {
        max-width: 720px;
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.5;
      }
      .demo-next-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }
      .demo-install-strip {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr) auto;
        gap: 18px;
        align-items: center;
        margin-top: 18px;
        padding: 22px;
      }
      .demo-install-strip h2 {
        margin: 0;
        color: var(--ink);
        font-size: 24px;
        line-height: 1.15;
      }
      .demo-install-strip p {
        max-width: 560px;
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .demo-install-strip pre {
        max-height: 180px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: var(--surface);
        color: var(--ink);
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .preview-shell {
        display: grid;
        grid-template-columns: minmax(420px, 0.9fr) minmax(0, 1.1fr);
        gap: 18px;
        align-items: start;
      }
      .wizard-shell {
        display: grid;
        grid-template-columns: minmax(420px, 0.9fr) minmax(420px, 0.86fr);
        gap: 18px;
        align-items: start;
      }
      .diagnostics-shell {
        display: grid;
        grid-template-columns: minmax(360px, 0.72fr) minmax(560px, 1fr);
        gap: 18px;
        align-items: start;
      }
      .status-shell {
        display: grid;
        grid-template-columns: minmax(360px, 0.78fr) minmax(560px, 1fr);
        gap: 18px;
        align-items: start;
      }
      .wizard-options,
      .diagnostics-form,
      .status-board,
      .wizard-output .workflow-panel {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .status-list {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .status-tile {
        min-height: 76px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: var(--surface);
        transition:
          transform 160ms var(--ease-out),
          border-color 160ms var(--ease-out);
      }
      .status-tile:hover {
        border-color: rgba(17, 152, 95, 0.32);
        transform: translateY(-1px);
      }
      .status-tile[data-state="ready"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .status-tile[data-state="warn"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
      }
      .status-tile[data-state="error"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
      }
      .status-mark {
        width: 28px;
        height: 28px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }
      .status-mark[data-state="checking"] {
        background:
          linear-gradient(
            90deg,
            transparent 0,
            rgba(8, 13, 20, 0.05) 50%,
            transparent 100%
          ),
          #ffffff;
      }
      .status-mark[data-state="ready"] {
        border-color: var(--green);
        background: var(--green);
      }
      .status-mark[data-state="warn"] {
        border-color: var(--amber);
        background: var(--amber);
      }
      .status-mark[data-state="error"] {
        border-color: var(--red);
        background: var(--red);
      }
      .status-tile h2 {
        margin: 0;
        color: var(--ink);
        font-size: 15px;
        line-height: 1.2;
      }
      .status-tile p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .status-tile > strong {
        justify-self: end;
        color: var(--text);
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
      }
      .wizard-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        border: 0;
        border-top: 1px solid var(--line);
        margin: 0;
        padding: 22px 18px 18px;
      }
      .wizard-group > * {
        min-width: 0;
      }
      .wizard-group:first-of-type {
        grid-template-columns: 1fr;
      }
      .wizard-repository-group {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
      }
      .wizard-group.diagnostics-fields:first-of-type {
        grid-template-columns: 1fr 1fr;
      }
      .wizard-group legend {
        grid-column: 1 / -1;
        width: 100%;
        margin: 0 0 8px;
        padding: 0;
        color: var(--ink);
        font-size: 15px;
        font-weight: 850;
        line-height: 1.25;
      }
      .wizard-choice {
        min-height: 76px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: var(--surface);
        cursor: pointer;
      }
      .wizard-choice:has(input:checked) {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .wizard-choice input {
        width: 17px;
        height: 17px;
        margin: 2px 0 0;
        accent-color: var(--green);
      }
      .wizard-choice strong,
      .wizard-choice small,
      .wizard-field span {
        display: block;
      }
      .wizard-choice strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.25;
      }
      .wizard-choice small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .wizard-field {
        display: grid;
        gap: 8px;
      }
      .wizard-field.wide {
        grid-column: 1 / -1;
      }
      .wizard-field span {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .wizard-field input {
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        outline: none;
        color: var(--text);
        background: var(--surface);
        font: inherit;
        font-size: 13px;
      }
      .wizard-field input:focus {
        border-color: rgba(54, 201, 138, 0.28);
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .wizard-repository-field {
        min-width: 0;
      }
      .wizard-evidence {
        grid-column: 1 / -1;
        display: grid;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: var(--surface);
      }
      .wizard-evidence[data-risk="high"] {
        border-color: #fbbf24;
        background: rgba(224, 169, 59, 0.14);
      }
      .wizard-evidence[data-risk="medium"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .wizard-evidence[data-risk="low"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
      }
      .wizard-evidence[data-risk="error"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
      }
      .wizard-evidence-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
      }
      .wizard-evidence-head strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.35;
      }
      .wizard-evidence-head span {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0 9px;
        background: var(--surface);
        color: var(--muted);
        font-size: 11px;
        font-weight: 860;
        text-transform: uppercase;
      }
      .wizard-evidence dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: var(--line);
      }
      .wizard-evidence dl div {
        display: grid;
        gap: 5px;
        min-height: 66px;
        align-content: center;
        padding: 10px;
        background: var(--surface);
      }
      .wizard-evidence dt {
        color: var(--muted);
        font-size: 11px;
        font-weight: 860;
      }
      .wizard-evidence dd {
        margin: 0;
        color: var(--ink);
        font-size: 19px;
        font-weight: 900;
        line-height: 1;
      }
      .wizard-handoff {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .wizard-handoff a {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: var(--surface);
        color: var(--ink);
        font-size: 12px;
        font-weight: 840;
      }
      .wizard-handoff a:hover {
        border-color: var(--line);
      }
      .wizard-output {
        display: grid;
        gap: 14px;
        min-width: 0;
        position: sticky;
        top: 92px;
      }
      .wizard-install-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .wizard-install-card {
        display: grid;
        gap: 14px;
      }
      .wizard-install-card.wide {
        grid-column: 1 / -1;
      }
      .install-card-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
      }
      .install-card-head h2 {
        margin: 0;
      }
      .install-card-head p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .install-card-head > span {
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(54, 201, 138, 0.28);
        border-radius: 999px;
        padding: 0 10px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 11px;
        font-weight: 860;
        text-transform: uppercase;
      }
      .install-checklist {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .install-checklist li {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 12px;
        background: var(--surface);
      }
      .install-checklist strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.25;
      }
      .install-checklist span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .install-code {
        max-height: 300px;
      }
      .install-code code {
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
      }
      .diagnostics-output {
        min-width: 0;
      }
      .status-output {
        min-width: 0;
      }
      .diagnostics-actions {
        border-top: 1px solid var(--line);
        padding: 14px 18px;
      }
      .diagnostics-actions .button {
        width: 100%;
      }
      .wizard-output .workflow-panel pre {
        max-height: 380px;
        overflow: auto;
      }
      .wizard-output .preview-output {
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
      }
      .preview-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .audit-result {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 12px;
        background: var(--surface);
      }
      .audit-result strong {
        color: var(--ink);
        font-size: 13px;
      }
      .audit-result span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .preview-editor,
      .preview-output,
      .preview-card {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .preview-editor textarea {
        width: 100%;
        min-height: 590px;
        display: block;
        resize: vertical;
        border: 0;
        border-bottom: 1px solid var(--line);
        padding: 18px 20px;
        outline: none;
        background: var(--surface);
        color: var(--text);
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 13px;
        line-height: 1.55;
      }
      .preview-editor textarea:focus {
        box-shadow: inset 0 0 0 2px rgba(16, 155, 85, 0.22);
      }
      .preview-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px;
      }
      .preview-actions .button[disabled] {
        opacity: 0.72;
        cursor: wait;
      }
      .preview-output {
        display: grid;
        gap: 14px;
        padding: 14px;
      }
      .preview-status {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(54, 201, 138, 0.28);
        border-radius: 7px;
        padding: 14px;
        background: var(--green-soft);
      }
      .preview-status[data-state="error"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
      }
      .preview-status[data-service-state="warn"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
      }
      .preview-status[data-service-state="error"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
      }
      .preview-status[data-service-state="warn"] .mini-shield {
        background: var(--amber);
      }
      .preview-status[data-service-state="error"] .mini-shield {
        background: var(--red);
      }
      .preview-status[data-state="error"] .mini-shield {
        background: var(--red);
      }
      .preview-status strong {
        display: block;
        color: var(--ink);
        font-size: 16px;
      }
      .preview-status p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .preview-result-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .preview-card {
        box-shadow: none;
        padding: 18px;
      }
      .preview-card.wide {
        grid-column: 1 / -1;
      }
      .preview-card h2 {
        margin: 0 0 14px;
        color: var(--ink);
        font-size: 18px;
      }
      .preview-card dl {
        display: grid;
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--line);
        margin: 0;
      }
      .preview-card dl div {
        display: grid;
        grid-template-columns: minmax(120px, 0.62fr) minmax(0, 1fr);
        background: var(--surface);
      }
      .preview-card dt,
      .preview-card dd {
        min-height: 42px;
        display: flex;
        align-items: center;
        margin: 0;
        padding: 10px 12px;
        font-size: 13px;
        line-height: 1.35;
      }
      .preview-card dt {
        color: var(--text);
        background: var(--surface);
        font-weight: 820;
      }
      .preview-card dd {
        color: var(--muted);
        word-break: break-word;
      }
      .status-json {
        max-height: 260px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 12px;
        background: var(--surface);
        color: var(--text);
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.5;
      }
      .diagnostic-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .diagnostic-list li {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 12px;
        background: var(--surface);
      }
      .diagnostic-list li[data-level="error"] {
        border-color: rgba(255, 111, 94, 0.3);
        background: var(--red-bg);
      }
      .diagnostic-list li[data-level="warning"] {
        border-color: rgba(224, 169, 59, 0.3);
        background: rgba(224, 169, 59, 0.14);
      }
      .diagnostic-list strong {
        color: var(--ink);
        font-size: 13px;
      }
      .diagnostic-list span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .policy-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .policy-tags span {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 11px;
        background: var(--surface);
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .policy-tags span[data-enabled="true"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .gate-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 40px 20px;
        background:
          radial-gradient(circle at 50% 24%, rgba(54, 201, 138, 0.10), transparent 36rem),
          radial-gradient(circle at 50% 120%, rgba(54, 201, 138, 0.05), transparent 40rem),
          var(--paper);
      }
      .gate-shell {
        width: min(540px, 100%);
      }
      .gate .notice + .button,
      .gate form + .button,
      .gate .button {
        margin-top: 18px;
      }
      .gate {
        position: relative;
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 38px 34px 30px;
        text-align: center;
        background: color-mix(in srgb, var(--surface) 88%, transparent);
        backdrop-filter: blur(14px) saturate(125%);
        -webkit-backdrop-filter: blur(14px) saturate(125%);
        box-shadow:
          inset 0 1px 0 color-mix(in srgb, var(--text) 9%, transparent),
          0 30px 80px -42px rgba(0, 0, 0, 0.85);
      }
      .gate::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--text) 16%, transparent),
          transparent 55%
        );
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      .gate > * {
        position: relative;
      }
      .gate .brand.centered {
        justify-content: center;
      }
      .gate-step {
        display: block;
        margin: 26px 0 10px;
        font-family: var(--mono);
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--faint);
      }
      .gate-seal {
        width: 56px;
        height: 56px;
        margin: 0 auto 6px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--pass-wash);
        color: var(--pass);
        font-size: 26px;
        font-weight: 700;
      }
      .button .spinner {
        display: none;
        width: 16px;
        height: 16px;
        margin-right: 9px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: gate-spin 0.7s linear infinite;
      }
      .button.is-loading .spinner {
        display: inline-block;
      }
      .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .button.is-loading {
        cursor: wait;
        opacity: 0.92;
      }
      @keyframes gate-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .gate .brand.centered {
        justify-content: flex-start;
      }
      .gate.small {
        width: min(480px, 100%);
      }
      .gate-primary {
        min-height: 100%;
      }
      .gate h1 {
        margin: 22px 0 12px;
        color: var(--ink);
        font-size: clamp(32px, 5vw, 44px);
        line-height: 1.08;
        text-wrap: balance;
      }
      .intro,
      .fine-print {
        color: var(--muted);
        line-height: 1.5;
      }
      .intro {
        margin: 0 0 22px;
        max-width: 620px;
        font-size: 17px;
      }
      .intro strong,
      .intro a,
      .intro code {
        color: var(--ink);
        font-weight: 820;
      }
      .fine-print {
        margin: 16px 0 0;
        max-width: 560px;
        font-size: 14px;
      }
      .status-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        background: var(--surface);
      }
      .status-strip > span {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 52px;
        color: var(--green);
        font-size: 14px;
        font-weight: 760;
      }
      .status-strip > span + span {
        border-left: 1px solid var(--line);
      }
      .meta-table {
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        text-align: left;
        background: var(--surface);
      }
      .meta-row {
        display: grid;
        grid-template-columns: 1fr 1.05fr;
      }
      .meta-row + .meta-row {
        border-top: 1px solid var(--line);
      }
      .meta-row > div {
        min-height: 54px;
        display: flex;
        align-items: center;
        padding: 0 22px;
        font-size: 16px;
      }
      .meta-row > div:first-child {
        color: var(--text);
        background: var(--surface);
        border-right: 1px solid var(--line);
        font-weight: 680;
      }
      .turnstile-wrap {
        display: grid;
        place-items: center;
        min-height: 72px;
      }
      .button.full {
        width: 100%;
        min-height: 54px;
        margin-top: 22px;
        font-size: 17px;
      }
      .gate-complete-action .button.full {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .notice {
        margin: 0 0 18px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 14px 16px;
        font-size: 15px;
        line-height: 1.45;
        text-align: left;
      }
      .notice strong,
      .notice span {
        display: block;
      }
      .notice strong {
        margin-bottom: 4px;
      }
      .notice.error {
        background: var(--red-bg);
        border-color: rgba(255, 111, 94, 0.3);
        color: var(--red);
      }
      .notice.success {
        background: var(--success-bg);
        border-color: rgba(54, 201, 138, 0.28);
        color: var(--green-dark);
      }
      .gate-side {
        display: grid;
        gap: 18px;
        align-content: start;
      }
      .gate-panel {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: var(--surface);
        padding: 22px;
        box-shadow: var(--shadow-soft);
      }
      .gate-panel-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 14px;
      }
      .gate-panel h2 {
        margin: 0;
        color: var(--ink);
        font-size: 18px;
        line-height: 1.2;
      }
      .gate-panel p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .gate-status-badge {
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        border: 1px solid #f2d085;
        border-radius: 999px;
        padding: 0 10px;
        background: rgba(224, 169, 59, 0.14);
        color: var(--amber);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .gate-status-badge[data-state="verified"] {
        border-color: rgba(54, 201, 138, 0.28);
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .gate-receipt-list {
        margin: 18px 0 0;
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
      }
      .gate-receipt-list div {
        display: grid;
        grid-template-columns: 0.86fr minmax(0, 1.14fr);
      }
      .gate-receipt-list div + div {
        border-top: 1px solid var(--line);
      }
      .gate-receipt-list dt,
      .gate-receipt-list dd {
        margin: 0;
        min-height: 46px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        font-size: 13px;
      }
      .gate-receipt-list dt {
        border-right: 1px solid var(--line);
        background: var(--faint);
        color: var(--text);
        font-weight: 760;
      }
      .gate-receipt-list dd {
        min-width: 0;
        color: var(--muted);
        overflow-wrap: anywhere;
      }
      .gate-receipt-list a {
        color: var(--ink);
        font-weight: 720;
      }
      .gate-check-list {
        display: grid;
        gap: 12px;
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
      }
      .gate-check-list li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface);
        padding: 13px;
      }
      .gate-check-icon {
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 13px;
        font-weight: 900;
      }
      .gate-check-list strong,
      .gate-check-list small {
        display: block;
      }
      .gate-check-list strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.2;
      }
      .gate-check-list small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      @media (prefers-reduced-transparency: reduce) {
        .site-header {
          background: var(--surface);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
      }
      @media (max-width: 980px) {
        .site-header,
        .home,
        .preview-page,
        .site-footer {
          width: min(100% - 32px, 1200px);
        }
        .site-header {
          align-items: flex-start;
          flex-direction: column;
          margin: 0 auto;
          padding: 18px 0;
        }
        .site-nav {
          width: 100%;
          flex-wrap: wrap;
          gap: 18px;
        }
        .site-nav a {
          flex: 0 0 auto;
        }
        .header-cta {
          width: 100%;
        }
        .hero,
        .preview-heading,
        .queue-shell,
        .evidence-shell,
        .radar-shell,
        .radar-query-strip,
        .pilot-shell,
        .pilot-card-grid,
        .trust-shell,
        .badge-shell,
        .proof-shell,
        .scorecard-adoption-grid,
        .manifest-shell,
        .manifest-callback-shell,
        .launch-decision-strip,
        .launch-shell,
        .launch-gaps,
        .launch-adoption-grid,
        .gate-shell,
        .rehearsal-shell,
        .trace-shell,
        .demo-shell,
        .demo-pr-grid,
        .demo-install-strip,
        .demo-next,
        .preview-shell,
        .wizard-shell,
        .diagnostics-shell,
        .status-shell,
        .setup-section,
        .security-band,
        .pressure-section,
        .site-footer {
          grid-template-columns: 1fr;
        }
        .hero {
          min-height: auto;
          gap: 34px;
        }
        .product-stage {
          grid-template-columns: 1fr;
        }
        .hero-proof-grid {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .pressure-copy {
          max-width: 760px;
        }
        .pressure-accordion {
          min-height: 420px;
        }
        .audit-stream {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .scorecard-action-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .proof-card,
        .proof-card:first-child,
        .proof-card:nth-child(2),
        .proof-card:nth-child(3) {
          transform: none;
        }
        .timeline {
          border-top: 0;
        }
        .timeline-item {
          min-height: auto;
          padding: 18px 0 18px 44px;
          border-left: 1px solid var(--line);
        }
        .timeline-item:first-child {
          border-left: 1px solid var(--line);
        }
        .timeline-item span {
          position: absolute;
          top: 18px;
          left: -15px;
        }
        .section-heading.split {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .security-grid,
        .ready-panel,
        .preview-result-grid,
        .demo-next-actions,
        .footer-points {
          grid-template-columns: 1fr;
        }
        .demo-next-actions {
          justify-content: flex-start;
        }
        .evidence-controls {
          position: static;
        }
        .wizard-output {
          position: static;
        }
        .trust-rail {
          position: static;
        }
        .evidence-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .demo-lab-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .demo-lab-strip div:nth-child(2) {
          border-right: 0;
        }
        .demo-lab-strip div:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }
        .demo-install-strip {
          align-items: stretch;
        }
        .demo-install-strip .button {
          width: fit-content;
        }
      }
      @media (max-width: 720px) {
        .comparison-wrap {
          display: none;
        }
        .integration-mobile {
          display: grid;
          gap: 14px;
        }
        .integration-card {
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--surface);
          padding: 18px;
        }
        .integration-card h3 {
          margin: 0 0 14px;
          color: var(--ink);
          font-size: 18px;
        }
        .integration-card ul {
          display: grid;
          gap: 9px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .integration-card li {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.45;
        }
        .integration-card li::before {
          content: "✓";
          color: var(--green);
          font-weight: 900;
          margin-right: 8px;
        }
      }
      @media (max-width: 560px) {
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }
        body {
          background-size: 52px 52px;
        }
        .site-header,
        .home,
        .preview-page,
        .site-footer {
          width: calc(100% - 32px);
          max-width: calc(100% - 32px);
        }
        .site-header {
          gap: 16px;
        }
        .site-nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding-bottom: 0;
          font-size: 13px;
          line-height: 1;
        }
        .site-nav a {
          min-width: 0;
          overflow: hidden;
          text-align: center;
          text-overflow: ellipsis;
        }
        .site-nav a:nth-child(4),
        .site-nav a:nth-child(5),
        .site-nav a:nth-child(6),
        .site-nav a:nth-child(8),
        .site-nav a:nth-child(9),
        .site-nav a:nth-child(10) {
          display: none;
        }
        .utility-header .site-nav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .utility-header .site-nav a:nth-child(4),
        .utility-header .site-nav a:nth-child(8) {
          display: block;
        }
        .utility-header .site-nav a:nth-child(5),
        .utility-header .site-nav a:nth-child(6),
        .utility-header .site-nav a:nth-child(7),
        .utility-header .site-nav a:nth-child(9) {
          display: none;
        }
        .rehearsal-header .site-nav {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .rehearsal-header .site-nav a:nth-child(3),
        .rehearsal-header .site-nav a:nth-child(4),
        .rehearsal-header .site-nav a:nth-child(8),
        .rehearsal-header .site-nav a:nth-child(10) {
          display: none;
        }
        .rehearsal-header .site-nav a:nth-child(5),
        .rehearsal-header .site-nav a:nth-child(6),
        .rehearsal-header .site-nav a:nth-child(7),
        .rehearsal-header .site-nav a:nth-child(9) {
          display: block;
        }
        .trace-header .site-nav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .trace-header .site-nav a:nth-child(4),
        .trace-header .site-nav a:nth-child(6),
        .trace-header .site-nav a:nth-child(7),
        .trace-header .site-nav a:nth-child(9) {
          display: none;
        }
        .trace-header .site-nav a:nth-child(5),
        .trace-header .site-nav a:nth-child(8) {
          display: block;
        }
        .proof-header .site-nav a:nth-child(5) {
          display: block;
        }
        .proof-header .site-nav a:nth-child(8) {
          display: none;
        }
        .manifest-header .site-nav a:nth-child(6) {
          display: block;
        }
        .manifest-header .site-nav a:nth-child(8) {
          display: none;
        }
        .brand {
          font-size: 24px;
        }
        .header-cta {
          display: none;
        }
        .hero-copy h1 {
          font-size: clamp(42px, 12vw, 54px);
          line-height: 1;
          margin-bottom: 16px;
        }
        .preview-heading h1 {
          max-width: 100%;
          font-size: 42px;
          line-height: 1.02;
          overflow-wrap: break-word;
          text-wrap: auto;
        }
        .preview-heading p {
          max-width: 100%;
          font-size: 16px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .preview-heading .actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .preview-heading .actions .button {
          width: 100%;
        }
        .demo-lab-strip {
          grid-template-columns: 1fr;
        }
        .demo-lab-strip div {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .demo-lab-strip div:last-child {
          border-bottom: 0;
        }
        .demo-install-strip {
          padding: 16px;
        }
        .demo-install-strip pre {
          max-height: 160px;
          font-size: 11px;
        }
        .demo-install-strip .button {
          width: 100%;
        }
        .hero-copy p {
          font-size: 17px;
          line-height: 1.42;
        }
        .evidence-presets,
        .evidence-metrics,
        .evidence-recommendation dl,
        .pilot-presets,
        .pilot-metrics {
          grid-template-columns: 1fr;
        }
        .evidence-share div {
          grid-template-columns: 1fr;
        }
        .evidence-share .button {
          width: 100%;
        }
        .evidence-brief-actions {
          grid-template-columns: 1fr;
        }
        .evidence-brief-actions .button {
          width: 100%;
        }
        .evidence-pr-row {
          grid-template-columns: 1fr;
        }
        .radar-proof,
        .radar-totals div,
        .radar-row,
        .trust-doc-row {
          grid-template-columns: 1fr;
        }
        .trust-readiness small,
        .trust-doc-row p,
        .trust-checklist span {
          overflow-wrap: anywhere;
        }
        .trust-doc-row code {
          text-align: left;
        }
        .evidence-author {
          text-align: left;
        }
        .scorecard-action-grid {
          grid-template-columns: 1fr;
        }
        .scorecard-action {
          min-height: 92px;
        }
        .launch-adoption-issue .preview-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .launch-adoption-issue .button {
          width: 100%;
        }
        .rehearsal-output-actions .button,
        .trace-output-actions .button {
          width: 100%;
        }
        .hero {
          gap: 18px;
          padding-bottom: 18px;
        }
        .product-stage {
          display: grid;
          gap: 12px;
        }
        .hero-media figcaption {
          position: static;
          width: auto;
          padding: 13px 14px;
          color: var(--ink);
          background: var(--surface);
          text-shadow: none;
        }
        .hero-media figure::after {
          display: none;
        }
        .hero-proof-grid {
          grid-template-columns: 1fr;
        }
        .hero-proof-grid div {
          min-height: 64px;
          padding: 13px 14px;
        }
        .pressure-section {
          margin-top: 44px;
        }
        .pressure-copy h2 {
          font-size: clamp(34px, 10vw, 46px);
        }
        .pressure-copy p {
          font-size: 16px;
          line-height: 1.45;
        }
        .pressure-accordion {
          min-height: auto;
          display: grid;
          grid-template-columns: 1fr;
        }
        .pressure-panel,
        .pressure-panel:first-child,
        .pressure-panel:hover,
        .pressure-panel:focus-within {
          min-height: 220px;
          flex: none;
        }
        .pressure-panel {
          border-right: 0;
          border-bottom: 1px solid var(--surface);
        }
        .pressure-panel:last-child {
          border-bottom: 0;
        }
        .pressure-panel p {
          width: auto;
        }
        .repo-topbar {
          min-height: 46px;
          padding: 0 12px;
          font-size: 13px;
        }
        .repo-topbar span {
          font-size: 11px;
        }
        .repo-pr {
          padding: 10px 12px;
        }
        .repo-pr h2 {
          font-size: 18px;
        }
        .repo-pr p,
        .check-body p {
          display: none;
        }
        .repo-pr p,
        .check-body p,
        .bot-comment p,
        .gate-card p {
          font-size: 12px;
        }
        .checks {
          margin: 0 12px 12px;
        }
        .check-row {
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          padding: 8px 10px;
        }
        .check-row button {
          grid-column: 2;
          width: fit-content;
          min-height: 32px;
          padding: 0 14px;
        }
        .audit-stream {
          grid-template-columns: 1fr;
          margin: 0 12px 12px;
        }
        .audit-stream div {
          min-height: 48px;
          grid-template-columns: auto minmax(0, 1fr);
          padding: 9px 11px;
        }
        .bot-comment {
          margin: 0 12px 12px;
          padding: 12px;
        }
        .gate-card {
          padding: 14px;
        }
        .gate-brand {
          margin-bottom: 12px;
        }
        .gate-card h3 {
          font-size: 18px;
        }
        .gate-card dl {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 14px 0;
        }
        .gate-card dd {
          font-size: 13px;
        }
        .captcha-box {
          min-height: 54px;
        }
        .proof-line {
          margin-top: 16px !important;
          font-size: 17px !important;
        }
        .success-shield {
          width: 28px;
          height: 28px;
        }
        .signal-rail {
          display: none;
        }
        .proof-section {
          margin-top: 14px;
        }
        .setup-section {
          margin-top: 34px;
        }
        .setup-copy h2 {
          font-size: 30px;
        }
        .setup-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .setup-step {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .setup-step a {
          grid-column: 2;
        }
        .panel-top {
          align-items: flex-start;
          flex-direction: column;
          justify-content: center;
          padding: 12px 16px;
        }
        .workflow-panel pre {
          padding: 16px;
        }
        .setup-signals {
          grid-template-columns: 1fr;
        }
        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .actions .button {
          width: 100%;
          min-width: 0;
          padding: 0 12px;
          white-space: normal;
          text-align: center;
        }
        .demo-actions {
          grid-template-columns: 1fr;
        }
        .manifest-actions .button {
          width: 100%;
        }
        .proof-page {
          width: calc(100% - 32px);
          overflow: hidden;
        }
        .proof-heading {
          gap: 16px;
          margin-bottom: 20px;
        }
        .proof-heading h1 {
          font-size: clamp(38px, 11vw, 46px);
          line-height: 1.02;
        }
        .proof-heading p {
          max-width: 100%;
          font-size: 16px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .proof-heading .preview-guarantees {
          gap: 8px;
        }
        .proof-heading .preview-guarantees span {
          min-height: 42px;
          padding: 0 12px;
        }
        .proof-controls .panel-top,
        .proof-live .panel-top,
        .proof-snippets .panel-top {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        .demo-copy-check {
          grid-template-columns: 1fr;
        }
        .demo-copy-check code,
        .demo-copy-check .button {
          width: 100%;
        }
        .demo-check {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .demo-check > span:last-child {
          grid-column: 2;
          justify-self: start;
        }
        .demo-next-actions .button {
          width: 100%;
        }
        .header-cta,
        .gate-card button,
        .button.full {
          width: 100%;
        }
        .audit-stream,
        .bot-comment,
        .gate-card {
          display: none;
        }
        .proof-card img {
          height: 220px;
          aspect-ratio: auto;
          object-fit: cover;
          object-position: top left;
          background: var(--faint);
        }
        .timeline-section,
        .integration-section {
          padding: 18px;
        }
        .timeline-section h2,
        .integration-section h2,
        .roadmap-section h2,
        .security-band h2 {
          font-size: 30px;
          text-align: left;
        }
        .section-heading {
          margin-bottom: 22px;
          text-align: left;
        }
        .section-heading h2 {
          font-size: 30px;
        }
        .section-heading p {
          font-size: 16px;
        }
        .section-heading span {
          white-space: normal;
        }
        .preview-page {
          padding-top: 24px;
        }
        .preview-heading {
          gap: 18px;
          margin-bottom: 20px;
        }
        .preview-heading h1 {
          font-size: clamp(38px, 11vw, 52px);
        }
        .preview-heading p {
          font-size: 16px;
          line-height: 1.48;
        }
        .preview-guarantees {
          gap: 8px;
        }
        .preview-editor textarea {
          min-height: 480px;
          padding: 14px;
          font-size: 12px;
        }
        .preview-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .preview-actions .button {
          width: 100%;
        }
        .preview-card dl div {
          grid-template-columns: 1fr;
        }
        .preview-card dt {
          min-height: 34px;
        }
        .preview-card dd {
          min-height: 38px;
        }
        .status-tile {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .status-tile > strong {
          grid-column: 2;
          justify-self: start;
        }
        .wizard-group {
          grid-template-columns: 1fr;
          padding: 14px;
        }
        .wizard-group.diagnostics-fields:first-of-type {
          grid-template-columns: 1fr;
        }
        .wizard-choice {
          min-height: auto;
        }
        .wizard-output .workflow-panel pre {
          max-height: 520px;
        }
        .wizard-install-grid,
        .install-card-head {
          grid-template-columns: 1fr;
        }
        .install-card-head .button {
          width: 100%;
        }
        .install-code {
          max-height: 240px;
        }
        .wizard-evidence-head,
        .wizard-evidence dl,
        .wizard-handoff {
          grid-template-columns: 1fr;
        }
        .comparison-table th,
        .comparison-table td {
          padding: 14px;
        }
        .security-band,
        .site-footer {
          padding: 22px;
        }
        .gate-page {
          align-items: start;
          padding: 30px 16px;
        }
        .gate {
          padding: 24px 18px;
        }
        .status-strip,
        .meta-row,
        .gate-receipt-list div {
          grid-template-columns: 1fr;
        }
        .status-strip > span + span,
        .meta-row > div:first-child,
        .gate-receipt-list dt {
          border-left: 0;
          border-right: 0;
          border-top: 1px solid var(--line);
        }
        .meta-row > div:first-child {
          min-height: 42px;
          background: var(--faint);
        }
        .meta-row > div {
          padding: 0 16px;
        }
        .gate-panel {
          padding: 18px;
        }
        .gate-receipt-list dt,
        .gate-receipt-list dd {
          min-height: 40px;
        }
      }
      svg .m-tile { fill: #f3f3f4; }
      svg .m-blk { fill: #15181e; }
      svg .m-face { fill: #ffffff; stroke: #15181e; stroke-width: 1; }
      svg .m-glare { fill: #ffffff; opacity: 0.9; }
      svg .m-line { fill: none; stroke: #15181e; stroke-width: 1; stroke-linecap: round; }
    </style>
  </head>
  <body><a class="skip-link" href="#main">Skip to content</a>${body}<script>
    (function () {
      var root = document.documentElement;
      function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
      function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
      root.setAttribute("data-theme", get("theme", "dark"));
      var btn = document.getElementById("theme");
      if (btn) {
        function sync() { btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀" : "☾"; }
        sync();
        btn.addEventListener("click", function () {
          var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
          root.setAttribute("data-theme", next); set("theme", next); sync();
        });
      }
    })();
  </script></body>
</html>`;
}

export function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

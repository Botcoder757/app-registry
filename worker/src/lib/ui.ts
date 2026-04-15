import type { DevSession } from './session';

export const CSS = `
  :root {
    --bg: #000000;
    --bg-raised: #1c1c1e;
    --surface: #1c1c1e;
    --surface-hover: #2c2c2e;
    --surface-active: #3a3a3c;
    --border: rgba(255, 255, 255, 0.1);
    --border-strong: rgba(255, 255, 255, 0.2);
    --text: #f5f5f7;
    --text-secondary: #86868b;
    --text-muted: #86868b;
    --text-subtle: #636366;
    --accent: #0A84FF;
    --accent-hover: #409CFF;
    --accent-muted: rgba(10, 132, 255, 0.15);
    --danger: #FF453A;
    --ok: #32D74B;
    --font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 20px;
    --radius-xl: 24px;
    --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }
  
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html { height:100%; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    font-size: 15px;
    line-height: 1.5;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    letter-spacing: -0.01em;
  }
  a { color: var(--accent); text-decoration: none; transition: color 0.2s; }
  a:hover { color: var(--accent-hover); }
  
  /* Nav */
  .nav {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nav-left, .nav-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 17px;
    color: var(--text);
    letter-spacing: -0.02em;
  }
  .logo:hover { color: var(--accent); text-decoration: none; }
  .nav-links {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  .nav-links a {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
  }
  .nav-links a:hover { color: var(--text); }
  .nav-links a.active { color: var(--text); font-weight: 600; }

  /* User Menu */
  .user-menu { position: relative; }
  .user-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: rgba(255,255,255,0.05);
    border: none;
    border-radius: 999px;
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all .2s;
  }
  .user-trigger:hover {
    background: rgba(255,255,255,0.1);
  }
  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--surface);
  }
  .user-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    background: rgba(30, 30, 30, 0.85);
    backdrop-filter: blur(30px) saturate(200%);
    -webkit-backdrop-filter: blur(30px) saturate(200%);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 8px;
    min-width: 180px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--shadow);
    z-index: 100;
  }
  .user-menu.open .user-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  .user-dropdown a, .user-dropdown button {
    display: block;
    width: 100%;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    text-decoration: none;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
  }
  .user-dropdown a:hover, .user-dropdown button:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .user-dropdown form { margin: 0; padding: 0; }
  .user-dropdown button.danger { color: var(--danger); }

  /* Main & Footer */
  main { flex: 1; }
  .footer {
    border-top: 1px solid var(--border);
    padding: 40px 24px;
    margin-top: 64px;
    color: var(--text-secondary);
    font-size: 13px;
    text-align: center;
  }

  /* Typography */
  h1, h2, h3, h4 { letter-spacing: -0.02em; color: var(--text); }
  
  /* Hero */
  .hero {
    text-align: center;
    padding: 80px 24px 60px;
    background: radial-gradient(circle at top, rgba(10, 132, 255, 0.15) 0%, transparent 70%);
  }
  .hero h1 {
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -0.04em;
    margin-bottom: 16px;
    line-height: 1.1;
  }
  .hero-subtitle {
    font-size: 22px;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto 32px;
    font-weight: 400;
  }
  .search-form { max-width: 560px; margin: 0 auto; }
  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 16px;
    color: var(--text-secondary);
    pointer-events: none;
  }
  .search-box input {
    width: 100%;
    padding: 16px 20px 16px 48px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: rgba(255,255,255,0.05);
    color: var(--text);
    font-size: 17px;
    font-family: var(--font);
    outline: none;
    transition: all 0.2s;
    backdrop-filter: blur(10px);
  }
  .search-box input:focus { 
    border-color: var(--accent); 
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 0 4px var(--accent-muted);
  }
  .search-box input::placeholder { color: var(--text-subtle); font-weight: 400; }

  /* Category Chips */
  .category-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 32px;
  }
  .chip {
    padding: 8px 18px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    background: rgba(255,255,255,0.08);
    color: var(--text);
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  .chip:hover { 
    background: rgba(255,255,255,0.12);
    text-decoration: none;
    transform: scale(1.02);
  }
  .chip.active { 
    background: var(--text);
    color: var(--bg);
  }

  /* Featured Section */
  .featured-section {
    max-width: 1200px; margin: 0 auto; padding: 48px 24px 24px;
  }
  .featured-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
  }
  .featured-header h2 { font-size: 24px; font-weight: 700; }
  .featured-badge {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 4px 10px; background: var(--accent);
    color: #fff; border-radius: 999px;
  }
  .featured-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }
  .featured-card {
    display: flex; gap: 16px; padding: 20px;
    background: var(--surface);
    border: 1px solid var(--border); 
    border-radius: var(--radius-xl);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    color: var(--text);
    text-decoration: none;
  }
  .featured-card:hover { 
    background: var(--surface-hover);
    border-color: var(--border-strong);
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--shadow);
    color: var(--text);
    text-decoration: none;
  }
  .featured-icon { width: 64px; height: 64px; border-radius: 18px; flex-shrink: 0; object-fit: cover; background: var(--bg-raised); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
  .featured-info { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .featured-name { font-weight: 600; font-size: 17px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .verified-badge, .verified-badge-lg { 
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--accent); color: #fff;
    border-radius: 50%; font-weight: 700;
  }
  .verified-badge { width: 14px; height: 14px; font-size: 9px; }
  .verified-badge-lg { width: 18px; height: 18px; font-size: 11px; }
  .featured-desc { font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px; }
  .featured-meta { font-size: 12px; color: var(--text-subtle); display: flex; align-items: center; gap: 6px; }

  /* Browse layout */
  .browse-layout {
    max-width: 1200px; margin: 0 auto; padding: 48px 24px;
    display: grid; grid-template-columns: 240px 1fr; gap: 40px;
  }
  @media (max-width: 768px) {
    .browse-layout { grid-template-columns: 1fr; }
    .sidebar { display: flex; flex-wrap: wrap; gap: 8px; }
    .sidebar h3 { width: 100%; margin-bottom: 8px; }
  }
  .sidebar h3 { font-size: 17px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
  .cat-link {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; border-radius: var(--radius-sm); font-size: 15px;
    color: var(--text-secondary); transition: all 0.2s;
    margin-bottom: 4px;
  }
  .cat-link:hover { color: var(--text); background: var(--surface); text-decoration: none; }
  .cat-link.active { color: var(--text); background: var(--surface); font-weight: 600; }
  .cat-count { font-size: 13px; color: var(--text-subtle); font-weight: 400; }

  .browse-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .browse-header h2 { font-size: 24px; font-weight: 700; margin: 0; }
  .result-count { font-size: 14px; color: var(--text-secondary); }

  /* App grid */
  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  .app-card {
    display: flex; gap: 16px; padding: 16px;
    background: transparent;
    border-radius: var(--radius-lg); transition: all 0.2s;
    color: var(--text);
  }
  .app-card:hover { background: var(--surface); text-decoration: none; transform: scale(1.02); }
  .app-card:active { transform: scale(0.98); }
  .app-icon { width: 64px; height: 64px; border-radius: 16px; flex-shrink: 0; object-fit: cover; background: var(--surface); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
  .app-info { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .app-name { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
  .app-desc { font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 6px; }
  .app-meta { font-size: 12px; color: var(--text-subtle); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .meta-sep { opacity: 0.3; }
  .stars { color: var(--text); letter-spacing: -1px; font-size: 12px; }
  .star-empty { opacity: 0.3; }
  .badge-ui { font-size: 10px; background: var(--surface-hover); color: var(--text); padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-auth { font-size: 10px; background: rgba(255, 149, 0, 0.15); color: #FF9F0A; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .tag { font-size: 11px; background: var(--surface); color: var(--text-secondary); padding: 4px 10px; border-radius: 9999px; }

  .empty { text-align: center; padding: 80px 20px; color: var(--text-secondary); }
  .empty p { margin-top: 12px; font-size: 16px; }
  .empty svg { opacity: 0.3; }

  .pagination { display: flex; justify-content: center; gap: 24px; align-items: center; margin-top: 48px; font-size: 15px; }
  .pagination a { padding: 8px 16px; background: var(--surface); border-radius: 999px; font-weight: 500; }
  .pagination a:hover { background: var(--surface-hover); color: var(--text); }
  .page-info { color: var(--text-secondary); font-variant-numeric: tabular-nums; }

  /* Detail page */
  .detail-layout {
    max-width: 1000px; margin: 0 auto; padding: 48px 24px;
    display: grid; grid-template-columns: 320px 1fr; gap: 48px;
  }
  @media (max-width: 768px) {
    .detail-layout { grid-template-columns: 1fr; }
    .detail-sidebar { position: static; }
  }
  
  .detail-sidebar { position: sticky; top: 96px; height: fit-content; }
  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 15px; color: var(--accent); margin-bottom: 24px;
    font-weight: 500; transition: color 0.2s;
  }
  .back-link:hover { color: var(--accent-hover); text-decoration: none; }
  
  .sidebar-card {
    background: transparent;
    margin-bottom: 32px;
  }
  .sidebar-icon { width: 128px; height: 128px; border-radius: 28px; margin-bottom: 20px; background: var(--surface); box-shadow: 0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1); }
  .sidebar-title h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; line-height: 1.2; }
  .sidebar-author { font-size: 16px; color: var(--text-secondary); font-weight: 500; }
  
  .btn-sidebar {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px; border-radius: 999px;
    background: var(--accent); color: #fff; font-size: 16px; font-weight: 600;
    transition: all 0.2s; margin-top: 24px; border: none;
  }
  .btn-sidebar:hover { background: var(--accent-hover); transform: scale(1.02); text-decoration: none; }
  .btn-sidebar:active { transform: scale(0.98); }
  
  .sidebar-stats {
    display: flex; gap: 24px; margin: 24px 0; padding: 24px 0;
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  }
  .stat { flex: 1; }
  .stat-value { display: block; font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .stat-label { display: block; font-size: 12px; color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .sidebar-meta { margin-bottom: 24px; }
  .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .meta-label { color: var(--text-secondary); font-weight: 500; }
  .meta-value { color: var(--text); font-weight: 500; }
  
  .sidebar-section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: var(--text); }
  .sidebar-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
  .sidebar-text strong { color: var(--text); }
  
  .detail-content { min-width: 0; }
  .detail-desc { margin-bottom: 40px; }
  .detail-desc .lead { font-size: 20px; font-weight: 500; color: var(--text); line-height: 1.4; margin-bottom: 20px; letter-spacing: -0.01em; }
  .long-desc { font-size: 16px; color: var(--text-secondary); line-height: 1.6; }

  .detail-section { margin-bottom: 40px; }
  .detail-section h3 { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: var(--text); }

  .screenshots { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; margin: 0 -24px; padding-left: 24px; padding-right: 24px; scroll-snap-type: x mandatory; }
  .screenshots::-webkit-scrollbar { display: none; }
  .screenshots img { height: 400px; width: auto; border-radius: var(--radius-lg); border: 1px solid var(--border); flex-shrink: 0; object-fit: cover; scroll-snap-align: start; box-shadow: var(--shadow); }

  .tools-list { display: flex; flex-direction: column; gap: 12px; }
  .tool-item { display: flex; flex-direction: column; gap: 6px; padding: 16px; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); }
  .tool-item code { color: var(--text); font-family: var(--mono); font-size: 14px; font-weight: 600; }
  .tool-item span { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }

  .perms-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .perm-item { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; background: var(--surface); border-radius: var(--radius-lg); }
  .perm-key { color: var(--text); font-weight: 600; font-size: 14px; }
  .perm-val { color: var(--text-secondary); font-size: 13px; font-family: var(--mono); }

  .detail-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 40px; }

  .versions-list { display: flex; flex-direction: column; gap: 16px; }
  .version-item { padding: 20px; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); }
  .version-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .version-head strong { font-size: 16px; }
  .version-date { font-size: 14px; color: var(--text-secondary); }
  .version-changelog { font-size: 15px; color: var(--text-secondary); line-height: 1.6; }

  .reviews-list { display: flex; flex-direction: column; gap: 16px; }
  .review-item { padding: 20px; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); }
  .review-head { font-size: 14px; color: var(--text-secondary); display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .review-user { color: var(--text); font-weight: 600; }
  .review-item p { font-size: 15px; color: var(--text); line-height: 1.6; }

  /* Buttons & Misc */
  .btn, .btn-primary, .btn-outline {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; border-radius: 999px; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: all .2s; border: none; text-decoration: none;
  }
  .btn, .btn-primary { background: var(--text); color: var(--bg); }
  .btn:hover, .btn-primary:hover { transform: scale(1.02); }
  .btn-outline { background: rgba(255,255,255,0.1); color: var(--text); backdrop-filter: blur(10px); }
  .btn-outline:hover { background: rgba(255,255,255,0.15); }

  .btn-secondary { background: var(--surface-hover); color: var(--text); }
  .btn-secondary:hover { background: var(--surface-active); }
  .btn-gh { background: #24292f; color: #fff; }
  .btn-gh:hover { background: #2c3238; color: #fff; text-decoration: none; }
  .btn-sm { padding: 6px 14px; font-size: 13px; }

  pre {
    background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-lg);
    padding: 20px; overflow-x: auto; margin: 16px 0; font-size: 14px; line-height: 1.6;
  }
  code { font-family: var(--mono); font-size: 0.9em; }
  p code, li code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 6px; color: var(--text); }

  /* Dev Dashboard */
  .container { max-width: 1000px; margin: 0 auto; padding: 48px 24px 96px; }
  .container>h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
  h2 { font-size: 20px; font-weight: 700; margin: 40px 0 20px; color: var(--text); }
  p.lede { color: var(--text-secondary); font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
  
  .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 32px; }
  .app-card-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .app-card-title { flex: 1; min-width: 0; }
  .app-card-title h3 { font-size: 18px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
  .app-card-title .repo { font-size: 13px; color: var(--text-secondary); }
  .app-card-meta { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .badge { font-size: 12px; padding: 4px 12px; border-radius: 999px; background: var(--surface-hover); color: var(--text); font-weight: 500; }
  .badge-accent { background: var(--accent-muted); color: var(--accent); }
  .app-card-footer { margin-top: auto; display: flex; gap: 10px; }
  
  .login-card { max-width: 440px; margin: 100px auto; text-align: center; padding: 48px 40px; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow); }
  .login-card h1 { margin-bottom: 12px; font-size: 28px; font-weight: 800; }
  .login-card p { color: var(--text-secondary); font-size: 16px; margin-bottom: 32px; line-height: 1.6; }
  
  .app-layout { display: grid; grid-template-columns: 1fr 360px; gap: 40px; }
  @media(max-width: 768px) { .app-layout { grid-template-columns: 1fr; } }
  .main-content { min-width: 0; }
  .main-content>h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
  .sidebar { position: sticky; top: 96px; height: fit-content; }
  .sidebar-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; margin-bottom: 20px; }
  .sidebar-section h3 { font-size: 16px; font-weight: 700; margin-bottom: 20px; }
  
  .env-list { display: flex; flex-direction: column; gap: 12px; }
  .env-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: transparent; border-radius: var(--radius-lg); border: 1px solid var(--border); }
  .env-key { font-family: var(--mono); font-size: 15px; font-weight: 600; color: var(--text); min-width: 140px; }
  .env-meta { flex: 1; font-size: 13px; color: var(--text-secondary); }
  .env-actions { display: flex; gap: 8px; }
  
  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; font-size: 14px; color: var(--text); margin-bottom: 8px; font-weight: 600; }
  input[type=text], input[type=password] {
    width: 100%; padding: 14px 16px; background: rgba(0,0,0,0.5); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text); font-family: var(--mono); font-size: 15px; outline: none;
    transition: all 0.2s;
  }
  input:focus { border-color: var(--accent); background: #000; box-shadow: 0 0 0 4px var(--accent-muted); }
  
  .flash { padding: 16px 20px; border-radius: var(--radius-lg); margin-bottom: 32px; font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 12px; }
  .flash-ok { background: rgba(50, 215, 75, 0.15); border: 1px solid rgba(50, 215, 75, 0.3); color: var(--ok); }
  .flash-error { background: rgba(255, 69, 58, 0.15); border: 1px solid rgba(255, 69, 58, 0.3); color: var(--danger); }
  
  /* Publish Layout Adjustments */
  .publish-page { max-width: 800px; padding-top: 64px; }
  .publish-page h1 { font-size: 40px; font-weight: 800; margin-bottom: 16px; }
  .subtitle { color: var(--text-secondary); font-size: 18px; margin-bottom: 48px; line-height: 1.6; }
  .publish-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 64px; padding: 24px; background: var(--surface); border-radius: var(--radius-xl); border: 1px solid var(--border); }
  .toc-link { padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600; color: var(--text); background: rgba(255,255,255,0.05); }
  .toc-link:hover { background: rgba(255,255,255,0.1); text-decoration: none; }
  .section { margin-bottom: 64px; }
  .section h2 { font-size: 28px; border-bottom: none; margin-bottom: 24px; }
  .section p { font-size: 16px; color: var(--text-secondary); line-height: 1.6; }
  .publish-cta { text-align: center; padding: 64px 40px; background: radial-gradient(circle at center, var(--surface) 0%, var(--bg) 100%); border: 1px solid var(--border); border-radius: 32px; margin-top: 64px; }
  .publish-cta h2 { font-size: 28px; margin-bottom: 32px; }
  
  /* Utilities */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 9999px; border: 2px solid var(--bg); }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
`;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
}

export interface LayoutOptions {
  activePage?: string;
  session?: DevSession | null;
}

export function layout(title: string, content: string, options: LayoutOptions = {}): string {
  const { activePage = '', session } = options;

  const userMenu = session
    ? `<div class="user-menu">
         <button class="user-trigger" onclick="this.parentElement.classList.toggle('open')">
           <img src="https://github.com/${escapeHtml(session.githubLogin)}.png?size=32" alt="" class="user-avatar" onerror="this.style.display='none'">
           <span>@${escapeHtml(session.githubLogin)}</span>
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
         </button>
         <div class="user-dropdown">
           <a href="/dev/dashboard">Dashboard</a>
           <form action="/dev/logout" method="post">
             <button type="submit" class="danger">Sign out</button>
           </form>
         </div>
       </div>`
    : `<a href="/dev/login" class="btn btn-sm btn-outline">Developer Login</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Construct App Registry</title>
  <meta name="description" content="Browse and discover apps for construct.computer — the AI-powered virtual desktop.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>">
  <style>${CSS}</style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <div class="nav-left">
        <a href="/" class="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span>Construct Registry</span>
        </a>
      </div>
      <div class="nav-right">
        <div class="nav-links">
          <a href="/" class="${activePage === 'browse' ? 'active' : ''}">Discover</a>
          <a href="/publish" class="${activePage === 'publish' ? 'active' : ''}">Publish</a>
          <a href="https://github.com/construct-computer/app-registry" target="_blank" rel="noopener">GitHub</a>
        </div>
        ${userMenu}
      </div>
    </div>
  </nav>
  <main>${content}</main>
  <footer class="footer">
    <div class="footer-inner">
      <p>&copy; 2026 <a href="https://construct.computer">construct.computer</a>. The open app ecosystem.</p>
    </div>
  </footer>
</body>
</html>`;
}

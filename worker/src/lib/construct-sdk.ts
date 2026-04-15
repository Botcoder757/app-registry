/**
 * Construct SDK — the core postMessage bridge and design-system CSS that
 * Construct app UIs load.
 *
 * Served from two locations:
 *   - https://registry.construct.computer/sdk/construct.{js,css}   (stable,
 *     cross-origin, CORS-open — this is the canonical URL apps should use)
 *   - https://{app}.apps.construct.computer/sdk/construct.{js,css}  (same
 *     origin under each app subdomain, kept for back-compat with relative
 *     `/sdk/*` references)
 *
 * When the UI runs inside the Construct desktop, the desktop strips any
 * `<script src="*construct.js*">` / `<link href="*construct.css*">` tags
 * and injects its own inline bridge that additionally exposes
 * `construct.state` and `construct.agent`.
 */

export const CONSTRUCT_SDK_CSS = `/* Construct SDK — Design System */
:root{--c-bg:#0a0a12;--c-surface:rgba(255,255,255,0.04);--c-surface-hover:rgba(255,255,255,0.06);--c-surface-raised:rgba(255,255,255,0.08);--c-text:#e4e4ed;--c-text-secondary:rgba(228,228,237,0.7);--c-text-muted:rgba(228,228,237,0.4);--c-accent:#6366f1;--c-accent-muted:rgba(99,102,241,0.15);--c-border:rgba(255,255,255,0.08);--c-error:#ef4444;--c-error-border:rgba(239,68,68,0.3);--c-error-muted:rgba(239,68,68,0.08);--c-radius-xs:4px;--c-radius-sm:6px;--c-radius-md:10px;--c-shadow:0 1px 3px rgba(0,0,0,0.3);--c-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;--c-font-mono:"SF Mono",SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:var(--c-font);background:var(--c-bg);color:var(--c-text);-webkit-font-smoothing:antialiased}
.app{min-height:100vh}.container{max-width:560px;margin:0 auto}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 14px;border-radius:var(--c-radius-sm);font-size:12px;font-weight:600;font-family:var(--c-font);border:none;cursor:pointer;background:var(--c-accent);color:#fff;transition:all 0.15s}
.btn:hover{filter:brightness(1.1)}.btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 14px;border-radius:var(--c-radius-sm);font-size:12px;font-weight:500;font-family:var(--c-font);border:1px solid var(--c-border);cursor:pointer;background:var(--c-surface);color:var(--c-text-secondary);transition:all 0.15s}
.btn-secondary:hover{background:var(--c-surface-hover);color:var(--c-text)}.btn-sm{padding:5px 10px;font-size:11px}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:var(--c-radius-xs);font-size:10px;font-weight:500;background:var(--c-surface);color:var(--c-text-muted);border:1px solid var(--c-border)}
.badge-accent{background:var(--c-accent-muted);color:var(--c-accent);border-color:transparent}
.fade-in{animation:fadeIn 200ms ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
`;

export const CONSTRUCT_SDK_JS = [
  '/* Construct SDK — Bridge */',
  '(function(){',
  'var pending={};var idCounter=0;',
  'function sendRequest(method,params){',
  'return new Promise(function(resolve,reject){',
  'var id=String(++idCounter);',
  'pending[id]={resolve:resolve,reject:reject};',
  'window.parent.postMessage({type:"construct:request",id:id,method:method,params:params||{}},"*");',
  '});',
  '}',
  'window.addEventListener("message",function(e){',
  'if(!e.data||e.data.type!=="construct:response")return;',
  'var p=pending[e.data.id];if(!p)return;delete pending[e.data.id];',
  'if(e.data.error)p.reject(new Error(e.data.error));else p.resolve(e.data.result);',
  '});',
  'window.construct={',
  'tools:{',
  'call:function(name,args){return sendRequest("tools.call",{tool:name,arguments:args||{}});},',
  'callText:function(name,args){return this.call(name,args).then(function(r){',
  'if(r&&r.ok!==undefined)r=r.result;',
  'if(r&&r.content&&r.content[0])return r.content[0].text||JSON.stringify(r);',
  'if(typeof r==="string")return r;return JSON.stringify(r);',
  '});}',
  '},',
  'ui:{',
  'setTitle:function(t){return sendRequest("ui.setTitle",{title:t});},',
  'getTheme:function(){return sendRequest("ui.getTheme");},',
  'close:function(){return sendRequest("ui.close");}',
  '},',
  'ready:function(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn();}',
  '};',
  '})();',
].join('\n');

/**
 * Response headers for SDK files. CORS is wide open so the SDK can be
 * loaded cross-origin from any app UI (dev at localhost:8787, tunnels,
 * or the published app subdomain).
 */
export const SDK_RESPONSE_HEADERS_JS: Record<string, string> = {
  'Content-Type': 'application/javascript; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
  'Access-Control-Allow-Origin': '*',
};

export const SDK_RESPONSE_HEADERS_CSS: Record<string, string> = {
  'Content-Type': 'text/css; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
  'Access-Control-Allow-Origin': '*',
};

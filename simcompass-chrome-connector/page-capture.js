(() => {
  if (window.__simcompassCaptureInstalled) return;
  window.__simcompassCaptureInstalled = true;
  const API_PREFIX = "/api/";
  const safePaths = [
    /^\/api\/v1\/challenges\/current\/$/,
    /^\/api\/v2\/players\/me\/companies\/$/,
    /^\/api\/v3\/resources\/\d+\/$/,
    /^\/api\/v3\/market-ticker\/\d+\/$/,
    /^\/api\/v3\/market\/recent-resources\/\d+\/$/
  ];
  const isSafeDataPath = path => safePaths.some(pattern => pattern.test(path));
  const redact = (value, depth=0) => {
    if (depth > 12) return null;
    if (Array.isArray(value)) return value.slice(0,5000).map(v=>redact(v,depth+1));
    if (!value || typeof value !== "object") return value;
    const out = {};
    for (const [key,v] of Object.entries(value)) {
      if (/(csrf|token|cookie|enc.?key|password|authorization|session|secret|email)/i.test(key)) continue;
      out[key] = redact(v,depth+1);
    }
    return out;
  };
  const shape = (value, depth=0) => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array[" + value.length + "]" + (value.length && depth < 2 ? "<" + shape(value[0], depth+1) + ">" : "");
    if (typeof value !== "object") return typeof value;
    if (depth >= 2) return "object";
    return "object{" + Object.entries(value).slice(0,24).map(([k,v]) => k + ":" + shape(v,depth+1)).join(",") + "}";
  };
  const publish = (url, data, status) => {
    try {
      const parsed = new URL(url, location.href);
      if (parsed.origin !== location.origin || !parsed.pathname.startsWith(API_PREFIX)) return;
      const keys = data && typeof data === "object" ? Object.keys(data).slice(0,80) : [];
      window.postMessage({
        source: "SIMCOMPASS_READONLY_CAPTURE", type: "API_SCHEMA_DISCOVERY",
        endpoint: parsed.pathname, status, capturedAt: new Date().toISOString(),
        topLevelType: Array.isArray(data) ? "array" : data === null ? "null" : typeof data,
        topLevelKeys: keys, shape: shape(data)
      }, location.origin);
      if (parsed.pathname === "/api/v2/companies/me/buildings/" && Array.isArray(data)) {
        window.postMessage({source:"SIMCOMPASS_READONLY_CAPTURE",type:"BUILDINGS_RESPONSE",capturedAt:new Date().toISOString(),data},location.origin);
      }
      if (isSafeDataPath(parsed.pathname)) {
        const safeData = redact(data);
        if(parsed.pathname==="/api/v1/challenges/current/"&&safeData?.challenge){delete safeData.challenge.end;delete safeData.challenge.deadline;delete safeData.challenge.expiresAt;delete safeData.challenge.endsAt;}
        window.postMessage({source:"SIMCOMPASS_READONLY_CAPTURE",type:"GAME_DATA_RESPONSE",endpoint:parsed.pathname,capturedAt:new Date().toISOString(),data:safeData},location.origin);
      }
    } catch (_) {}
  };
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const result = originalFetch.apply(this,args);
    try {
      const raw = typeof args[0] === "string" ? args[0] : args[0]?.url;
      const parsed = new URL(raw,location.href);
      const method = (args[1]?.method || args[0]?.method || "GET").toUpperCase();
      if (method === "GET" && parsed.origin === location.origin && parsed.pathname.startsWith(API_PREFIX)) {
        result.then(response => {
          if (!response.ok) return;
          response.clone().json().then(data=>publish(parsed.href,data,response.status)).catch(()=>{});
        }).catch(()=>{});
      }
    } catch (_) {}
    return result;
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method,url,...rest) {
    try { const p=new URL(url,location.href);this.__simcompassApiGet=String(method).toUpperCase()==="GET"&&p.origin===location.origin&&p.pathname.startsWith(API_PREFIX);this.__simcompassApiUrl=p.href; }
    catch (_) { this.__simcompassApiGet=false; }
    return originalOpen.call(this,method,url,...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    if(this.__simcompassApiGet)this.addEventListener("load",()=>{if(this.status<200||this.status>=300)return;try{publish(this.__simcompassApiUrl,JSON.parse(this.responseText),this.status)}catch(_){}},{once:true});
    return originalSend.apply(this,args);
  };
})();
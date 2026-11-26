(() => {
  if (window.__simcompassCaptureInstalled) return;
  window.__simcompassCaptureInstalled = true;
  const TARGET = "/api/v2/companies/me/buildings/";
  const publish = (data) => {
    if (!Array.isArray(data)) return;
    window.postMessage({
      source: "SIMCOMPASS_READONLY_CAPTURE",
      type: "BUILDINGS_RESPONSE",
      capturedAt: new Date().toISOString(),
      data
    }, location.origin);
  };

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const result = originalFetch.apply(this, args);
    try {
      const requestUrl = typeof args[0] === "string" ? args[0] : args[0]?.url;
      const parsed = new URL(requestUrl, location.href);
      if (parsed.origin === location.origin && parsed.pathname === TARGET) {
        result.then(response => {
          if (!response.ok) return;
          response.clone().json().then(publish).catch(() => {});
        }).catch(() => {});
      }
    } catch (_) {}
    return result;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    try {
      const parsed = new URL(url, location.href);
      this.__simcompassBuildingsRequest = method === "GET" &&
        parsed.origin === location.origin && parsed.pathname === TARGET;
    } catch (_) {
      this.__simcompassBuildingsRequest = false;
    }
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    if (this.__simcompassBuildingsRequest) {
      this.addEventListener("load", () => {
        if (this.status < 200 || this.status >= 300) return;
        try { publish(JSON.parse(this.responseText)); } catch (_) {}
      }, { once: true });
    }
    return originalSend.apply(this, args);
  };
})();
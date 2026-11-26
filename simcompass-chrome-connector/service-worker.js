const ENDPOINT = "https://www.simcompanies.com/api/v2/companies/me/buildings/";
const COOLDOWN_MS = 5 * 60 * 1000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SIMCOMPASS_FETCH_BUILDINGS") return;
  (async () => {
    const { lastRequestAt = 0 } = await chrome.storage.local.get("lastRequestAt");
    const remaining = COOLDOWN_MS - (Date.now() - lastRequestAt);
    if (remaining > 0) {
      sendResponse({ ok: false, reason: "cooldown", waitMs: remaining });
      return;
    }
    await chrome.storage.local.set({ lastRequestAt: Date.now() });
    try {
      const response = await fetch(ENDPOINT, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        sendResponse({ ok: false, reason: "http", status: response.status });
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        sendResponse({ ok: false, reason: "shape" });
        return;
      }
      sendResponse({ ok: true, data, fetchedAt: new Date().toISOString() });
    } catch (error) {
      sendResponse({ ok: false, reason: "network", detail: String(error?.message || error) });
    }
  })();
  return true;
});
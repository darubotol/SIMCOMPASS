const GAME_ORIGIN = "https://www.simcompanies.com";
const SIMCOMPASS_ORIGIN = "https://darubotol.github.io";

if (location.origin === GAME_ORIGIN) {
  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== GAME_ORIGIN) return;
    const message = event.data;
    if (message?.source !== "SIMCOMPASS_READONLY_CAPTURE" ||
        message?.type !== "BUILDINGS_RESPONSE" ||
        !Array.isArray(message.data)) return;
    chrome.runtime.sendMessage({
      type: "SIMCOMPASS_STORE_CAPTURE",
      data: message.data,
      capturedAt: message.capturedAt
    }).catch(() => {});
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "SIMCOMPASS_SAVE_BUILDINGS") return;
  if (location.origin !== SIMCOMPASS_ORIGIN ||
      !location.pathname.startsWith("/SIMCOMPASS/") ||
      !Array.isArray(message.data)) {
    sendResponse({ ok: false, reason: "wrong-page-or-invalid-data" });
    return;
  }
  try {
    const key = "simcompass.api.challenge.buildings.v1";
    const record = {
      id: "challenge-buildings-" + Date.now(),
      realmAssignment: "challenge",
      endpoint: "/api/v2/companies/me/buildings/",
      capturedAt: message.capturedAt,
      source: "SIMCOMPASS Chrome Connector — captured from the game's successful in-page response",
      count: message.data.length,
      payload: message.data
    };
    localStorage.setItem(key, JSON.stringify(record));
    const historyKey = "simcompass.api.unmapped.v1";
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    history.push(record);
    localStorage.setItem(historyKey, JSON.stringify(history));
    sendResponse({ ok: true, count: message.data.length });
  } catch (error) {
    sendResponse({ ok: false, reason: String(error?.message || error) });
  }
});
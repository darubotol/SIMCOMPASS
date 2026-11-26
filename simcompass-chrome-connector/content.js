chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "SIMCOMPASS_SAVE_BUILDINGS") return;
  if (!Array.isArray(message.data)) {
    sendResponse({ ok: false, reason: "invalid-data" });
    return;
  }
  try {
    const key = "simcompass.api.unmapped.v1";
    const snapshots = JSON.parse(localStorage.getItem(key) || "[]");
    snapshots.push({
      id: "extension-buildings-" + Date.now(),
      realmAssignment: "unverified",
      endpoint: "/api/v2/companies/me/buildings/",
      capturedAt: message.fetchedAt,
      source: "SIMCOMPASS Chrome Connector (user-triggered GET)",
      topLevelKeys: message.data.length ? Object.keys(message.data[0]) : [],
      payload: message.data
    });
    localStorage.setItem(key, JSON.stringify(snapshots));
    sendResponse({ ok: true, count: message.data.length });
  } catch (error) {
    sendResponse({ ok: false, reason: String(error?.message || error) });
  }
});
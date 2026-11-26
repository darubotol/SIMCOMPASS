chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SIMCOMPASS_STORE_CAPTURE") {
    if (!sender.url?.startsWith("https://www.simcompanies.com/") ||
        !Array.isArray(message.data)) {
      sendResponse({ ok: false, reason: "untrusted-source-or-invalid-data" });
      return;
    }
    chrome.storage.local.set({
      pendingBuildingsSnapshot: {
        data: message.data,
        capturedAt: message.capturedAt || new Date().toISOString(),
        source: "Sim Companies in-page successful GET response"
      }
    }).then(() => sendResponse({ ok: true, count: message.data.length }));
    return true;
  }

  if (message?.type === "SIMCOMPASS_GET_PENDING_CAPTURE") {
    chrome.storage.local.get("pendingBuildingsSnapshot").then(({ pendingBuildingsSnapshot }) => {
      sendResponse(pendingBuildingsSnapshot
        ? { ok: true, snapshot: pendingBuildingsSnapshot }
        : { ok: false, reason: "no-capture" });
    });
    return true;
  }

  if (message?.type === "SIMCOMPASS_CLEAR_PENDING_CAPTURE") {
    chrome.storage.local.remove("pendingBuildingsSnapshot").then(() => sendResponse({ ok: true }));
    return true;
  }
});
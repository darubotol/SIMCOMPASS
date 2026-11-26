const button = document.getElementById("connect");
const status = document.getElementById("status");
button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Checking for a captured game response…";
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id || !tab.url?.startsWith("https://darubotol.github.io/SIMCOMPASS/")) {
      status.textContent = "Open SIMCOMPASS and make that tab active before importing.";
      return;
    }
    const result = await chrome.runtime.sendMessage({ type: "SIMCOMPASS_GET_PENDING_CAPTURE" });
    if (!result?.ok) {
      status.textContent = "No building response captured yet. Keep this extension enabled, switch to Sim Companies, and reload the game page. Wait for the dashboard to finish loading, then return here.";
      return;
    }
    const saved = await chrome.tabs.sendMessage(tab.id, {
      type: "SIMCOMPASS_SAVE_BUILDINGS",
      data: result.snapshot.data,
      capturedAt: result.snapshot.capturedAt
    });
    if (saved?.ok) {
      await chrome.runtime.sendMessage({ type: "SIMCOMPASS_CLEAR_PENDING_CAPTURE" });
      status.textContent = "Imported " + saved.count + " building records into the Challenge Realm snapshot. The data was captured from the game's own successful response; no second API request was made.";
    } else {
      status.textContent = "The response was captured, but SIMCOMPASS could not save it. Reload the SIMCOMPASS tab and import again.";
    }
  } catch (_) {
    status.textContent = "Could not communicate with SIMCOMPASS. Reload its tab and try the import again.";
  } finally {
    button.disabled = false;
  }
});
const button = document.getElementById("connect");
const status = document.getElementById("status");
button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Checking the active tab…";
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id || !tab.url?.startsWith("https://darubotol.github.io/SIMCOMPASS/")) {
      status.textContent = "First open the SIMCOMPASS website and make that tab active. No game request was made.";
      return;
    }
    status.textContent = "Checking the game session and making one read-only request…";
    const result = await chrome.runtime.sendMessage({ type: "SIMCOMPASS_FETCH_BUILDINGS" });
    if (!result?.ok) {
      if (result?.reason === "cooldown") {
        status.textContent = "Please wait about " + Math.ceil(result.waitMs / 60000) + " minute(s) before the next API request.";
      } else if (result?.reason === "http") {
        status.textContent = "The game returned HTTP " + result.status + ". Make sure Sim Companies is open and signed in, then try after the five-minute cooldown.";
      } else {
        status.textContent = "Could not fetch the building data (" + (result?.reason || "unknown error") + ").";
      }
      return;
    }
    const saved = await chrome.tabs.sendMessage(tab.id, {
      type: "SIMCOMPASS_SAVE_BUILDINGS",
      data: result.data,
      fetchedAt: result.fetchedAt
    });
    status.textContent = saved?.ok
      ? "Success: " + saved.count + " building records saved as an unassigned snapshot in SIMCOMPASS. The realm still needs verification."
      : "The data was fetched, but SIMCOMPASS could not save it. Reload SIMCOMPASS and try again after the cooldown.";
  } catch (error) {
    status.textContent = "Could not communicate with the active SIMCOMPASS tab. Open or reload SIMCOMPASS and try again after the cooldown.";
  } finally {
    button.disabled = false;
  }
});
# SIMCOMPASS

**Challenge-first strategy planner for Sim Companies.**

Live application: https://darubotol.github.io/SIMCOMPASS/

## Product direction

SIMCOMPASS is designed around the Challenge Optimizer. The game catalogue is an internal knowledge base; users should not need to browse or manually maintain product and recipe tables to describe a challenge.

The optimiser loads the bundled game database in the background and uses its product, recipe, building, construction-time and ingredient data. The user supplies challenge-specific facts that cannot be safely assumed: starting cash, inventory, owned building levels and slots, market availability/prices, boosts, time limits and realm-specific restrictions.

## Current bundled data

- 151 product/resource records
- 149 production recipe records
- 47 building definitions
- Realm 0 baseline catalogue; this is not a guarantee that every item is enabled in every Challenge Realm scenario.
- Construction times are verified only where the source data explicitly records verification; unverified values must not be treated as confirmed.

## Three-realm architecture\n\nSIMCOMPASS has three separate realm workspaces: Challenge Realm (primary), Magnates Realm and Entrepreneurs Realm. Switching realms changes the active company workspace; inventory, cash, buildings, boosts and challenge records are stored separately and are never carried between realms. The shared catalogue is copied into each workspace as reference data. Challenge Realm is a distinct time-limited challenge environment; Magnates and Entrepreneurs are separate persistent universes. See the [official Realms guide](https://www.simcompanies.com/pages/realms-guide/) and [Challenge Realm overview](https://www.simcompanies.com/pages/future-development/).\n\n**Account connection status:** live account linking is not implemented. Sim Companies' API guide says API use is unsupported, endpoints may change, only GET requests are allowed and requests must not exceed one every five minutes. It does not provide a documented OAuth flow for third-party applications. SIMCOMPASS therefore provides isolated workspaces and SIMCOMPASS-backup import rather than asking for passwords, cookies or session tokens. Raw Sim Companies API responses can now be captured as local, realm-specific snapshots. The app indexes JSON keys and array counts but deliberately does not map unverified fields into company inventory/buildings/cash. After a real response is supplied, implement and test explicit field mappings. To capture safely, use Chrome DevTools Network > Fetch/XHR and copy only the Response body; never copy request headers, cookies, authorization values or tokens. Challenge Realm data may only exist after joining a challenge. A live connector must be developed only after a supported, safe authentication and realm-specific read endpoint are verified.\n\n## Current user workflow

1. Describe the challenge and select its objective family.
2. Add exact success conditions, secondary milestones, restrictions and time limit.
3. Enter owned buildings, levels and parallel slots.
4. Enter starting inventory and any market assumptions.
5. Add available boosts with their actual effect and timing.
6. Generate a strategy report where a supported solver exists.

The product/recipe/building catalogue pages are removed from primary navigation. Their data remains available internally. Inventory and boost setup remain visible because they contain scenario-specific values.

## Objective architecture

The challenge model can record product delivery, revenue, profit, company value, research, construction/upgrades, assets, contracts, multi-objective challenges and custom conditions. This is an extensible objective schema, not a claim that every objective solver is already complete.

**Implemented solver:** first-stage product-delivery route estimation using bundled recipes, user-owned building slots, starting stock, market quantities/prices and entered market lead times. It compares production routes and market sourcing.

**Not yet implemented:** complete solvers for revenue/profit/company value/research/contracts/custom challenge mechanics; global shared-building scheduling; construction decisions and construction boosts; exact boost-window scheduling/stacking; retail sales and cashflow simulation; taxes/fees; complete Challenge Realm rule variations; and a mathematically proven global optimum. These must be added and tested against observed game outcomes before strategy results are described as optimal.

## Safety and account access

SIMCOMPASS does not need the user's password, one-time codes, browser cookies or session tokens. Use public game information and user-provided screenshots or non-sensitive exported data to validate mechanics. Never place account secrets in this repository.

## Storage and deployment

Each realm workspace is stored separately in browser local storage. Use Data & Settings to export or import a backup for the selected realm. The site is deployed through GitHub Pages and requires no local Python or Node installation.

SIMCOMPASS is an independent community project and is not affiliated with or endorsed by Sim Companies.

## Optional Chrome connector (read-only)

A Manifest V3 extension is provided in `simcompass-chrome-connector/`. Version 1.2.0 passively observes successful same-origin GET responses that the signed-in game page itself has already requested. It imports the Challenge Realm buildings payload and records API endpoint paths, top-level JSON keys and a limited structural outline. **Discovery metadata only** is collected for other endpoints; it does not copy their private response values. It does not issue API requests, read cookie values, access passwords/tokens, or send game-changing requests.

The endpoint map is used to identify the real game responses for cash, warehouse inventory and market data before adding explicit, tested field mappings. This avoids guessing endpoint names or accidentally treating unrelated company data as Challenge Realm data. The game API is undocumented and unsupported, and its published guide warns that it can change without notice. All observed responses are captured locally in the browser.

### Update the Chrome extension on Windows

1. Download the latest SIMCOMPASS repository ZIP from GitHub and extract it to a new folder.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Remove the older SIMCOMPASS connector extension.
4. Choose **Load unpacked** and select the new `simcompass-chrome-connector` folder containing `manifest.json`.
5. Confirm that the extension shows version **1.2.0**.
6. Keep the signed-in Sim Companies tab open. Reload that game tab and wait for its dashboard to finish loading.
7. Open the SIMCOMPASS tab, click the connector icon, and choose **IMPORT CAPTURED GAME DATA**.
8. In SIMCOMPASS, open **Data & settings** and review the **Automatic API Map** panel.

This discovery step is read-only and only records endpoint names and JSON structure for unverified endpoints. It is not yet the cash/inventory/market importer. Those fields will be mapped only after their actual Challenge Realm response shapes have been observed and checked.

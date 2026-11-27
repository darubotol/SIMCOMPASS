# SIMCOMPASS

**Challenge-first strategy planner for Sim Companies.**

Live application: https://darubotol.github.io/SIMCOMPASS/

## Product direction

SIMCOMPASS is designed around the Challenge Optimizer. The game catalogue is an internal knowledge base; users should not need to browse or manually maintain product and recipe tables to describe a challenge.

The optimiser loads the bundled game database in the background and uses its product, recipe, building, construction-time and ingredient data. The user supplies challenge-specific facts that cannot be safely assumed: starting cash, inventory, owned building counts and levels, plus empty building plots, market availability/prices, boosts, time limits and realm-specific restrictions.

## Current bundled data

- 151 product/resource records
- 149 production recipe records
- 47 building definitions
- Realm 0 baseline catalogue; this is not a guarantee that every item is enabled in every Challenge Realm scenario.
- Construction times are verified only where the source data explicitly records verification; unverified values must not be treated as confirmed.

## Three-realm architecture\n\nSIMCOMPASS has three separate realm workspaces: Challenge Realm (primary), Magnates Realm and Entrepreneurs Realm. Switching realms changes the active company workspace; inventory, cash, buildings, boosts and challenge records are stored separately and are never carried between realms. The shared catalogue is copied into each workspace as reference data. Challenge Realm is a distinct time-limited challenge environment; Magnates and Entrepreneurs are separate persistent universes. See the [official Realms guide](https://www.simcompanies.com/pages/realms-guide/) and [Challenge Realm overview](https://www.simcompanies.com/pages/future-development/).\n\n**Account connection status:** live account linking is not implemented. Sim Companies' API guide says API use is unsupported, endpoints may change, only GET requests are allowed and requests must not exceed one every five minutes. It does not provide a documented OAuth flow for third-party applications. SIMCOMPASS therefore provides isolated workspaces and SIMCOMPASS-backup import rather than asking for passwords, cookies or session tokens. Raw Sim Companies API responses can now be captured as local, realm-specific snapshots. The app indexes JSON keys and array counts but deliberately does not map unverified fields into company inventory/buildings/cash. After a real response is supplied, implement and test explicit field mappings. To capture safely, use Chrome DevTools Network > Fetch/XHR and copy only the Response body; never copy request headers, cookies, authorization values or tokens. Challenge Realm data may only exist after joining a challenge. A live connector must be developed only after a supported, safe authentication and realm-specific read endpoint are verified.\n\n## Current user workflow

1. Describe the challenge and select its objective family.
2. Add exact success conditions, secondary milestones, restrictions and time limit.
3. Enter owned building counts and levels, plus available empty plots.
4. Enter starting inventory and any market assumptions.
5. Add available boosts with their actual effect and timing.
6. Generate a strategy report where a supported solver exists.

The product/recipe/building catalogue pages are removed from primary navigation. Their data remains available internally. Inventory and boost setup remain visible because they contain scenario-specific values.

## Challenge optimiser status

The Challenge Realm optimiser uses the bundled recipe graph, captured starting stock and prices, imported building counts/levels, user-entered free building plots, and user-defined time limits. It compares direct market sourcing with production routes, accounts for building level capacity, can consider one additional level-1 construction or one-level upgrade at a production site, and can compare user-marked optional scrapping candidates. It also integrates multiple configured production and construction boost windows. Construction and upgrade material costs are sourced from the bundled building data and the same inventory/market price table.

The planner does not use the game challenge expiry timestamp as a planning deadline. Leave the user time-limit field blank for fastest-mode planning, or enter a number of hours to check feasibility against that limit.

**Important modelling boundaries:** the solver is a route estimator, not a proven global optimiser. It does not yet globally schedule competing product chains that need the same building at the same time, model every construction queue/plot rule, verify Challenge Realm-specific production/time modifiers, forecast retail demand/cashflow, or solve every non-product objective type. Scrapping uses the published FAQ's material recovery rule only for buildings the user explicitly marks as scrap candidates; the player must confirm that scrapping is available and verify the in-game refund. The market model treats entered prices as immediately purchasable and cannot guarantee order-book depth.

## Objective architecture

The challenge model can record product delivery, revenue, profit, company value, research, construction/upgrades, assets, contracts, multi-objective challenges and custom conditions. This is an extensible objective schema, not a claim that every objective solver is already complete.

**Current solver scope:** product-delivery route estimation using bundled recipes, starting stock, entered/captured prices, building counts and levels, available plots, one-step construction/upgrade options, optional user-marked scrapping, and configured production/construction boost windows. It compares direct market sourcing with production routes and evaluates the remaining quantity when the captured challenge progress matches the entered target.

**Still incomplete:** global shared-building scheduling across simultaneous product chains; complete demolition/refund eligibility validation; multiple sequential upgrades or multiple new buildings per route; retail sales and cash-flow integration; non-product objective solvers (revenue, profit, company value, research, contracts and custom challenge mechanics); taxes/fees; full market order-book depth; and Challenge Realm-specific productionModifier validation. The captured timeAcceleration factor is applied to production and construction durations; productionModifier remains unapplied until its exact meaning is verified. The planner supports fastest-time, minimum-cash and balanced scoring; balanced scoring uses a budget-relative time/cash heuristic. The planner is an estimate, not a mathematically proven global optimum.

## Safety and account access

SIMCOMPASS does not need the user's password, one-time codes, browser cookies or session tokens. Use public game information and user-provided screenshots or non-sensitive exported data to validate mechanics. Never place account secrets in this repository.

## Storage and deployment

Each realm workspace is stored separately in browser local storage. Use Data & Settings to export or import a backup for the selected realm. The site is deployed through GitHub Pages and requires no local Python or Node installation.

SIMCOMPASS is an independent community project and is not affiliated with or endorsed by Sim Companies.

## Optional Chrome connector (read-only)

A Manifest V3 extension is provided in `simcompass-chrome-connector/`. Version 1.3.3 passively observes successful same-origin GET responses that the signed-in game page itself has already requested. It imports the Challenge Realm buildings payload and selected allowlisted Challenge Realm values (challenge, resources, market ticker and company summary), plus API endpoint structures. Authentication and security endpoints are excluded; sensitive keys are recursively redacted. It does not issue API requests, read cookie values, access passwords/tokens, or send game-changing requests.

The current adapter maps the captured challenge objective/progress (excluding the game expiry date), warehouse inventory quantities, market-ticker prices and building records into the Challenge Realm workspace. Cash is not imported and must be entered manually. The ticker is not guaranteed to contain every tradable product or the available order-book depth. The game API is undocumented and unsupported, and may change without notice. All observed responses are captured locally in the browser.

### Update the Chrome extension on Windows

1. Download the latest SIMCOMPASS repository ZIP from GitHub and extract it to a new folder.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Remove the older SIMCOMPASS connector extension.
4. Choose **Load unpacked** and select the new `simcompass-chrome-connector` folder containing `manifest.json`.
5. Confirm that the extension shows version **1.3.3**.
6. Keep the signed-in Sim Companies tab open. Reload that game tab and wait for its dashboard to finish loading.
7. Open the SIMCOMPASS tab, click the connector icon, and choose **IMPORT CAPTURED GAME DATA**.
8. In SIMCOMPASS, open **Data & settings** and review the **Automatic API Map** panel.

The connector is read-only. It captures only selected successful responses already loaded by the signed-in game page. SIMCOMPASS maps the currently verified challenge, inventory, market-ticker and building fields; cash remains manual, and unsupported or incomplete feeds are not guessed.

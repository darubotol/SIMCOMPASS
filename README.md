# SIMCOMPASS

**Sim Companies Challenge Realm strategy workspace** — an independent, local-first browser application.

## Current application

- Overview dashboard and data-readiness checklist.
- Product catalogue with add, search and delete.
- Production recipes with output quantity, duration, building and ingredient quantities.
- Owned building records with levels and parallel slot counts.
- Multiple boost records with duration and stacking mode.
- Inventory and market assumptions: stock, unit price, available market quantity and purchase lead time.
- Challenge planner that recursively expands ingredient requirements, consumes entered stock, compares the fastest configured market source against a configured production route, and produces an itemized estimate.
- JSON backup export and restore; local workspace reset.
- Responsive desktop/mobile interface. No Python or local development setup required.

## Open the app

After GitHub Pages is enabled for this repository, the application will be available at:

`https://darubotol.github.io/SIMCOMPASS/`

To enable it: open **Settings → Pages → Build and deployment → Source → GitHub Actions**. The included workflow publishes the root of this repository. Wait for the Pages deployment workflow to finish, then open the URL above.

You can also preview locally by downloading the repository and opening `index.html` in a modern browser. For the most reliable browser storage behavior, use the GitHub Pages HTTPS site.

## Data and backups

Data is stored in the browser's local storage on the device/browser where you use the site. It is not yet synchronized to another device or account. Use **Data & settings → Export workspace** regularly. Imported data must use the same JSON schema and should be checked before use.

A preloaded catalogue is now included: 151 resources/products, 149 production recipes and 47 building definitions for realm 0. Recipe inputs and level-one production rates come from the Simcotools public resource API; building production mappings and construction materials come from a community-maintained catalogue. Level-one construction times are currently verified for 24 of the 47 listed buildings against the official Encyclopedia; the remaining entries are explicitly marked unverified rather than guessed. Market prices and your own inventory are not prefilled because they change by realm and time. Official resource/building artwork is not exposed by the bulk resource feed, so image assets are still pending a reliable source mapping.



**Challenge Realm note:** the preloaded 151/149/47 catalogue is a realm-0 baseline, not a claim that every item is enabled in every Challenge Realm scenario. Official Challenge Realm documentation describes a solo, time-limited mode with different rules; scenario-specific availability and any rule differences must be modelled separately. The official description says Exchange, contracts and bonds are disabled, so market assumptions must not be carried over blindly.

## Important calculation limits in this first working release

The current challenge planner is a useful first-pass estimator, not yet a mathematically optimal global scheduler. It currently:
- Expands a selected recipe chain recursively (the first configured route for each product).
- Uses entered inventory before sourcing the remainder.
- Compares the configured recipe route with a market route when the market row has sufficient quantity and a price.
- Uses sequential dependency timing and entered market lead times.

It does **not yet** calculate building-level production multipliers, simultaneous factory scheduling, construction queues, time-window boost activation/stacking, market price changes, taxes, selling time, cash-flow timing, alternative-recipe global optimization or a guaranteed least-time solution. Building and boost records are saved for the next optimizer iteration, but are not yet applied to the time estimate. The interface explicitly reports these limits.

## Project structure

- `index.html` — application screens and forms
- `styles.css` — responsive interface styling
- `app.js` — local data model, CRUD, backup/restore and first-pass planner
- `.github/workflows/pages.yml` — GitHub Pages deployment

## Roadmap

1. Complete construction-time verification for all building definitions and map official game artwork.
2. Add robust alternative-route and cycle-aware production graph calculations.
3. Implement building-level throughput, parallel scheduling and construction timing.
4. Implement boost windows, stacking rules and multiple simultaneous boosts.
5. Add market/cash-flow constraints and challenge completion/sale timing.
6. Build automated scenario tests and compare calculated schedules with known in-game cases.
7. Add optional cloud sync only when required; keep local export/import available.

SIMCOMPASS is an independent community tool and is not affiliated with or endorsed by Sim Companies.

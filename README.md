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

## Current user workflow

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

Challenge data is stored in browser local storage. Use Data & Settings to export a JSON backup. The site is deployed through GitHub Pages and requires no local Python or Node installation.

SIMCOMPASS is an independent community project and is not affiliated with or endorsed by Sim Companies.

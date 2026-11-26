#!/usr/bin/env python3
"""Normalize the Simcotools public resource catalogue for SIMCOMPASS.

The upstream API is community-operated, not an official Sim Companies API.
This script keeps raw data alongside normalized data and never invents missing fields.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw-resources.json"
BUILDINGS = ROOT / "data" / "buildings.json"
OUT = ROOT / "data" / "game-database.json"
CONSTRUCTION_TIMES = ROOT / "data" / "building-construction-times.json"

def load_resources(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("resources", "results", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    raise ValueError("Unrecognized resource API response: expected a list or an object containing a resources list")

def main():
    realm = int(os.environ.get("REALM", "0"))
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    resources = load_resources(raw)
    metadata = raw.get("metadata", {}) if isinstance(raw, dict) else {}
    expected = metadata.get("totalRecords") if isinstance(metadata, dict) else None
    if expected is not None and len(resources) < int(expected):
        raise ValueError(f"Incomplete resource response: got {len(resources)} of {expected}")
    if len(resources) < 20:
        raise ValueError(f"Only {len(resources)} resources returned; refusing to publish an incomplete catalogue")

    buildings = json.loads(BUILDINGS.read_text(encoding="utf-8"))
    construction_times = json.loads(CONSTRUCTION_TIMES.read_text(encoding="utf-8"))
    building_by_product = {}
    for building in buildings:
        for product in building.get("produces", []):
            building_by_product.setdefault(product.casefold(), building)

    products, recipes = [], []
    for item in resources:
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        rid = item.get("id")
        building = building_by_product.get(name.casefold())
        inputs_obj = item.get("inputs") or {}
        inputs = []
        if isinstance(inputs_obj, dict):
            for input_id, details in inputs_obj.items():
                details = details or {}
                input_name = details.get("name")
                quantity = details.get("quantity")
                if input_name and quantity is not None:
                    inputs.append({"product": str(input_name), "quantity": float(quantity), "resourceId": input_id})
        elif isinstance(inputs_obj, list):
            for details in inputs_obj:
                if details and details.get("name") and details.get("quantity") is not None:
                    inputs.append({"product": str(details["name"]), "quantity": float(details["quantity"]), "resourceId": details.get("id")})

        image = next((item.get(k) for k in ("imageUrl", "image_url", "image", "iconUrl", "icon") if isinstance(item.get(k), str) and item.get(k).startswith("http")), None)
        products.append({
            "id": f"game-{rid if rid is not None else name.casefold().replace(' ', '-')}",
            "gameId": rid,
            "name": name,
            "category": item.get("category") or item.get("group") or "",
            "unit": "units",
            "image": image,
            "source": "Simcotools public resource API",
            "encyclopediaUrl": f"https://www.simcompanies.com/encyclopedia/{realm}/resource/{rid}/" if rid is not None else None
        })

        rate = item.get("producedAnHour")
        if building and isinstance(rate, (int, float)) and rate > 0:
            recipes.append({
                "id": f"recipe-{rid}",
                "output": name,
                "building": building.get("name", ""),
                "quantity": 1,
                "minutes": 60 / float(rate),
                "inputs": inputs,
                "source": "Simcotools public resource API",
                "verifiedRatePerHour": float(rate),
                "speedModifier": item.get("speedModifier", 0)
            })

    normalized_buildings = []
    for building in buildings:
        normalized_buildings.append({
            "id": f"building-{building.get('id')}",
            "gameId": building.get("id"),
            "name": building.get("name"),
            "level": 0,
            "slots": 0,
            "notes": "Game catalogue record; configure owned level and slots separately.",
            "constructionTimeMinutes": construction_times.get(str(building.get("id")), {}).get("minutes"),
            "constructionTimeSource": construction_times.get(str(building.get("id")), {}).get("source"),
            "constructionMaterials": building.get("cost", {}),
            "produces": building.get("produces", []),
            "source": "Community building catalogue",
            "encyclopediaUrl": f"https://www.simcompanies.com/encyclopedia/{realm}/building/{building.get('id')}/"
        })

    OUT.write_text(json.dumps({
        "schemaVersion": 1,
        "realm": realm,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": "https://api.simcotools.com/",
        "sourceNote": "Community-operated API; compare changes against the official Sim Companies Encyclopedia.",
        "counts": {"products": len(products), "recipes": len(recipes), "buildings": len(normalized_buildings)},
        "products": products,
        "recipes": recipes,
        "buildings": normalized_buildings
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Normalized {len(products)} products, {len(recipes)} recipes, {len(normalized_buildings)} buildings")

if __name__ == "__main__":
    main()

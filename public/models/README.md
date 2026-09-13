# Entropy Engine — Production 3D Assets (GLB/GLTF)

This directory contains production-quality 3D assets authored in Blender or standard 3D DCC tools.

## Required Asset Slots:

| Filename | Description | Scale / Placement | Target Polygon / Texture Budget |
| :--- | :--- | :--- | :--- |
| `hero-adventurer.glb` | Detailed hooded dark-fantasy traveler (layered leather, wool cloak, boots, face in deep hood shadow) | Foreground Hero (25–35% viewport height) | 35k–70k tris, PBR 2K/4K maps |
| `citadel-fortress.glb` | Ancient Gothic mountain fortress with curtain walls, bastions, and watchtowers | Midground Left (Z ≈ -110m) | 20k–50k tris, PBR 2K maps |
| `mountain-environment.glb`| Continuous alpine mountain chains with rock strata, talus, and glacial valleys | Background (Z ≈ -160m to -360m) | 40k–80k tris, PBR 2K maps |
| `sanctuary-relic.glb` | Ancient stone pedestal with rotating brass astrolabe mechanism and glowing core | "What is Entropy Engine?" vignette | 15k–30k tris, PBR 1K/2K maps |
| `path-scholar.glb` | Ancient stone lectern with illuminated manuscript and celestial armillary sphere | Path Card: The Scholar | 10k–20k tris, PBR 1K maps |
| `path-warrior.glb` | Weathered stone weapon plinth with forged steel broadsword and scarred iron shield | Path Card: The Warrior | 10k–20k tris, PBR 1K maps |
| `path-artisan.glb` | Heavy stone blacksmith anvil with tempered smithing tools and glowing hearth coals | Path Card: The Artisan | 10k–20k tris, PBR 1K maps |
| `path-social.glb` | Great hall stone hearth fireplace with rough-hewn oak beam and wrought iron sconces | Path Card: The Social | 10k–20k tris, PBR 1K maps |
| `monumental-gateway.glb` | Colossal cyclopean stone threshold doorway with carved Gothic voussoirs | Final CTA: "Enter the Engine" | 20k–45k tris, PBR 2K maps |

When an asset is placed in this directory, `ModelLoader.ts` automatically loads it, normalizes its bounding box, applies ACES tone mapping and PBR properties, and swaps out the temporary placeholder.

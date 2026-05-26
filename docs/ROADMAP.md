# Side-Scrolling Car Game Roadmap

## Architecture Principles
- Keep reusable systems in `scripts/core` and feature-specific logic in domain folders (`vehicles`, `world`, `ui`).
- Keep scenes modular (`scenes/vehicles`, `scenes/world`) so new vehicles and level chunks can be swapped without rewriting systems.
- Store surface behavior in data resources (`TerrainMaterial`) to allow easy balancing and expansion.

## Phase 1 (Implemented)
- Basic car body + two wheels with `DampedSpringJoint2D` suspension.
- Ground collision, camera follow, simple controls.

## Phase 2
- Extend `car_controller.gd` with:
  - staged acceleration curves
  - angular damping profiles
  - better in-air steering and anti-flip assistance
  - per-wheel traction blending

## Phase 3
- Add `TerrainZone` nodes with materials:
  - dirt (balanced)
  - grass (slightly slippery)
  - sand (high drag)
  - ice (low traction, low grip)
- Surface effects should remain data-driven via `TerrainMaterial` resources.

## Phase 4
- Build reusable obstacle prefabs:
  - ramps, bridge segments, hazard movers, steep climb chunks
- Compose levels from chunks in `scenes/world/levels`.

## Phase 5
- Add `LevelGoal`, scoring pickups, and completion state.
- Persist progression and unlocked levels via save data service.

## Phase 6
- Garage screen binds to `GameManager.upgrades` and exposes tuned stats.
- Apply upgrades through multipliers in the car setup pipeline.

## Phase 7
- Menu flow: Title -> Level Select -> Gameplay -> Results.
- Add placeholder SFX/music hooks and UI transitions.
- Keep visuals simple until physics/game feel are stable.

## Future-ready Hooks
- `GameManager` should own run modifiers and time challenges.
- Add vehicle factory pattern for special vehicles.
- Keep level events signal-based for hidden paths / boss encounters.

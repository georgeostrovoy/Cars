export const TERRAIN = {
  dirt: { traction: 1.0, color: '#6a4a2e' },
  grass: { traction: 0.85, color: '#3f8f3f' },
  sand: { traction: 0.65, color: '#d5bb74' },
  ice: { traction: 0.35, color: '#c4ebff' }
};

export function terrainAtX(x) {
  if (x < 900) return 'dirt';
  if (x < 1700) return 'grass';
  if (x < 2500) return 'sand';
  return 'ice';
}

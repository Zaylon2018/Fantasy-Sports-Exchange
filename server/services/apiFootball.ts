// NOTE: This file used to integrate with API-Football (api-sports.io).
// We have removed that dependency and now use the free Fantasy Premier League (FPL) endpoints.
// No API key is required.

const BASE_URL = "https://fantasy.premierleague.com/api";

/**
 * Fetches the full FPL bootstrap payload:
 * - teams
 * - players (elements)
 * - element types
 * - events (gameweeks)
 * - etc.
 */
export async function fetchFplBootstrap() {
  const res = await fetch(`${BASE_URL}/bootstrap-static/`);
  if (!res.ok) throw new Error(`FPL bootstrap fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/** Fetch all fixtures (can be filtered client-side by gameweek/team). */
export async function fetchFplFixtures() {
  const res = await fetch(`${BASE_URL}/fixtures/`);
  if (!res.ok) throw new Error(`FPL fixtures fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/** Fetch a specific player's historical + upcoming data (FPL element summary). */
export async function fetchFplPlayerSummary(playerId: number) {
  const res = await fetch(`${BASE_URL}/element-summary/${playerId}/`);
  if (!res.ok) throw new Error(`FPL element-summary fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

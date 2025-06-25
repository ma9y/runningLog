import 'dotenv/config';
import fs from 'fs/promises';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

const TOKEN_URL = 'https://www.strava.com/oauth/token';
const ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';
const OUTPUT_PATH = './views/_data/strava.json';

// Helpers
function formatPace(secondsPerKm) {
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.round(secondsPerKm % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function msToKmh(mps) {
  return typeof mps === 'number' ? (mps * 3.6).toFixed(1) : "–";
}

function msToPace(mps) {
  if (!mps || mps === 0) return "–";
  const paceInSec = 1000 / mps;
  return formatPace(paceInSec);
}

function formatDuration(seconds) {
  if (!seconds || typeof seconds !== "number") return "–";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(unit => unit.toString().padStart(2, "0")).join(":");
}

// Strava API
async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function getActivities(accessToken) {
  const res = await fetch(`${ACTIVITIES_URL}?per_page=10`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch activities: ${res.status}`);
  }

  return await res.json();
}

async function saveToDataFile(newActivities) {
  let existing = [];
  try {
    const file = await fs.readFile(OUTPUT_PATH, 'utf-8');
    existing = JSON.parse(file);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const existingIds = new Set(existing.map(a => a.id));

  const formattedNew = newActivities
    .filter(a => !existingIds.has(a.id))
    .map(a => {
      const distanceKm = a.distance ? a.distance / 1000 : 0;
      const paceSecPerKm = distanceKm > 0 && a.moving_time ? a.moving_time / distanceKm : 0;

      return {
        id: a.id,
        name: a.name || "Untitled",
        date: a.start_date_local || a.start_date || "Unknown",
        type: a.type || "Unknown",
        distance: distanceKm ? distanceKm.toFixed(2) : "–",
        moving_time: formatDuration(a.moving_time),
        pace: paceSecPerKm > 0 ? formatPace(paceSecPerKm) : "–",
        max_pace: msToPace(a.max_speed),
        average_speed: msToKmh(a.average_speed),
        max_speed: msToKmh(a.max_speed),
        average_heartrate: a.average_heartrate ?? "–",
        max_heartrate: a.max_heartrate ?? "–",
        ascent: typeof a.total_elevation_gain === "number" ? Math.round(a.total_elevation_gain) : "–",
        elev_high: a.elev_high ?? "–",
        elev_low: a.elev_low ?? "–",
        summary_polyline: a.map?.summary_polyline || null
      };
    });

  const combined = [...existing, ...formattedNew];
  combined.sort((a, b) => new Date(b.date) - new Date(a.date));

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(combined, null, 2));
  console.log(`✅ Added ${formattedNew.length} new activities. Total saved: ${combined.length}`);
}

// Run it
try {
  const accessToken = await getAccessToken();
  const activities = await getActivities(accessToken);
  await saveToDataFile(activities);
} catch (err) {
  console.error('❌ Error:', err.message);
}


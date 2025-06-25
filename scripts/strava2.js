import 'dotenv/config';
import fs from 'fs/promises';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

const TOKEN_URL = 'https://www.strava.com/oauth/token';
const ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';
const OUTPUT_PATH = './views/_data/strava2.json';

// ────────────────────────
// Strava API helpers
// ────────────────────────
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

  if (!res.ok) throw new Error(`Failed to refresh token: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function getMostRecentActivity(accessToken) {
  const res = await fetch(`${ACTIVITIES_URL}?per_page=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch activity: ${res.status}`);
  const activities = await res.json();
  return activities[0] || null;
}

// ────────────────────────
// Save one activity if new
// ────────────────────────
async function saveToDataFile(activity) {
  if (!activity) {
    console.log('ℹ️ No new activity found.');
    return;
  }

  let existing = [];
  try {
    const buf = await fs.readFile(OUTPUT_PATH, 'utf-8');
    existing = JSON.parse(buf);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  if (existing.some(a => a.id === activity.id)) {
    console.log('ℹ️ Activity already exists in file. No update needed.');
    return;
  }

  const combined = [activity, ...existing].sort(
    (a, b) =>
      new Date(b.start_date_local ?? b.start_date) -
      new Date(a.start_date_local ?? a.start_date)
  );

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(combined, null, 2));
  console.log(`✅ Added activity ${activity.id}. Total saved: ${combined.length}`);
}

// ────────────────────────
// Run it
// ────────────────────────
try {
  const accessToken = await getAccessToken();
  const latestActivity = await getMostRecentActivity(accessToken);
  await saveToDataFile(latestActivity);
} catch (err) {
  console.error('❌ Error:', err.message);
}

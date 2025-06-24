import 'dotenv/config';
import fs from 'fs/promises';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

const TOKEN_URL = 'https://www.strava.com/oauth/token';
const ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';

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

async function saveToDataFile(data) {
  const outputPath = './views/_data/strava.json';
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved ${data.length} activities to ${outputPath}`);
}

try {
  const accessToken = await getAccessToken();
  const activities = await getActivities(accessToken);
  await saveToDataFile(activities);
} catch (err) {
  console.error('❌ Error:', err.message);
}

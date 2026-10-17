const { chromium } = require('playwright');

function extractInitialState(html) {
  const scriptMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;?\s*(?:<\/script>|$)/);

  if (!scriptMatch) {
    throw new Error('Could not find the Tracker __INITIAL_STATE__ payload.');
  }

  try {
    return JSON.parse(scriptMatch[1]);
  } catch (error) {
    throw new Error(`Failed to parse the Tracker page state: ${error.message}`);
  }
}

function getScheduleMap(state) {
  return state?.valorantPremier?.schedules ?? {};
}

function getAllLeagueEvents(scheduleMap) {
  return Object.values(scheduleMap)
    .flatMap((schedule) => Object.values(schedule?.events || {}))
    .filter(Boolean);
}

function getUpcomingLeagueMatches(scheduleMap, now = new Date()) {
  const currentTime = new Date(now).getTime();

  return getAllLeagueEvents(scheduleMap)
    .filter((event) => event.type === 'LEAGUE' && typeof event.startTime === 'string')
    .filter((event) => new Date(event.startTime).getTime() >= currentTime)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
}

function formatDateInTimeZone(dateString, timeZone) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

async function fetchPremierSchedule(region = 'NA_US_WEST') {
  const url = `https://tracker.gg/valorant/premier/standings?region=${encodeURIComponent(region)}`;

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => !!window.__INITIAL_STATE__ && !!window.__INITIAL_STATE__.valorantPremier, { timeout: 30000 });

    const state = await page.evaluate(() => window.__INITIAL_STATE__);
    return getScheduleMap(state);
  } catch (error) {
    throw new Error(`Unable to read the Premier schedule from Tracker: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function formatWeeklyMessage(matches, region, timeZone) {
  if (!matches.length) {
    return `@everyone There are no Premier league matches scheduled for ${region} in the upcoming week.`;
  }

  const firstTwoMatches = matches.slice(0, 2);

  return [
    `@everyone Premier match times for ${region} (${timeZone})`,
    ...firstTwoMatches.map((match, index) => {
      const label = index === 0 ? 'Match 1' : 'Match 2';
      const start = formatDateInTimeZone(match.startTime, timeZone);
      const end = formatDateInTimeZone(match.endTime, timeZone);
      return `**${label}**: ${start} to ${end}`;
    }),
    'React with 1️⃣ for Match 1 or 2️⃣ for Match 2 if you can play.',
  ].join('\n');
}

module.exports = {
  extractInitialState,
  getScheduleMap,
  getAllLeagueEvents,
  getUpcomingLeagueMatches,
  formatDateInTimeZone,
  fetchPremierSchedule,
  formatWeeklyMessage,
};

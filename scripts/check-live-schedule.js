const { fetchPremierSchedule, getUpcomingLeagueMatches, formatWeeklyMessage } = require('../src/tracker');

(async () => {
  const region = process.env.TRACKER_REGION || 'NA_US_WEST';
  const timezone = process.env.BOT_TIMEZONE || 'America/Los_Angeles';

  const schedule = await fetchPremierSchedule(region);
  const matches = getUpcomingLeagueMatches(schedule, new Date());

  console.log('matchCount=', matches.length);
  console.log(matches.slice(0, 3).map((match) => ({
    start: match.startTime,
    end: match.endTime,
    type: match.type,
  })));
  console.log(formatWeeklyMessage(matches, region, timezone).slice(0, 500));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractInitialState, getUpcomingLeagueMatches } = require('../src/tracker');

test('extractInitialState parses the window state from tracker HTML', () => {
  const html = `
    <script>
      window.__INITIAL_STATE__ = {"valorantPremier":{"schedules":{"NA_US_WEST::abc":{"events":{"1":{"type":"LEAGUE","startTime":"2026-10-24T19:00:00-07:00","endTime":"2026-10-24T20:00:00-07:00"}}}}}};
    </script>
  `;

  const state = extractInitialState(html);

  assert.ok(state.valorantPremier);
  assert.equal(state.valorantPremier.schedules['NA_US_WEST::abc'].events['1'].type, 'LEAGUE');
});

test('getUpcomingLeagueMatches filters for next league slots in order', () => {
  const schedule = {
    'NA_US_WEST::abc': {
      events: {
        1: { type: 'SCRIM', startTime: '2026-10-20T19:00:00-07:00', endTime: '2026-10-20T20:00:00-07:00' },
        2: { type: 'LEAGUE', startTime: '2026-10-24T19:00:00-07:00', endTime: '2026-10-24T20:00:00-07:00' },
        3: { type: 'LEAGUE', startTime: '2026-10-25T20:00:00-07:00', endTime: '2026-10-25T21:00:00-07:00' },
      }
    }
  };

  const matches = getUpcomingLeagueMatches(schedule, new Date('2026-10-17T00:00:00-07:00'));

  assert.equal(matches.length, 2);
  assert.equal(matches[0].startTime, '2026-10-24T19:00:00-07:00');
  assert.equal(matches[1].startTime, '2026-10-25T20:00:00-07:00');
});

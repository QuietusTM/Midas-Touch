# Valorant Premier Bot

This bot reads the Premier schedule from Tracker.gg for a configured region, then posts a weekly reminder on Monday with the next two match windows in the bot's configured timezone.

## Features

- Pulls the live Premier schedule from Tracker.gg
- Filters to upcoming league matches
- Posts a Monday reminder in a configured Discord channel
- Uses reactions `1️⃣` and `2️⃣` so members can vote for Match 1 or Match 2
- Supports manual commands for testing

## Setup

1. Copy `.env.example` to `.env`
2. Fill in your Discord token and channel ID
3. Set the region and your server timezone
4. Start the bot:

```bash
npm start
```

## Commands

- `!premier-weekly` — sends the weekly reminder immediately
- `!premier-now` — fetches the next match times and posts them

## Environment variables

- `DISCORD_TOKEN` — Discord bot token
- `MATCH_CHANNEL_ID` — the text channel where reminders are posted
- `TRACKER_REGION` — e.g. `NA_US_WEST`
- `BOT_TIMEZONE` — e.g. `America/Los_Angeles`
- `CRON_SCHEDULE` — cron expression for weekly reminder, default `0 9 * * 1`

## Notes

The Tracker page exposes a `window.__INITIAL_STATE__` object with the live Premier schedule, which is what this bot reads instead of scraping the rendered DOM.

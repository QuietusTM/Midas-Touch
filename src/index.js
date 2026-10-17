require('dotenv').config();

const cron = require('node-cron');
const { Client, GatewayIntentBits } = require('discord.js');
const {
  fetchPremierSchedule,
  getUpcomingLeagueMatches,
  formatWeeklyMessage,
} = require('./tracker');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const region = process.env.TRACKER_REGION || 'NA_US_WEST';
const timezone = process.env.BOT_TIMEZONE || 'UTC';
const channelId = process.env.MATCH_CHANNEL_ID;

async function sendWeeklyMatchPing() {
  if (!channelId) {
    console.error('MATCH_CHANNEL_ID is not set. Add it to your .env file.');
    return;
  }

  const channel = client.channels.cache.get(channelId) ?? (await client.channels.fetch(channelId).catch(() => null));

  if (!channel || !channel.isTextBased()) {
    console.error(`Channel ${channelId} was not found or is not text-based.`);
    return;
  }

  try {
    const schedule = await fetchPremierSchedule(region);
    const upcomingMatches = getUpcomingLeagueMatches(schedule, new Date());
    const message = formatWeeklyMessage(upcomingMatches, region, timezone);
    const sentMessage = await channel.send(message);

    await sentMessage.react('1️⃣');
    await sentMessage.react('2️⃣');

    console.log(`Posted weekly Premier match reminder for ${region}.`);
  } catch (error) {
    console.error('Failed to fetch Premier schedule:', error.message);
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  const schedule = process.env.CRON_SCHEDULE || '0 9 * * 1';
  cron.schedule(schedule, sendWeeklyMatchPing, {
    timezone,
    scheduled: true,
  });

  console.log(`Weekly job scheduled with cron: ${schedule} in timezone ${timezone}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!premier-weekly') {
    await sendWeeklyMatchPing();
  }

  if (message.content.toLowerCase() === '!premier-now') {
    try {
      const schedule = await fetchPremierSchedule(region);
      const upcomingMatches = getUpcomingLeagueMatches(schedule, new Date());
      const matchText = formatWeeklyMessage(upcomingMatches, region, timezone);
      await message.channel.send(matchText);
    } catch (error) {
      await message.channel.send(`Unable to fetch the latest schedule: ${error.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('Discord login failed:', error.message);
  process.exit(1);
});

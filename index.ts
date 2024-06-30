import {App, LogLevel} from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});

// URL検証エンドポイント
// app.use('/slack/events', (req, res, next) => {
//   console.log("XXXXXXXXXXXXXX");
//   if (req.body.type === 'url_verification') {
//     res.status(200).send(req.body.challenge);
//   } else {
//     next();
//   }
// });

// app.event('app_mention', async ({ event, say }) => {
//   await say(`Hello, <@${event.user}>!`);
// });

app.event('app_mention', async ({ event, say }) => {
  const text = event.text;
  const channel = event.channel;

  // グループメンションを検出
  const groupMention = text.match(/<!subteam\^(\w+)\|@(\w+)>/);
  if (groupMention) {
    const groupId = groupMention[1];
    await handleGroupMention(groupId, channel, text);
  }
});

async function handleGroupMention(groupId: string, sourceChannel: string, text: string) {
  try {
    const response = await client.usergroups.users.list({ usergroup: groupId });
    const members = response.users || [];

    for (const member of members) {
      const userInfo = await client.users.info({ user: member });
      if (!userInfo.user?.is_bot) {
        const channelsResponse = await client.users.conversations({ user: member, types: 'public_channel,private_channel' });
        const channels = channelsResponse.channels || [];

        for (const channel of channels) {
          await client.chat.postMessage({
            channel: channel.id,
            text: `グループメンションがありました: ${text}\n元のチャンネル: <#${sourceChannel}>`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling group mention:', error);
  }
}

(async () => {
  console.log({port: process.env.PORT || 3000});
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
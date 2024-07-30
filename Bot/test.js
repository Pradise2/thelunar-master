require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const app = express();
const token = process.env.TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new Telegraf(token);

// Web App Link
const web_link = 'https://thelun.vercel.app/';

// Start Handler
bot.start(async (ctx) => {
  try {
    const startPayload = ctx.startPayload || '';
    const userId = ctx.chat.id.toString(); // Ensure userId is a string
    const urlSent = `${web_link}?ref=${startPayload}&userId=${userId}`;
    const user = ctx.message.from;
    const userName = user.username ? `@${user.username.replace(/[-.!]/g, '\\$&')}` : user.first_name;

    const messageText = `
*Hey, ${userName}* Prepare for an out-of-this-world adventure! 🌌🚀

TheLunarCoin Power Tap mini-game has just landed on Telegram, and it’s going to be epic!

⚡ Get ready to be hooked! ⚡

🤑 Farm tokens, conquer challenges, and score insane loot.

💥 Form squads and invite your crew for double the fun (and double the tokens)!

With TheLunarCoin, mastering cryptocurrency is a breeze. From wallets to trading, earning, and cards, we’ve got everything you need to dominate the cryptoverse!

🚀 Let the lunar adventure begin! 🚀

* Lunar Token is not a virtual currency.*
    `;

    await ctx.replyWithMarkdown(messageText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Start Now", web_app: { url: urlSent } }]
        ]
      },
    });

    if (startPayload.startsWith('ref_')) {
      const refUserId = startPayload.split('_')[1];
      if (refUserId && refUserId !== userId) {
        try {
          await axios.post('https://lunarapp.thelunarcoin.com/backend/api/squad/add', {
            refUserId: refUserId.toString(), // Ensure refUserId is a string
            newUserId: userId.toString(), // Ensure newUserId is a string
            newUserName: userName.toString() // Ensure newUserName is a string
          });
          console.log('Referral data sent to API');
        } catch (apiError) {
          console.error('Error sending referral data to API:', apiError);
        }
      } else {
        console.error('Invalid or same refUserId:', refUserId);
      }
    }
  } catch (error) {
    console.error('Error in start handler:', error);
  }
});

// Referral Command Handler
bot.command('referral', async (ctx) => {
  const referralCode = Math.random().toString(36).substring(7);
  ctx.reply(`Your referral code is: ${referralCode}`);
});

// Express server setup
app.use(express.json());



// Launch the bot
bot.launch().then(() => {
  console.log('Bot is running...');
}).catch(error => {
  console.error('Error launching bot:', error);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = bot;

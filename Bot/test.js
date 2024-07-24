require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const db = require('./firebase');
const firebaseAdmin = require('firebase-admin');
const functions = require('firebase-functions');

const app = express();
const token = process.env.TOKEN || '7233165030:AAEl_z6x1v9zvGcpMf1TQbpr390_j7SIHJg';
const bot = new Telegraf(token);
// Web App Link
const web_link = 'https://thelunarcoin.vercel.app/';

// Start Handler
bot.start(async (ctx) => {
  try {
    const startPayload = ctx.startPayload || '';
    const userId = ctx.chat.id;
    const urlSent = `${web_link}?ref=${startPayload}&userId=${userId}`;
    const user = ctx.message.from;
    const userName = user.username ? `@${user.username.replace(/[-.!]/g, '\\$&')}` : user.first_name;

    const messageText = `
*Hey, ${userName}* Prepare for an out-of-this-world adventure! 🌌🚀.

      TheLunarCoin Power Tap mini-game has just landed on Telegram, and it’s going to be epic!

⚡ Get ready to be hooked! ⚡.

🤑 Farm tokens, conquer challenges, and score insane loot.

💥 Form squads and invite your crew for double the fun (and double the tokens)!.

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
      if (refUserId && refUserId !== userId.toString()) {
        await storeReferral(refUserId, userId, userName);
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
  const userId = ctx.from.id;
  try {
    const userDocRef = db.collection('Squad').doc(referralCode);
    const userSnapshot = await userDocRef.get();
    if (!userSnapshot.exists) {
      await userDocRef.set({
        claimedReferralCount: 0,
        referralEarnings: 0
      });
      ctx.reply(`Your referral code is: ${referralCode}`);
    } else {
      ctx.reply('A referral code with this ID already exists. Please try again.');
    }
  } catch (error) {
    console.error('Error writing document: ', error);
    ctx.reply('There was an error generating your referral code. Please try again.');
  }
});

const storeReferral = async (refUserId, newUserId, newUserName) => {
  if (!refUserId || !newUserId || refUserId === newUserId.toString()) {
    console.error('Invalid refUserId or newUserId:', { refUserId, newUserId });
    return;
  }

  try {
    const newUserDocRef = db.collection('users').doc(newUserId.toString());
    const newUserDoc = await newUserDocRef.get();

    if (newUserDoc.exists) {
      console.log('New user already exists:', newUserId);
      return;
    }

    await newUserDocRef.set({});
    console.log('New user created:', newUserId);

    const referralDocRef = db.collection('Squad').doc(refUserId);
    const referralDoc = await referralDocRef.get();

    let referralData = referralDoc.exists ? referralDoc.data() : {
      refUserId,
      newUserIds: [],
      referralCount: 0,
      referralEarnings: 0,
      totalBalance: 0,
      claimedReferralBonus: 0,
      referrals: []
    };

    if (!referralData.newUserIds.includes(newUserId)) {
      referralData.newUserIds.push(newUserId);
      referralData.referralCount += 1;

      // Fetch HomeBalance from Home collection
      const homeDataDocRef = db.collection('Home').doc(newUserId.toString());
      const homeDataDoc = await homeDataDocRef.get();

      if (homeDataDoc.exists) {
        const homeData = homeDataDoc.data();
        const homeBalance = homeData?.HomeBalance || 0;

        console.log(`HomeBalance for user ${newUserId}: ${homeBalance}`);

        // Calculate 10% of HomeBalance
        const totalReferralBonus = homeBalance * 0.1;
        const unclaimedBonus = totalReferralBonus - (referralData.claimedReferralBonus || 0);

        referralData.referralEarnings += unclaimedBonus;
        referralData.claimedReferralBonus = totalReferralBonus;

        // Store username and referral bonus in referrals array
        if (newUserName) {
          referralData.referrals.push({
            userId: newUserId,
            username: newUserName,
            referralBonus: unclaimedBonus
          });
        } else {
          referralData.referrals.push({
            userId: newUserId,
            referralBonus: unclaimedBonus
          });
        }

        console.log(`Referral earnings for user ${refUserId} updated by ${unclaimedBonus}`);
      } else {
        console.log(`No Home document found for user ${newUserId}`);
      }

      if (referralDoc.exists) {
        await referralDocRef.update(referralData);
      } else {
        await referralDocRef.set(referralData);
      }

      console.log('Referral stored successfully');
    } else {
      console.log('New user ID already exists in the referral list');
    }
  } catch (error) {
    console.error('Error storing referral: ', error);
  }
};

const updateReferralEarnings = async (newUserId) => {
  try {
    const newUserDocRef = db.collection('Home').doc(newUserId.toString());
    const newUserDoc = await newUserDocRef.get();

    if (!newUserDoc.exists) {
      console.log('No Home document found for user:', newUserId);
      return;
    }

    const homeData = newUserDoc.data();
    const homeBalance = homeData?.HomeBalance || 0;

    // Calculate 10% of HomeBalance
    const totalReferralBonus = homeBalance * 0.1;

    // Find refUserId from the user collection
    const refUserSnapshot = await db.collection('users').where('referredUserId', '==', newUserId).get();
    if (refUserSnapshot.empty) {
      console.log('No referring user found for new user:', newUserId);
      return;
    }

    refUserSnapshot.forEach(async (refUserDoc) => {
      const refUserId = refUserDoc.id;
      const referralDocRef = db.collection('Squad').doc(refUserId);
      const referralDoc = await referralDocRef.get();

      if (!referralDoc.exists) {
        console.log('No Squad document found for refUserId:', refUserId);
        return;
      }

      let referralData = referralDoc.data();
      const claimedBonus = referralData.referrals.find(ref => ref.userId === newUserId)?.referralBonus || 0;
      const unclaimedBonus = totalReferralBonus - claimedBonus;

      referralData.referralEarnings += unclaimedBonus;

      const referralIndex = referralData.referrals.findIndex(ref => ref.userId === newUserId);
      if (referralIndex !== -1) {
        referralData.referrals[referralIndex].referralBonus += unclaimedBonus;
      } else {
        referralData.referrals.push({
          userId: newUserId,
          referralBonus: unclaimedBonus
        });
      }

      await referralDocRef.update(referralData);
      console.log(`Referral earnings for user ${refUserId} updated by ${unclaimedBonus}`);
    });
  } catch (error) {
    console.error('Error updating referral earnings: ', error);
  }
};

// Firestore Trigger
exports.onHomeBalanceUpdate = functions.firestore
  .document('Home/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    if (before.HomeBalance !== after.HomeBalance) {
      console.log(`HomeBalance changed for user ${userId}, updating referral earnings...`);
      await updateReferralEarnings(userId);
    }
  });

// Launch the bot
bot.launch().then(() => {
  console.log('Bot is running...');
}).catch(error => {
  console.error('Error launching bot:', error);
});

module.exports = bot;

// Express server setup
app.listen(3000, () => {
  console.log('Server is running on port  3000');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

require('dotenv').config();
const { Bot } = require('grammy');
const db = require('./db');

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Unknown';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';

    // Check if user is new
    if (!db.userExists(userId)) {
        // Save new user
        db.saveUser(userId, {
            username,
            firstName,
            lastName,
            passwords: [],
        });
        ctx.reply(`Hello ${firstName}!\nWelcome! Let's get started! The project is open source, therefore completely safe.\nCheck the GitHub page here: https://github.com/`);
    } else {
        // Existing user
        ctx.reply(`Welcome back, ${firstName}!`);
    }
});

bot.command("new", (ctx) => {

});

bot.command("me", (ctx) => {
    const userId = ctx.from.id;
    const user = db.getUser(userId);
    if (user) {
        ctx.reply(`Your info:\nID: ${user.id}\nUsername: ${user.username}\nJoined: ${user.createdAt}`);
    } else {
        ctx.reply("User not found. Send /start first.");
    }
});


// ADMIN commands
bot.command("notify", (ctx) => {
    const userId = ctx.from.id;
    if (userId !== parseInt(process.env.ADMIN_ID)) return;

    const message = ctx.match;

    if (!message) return ctx.reply("Usage: /notify <message>");

    const allUsers = db.getAllUsers();
    allUsers.forEach((user) => {
        bot.api.sendMessage(user.id, message);
    });

    ctx.reply(`Message:\n\n${message}\n\nSent to ${allUsers.length} users!`);
})

bot.command("stats", (ctx) => {
    const userId = ctx.from.id;
    if (userId !== parseInt(process.env.ADMIN_ID)) return;

    const allUsers = db.getAllUsers();
    ctx.reply(`Total users: ${allUsers.length}`);
});

bot.start();
console.log('Bot started!');
require('dotenv').config();
const { Bot, session } = require('grammy');
const db = require('./db');
const pr = require('./processes');

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(
    session({
        initial: () => ({
            deletableMessages: [],
            requestingMasterPassword: false,
            requestingMasterPasswordVerification: false,
            passwordName: null,
            requestingPasswordName: false,
            requestingPasswordLogin: false,
            editingPasswordId: null,
            requestingEditField: false,
        }),
    })
);

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
            passwords: {},
            master: ''
        });
        ctx.reply(`Hello ${firstName}!\nWelcome! Let's get started! The project is open source, therefore completely safe.\nCheck the GitHub page here: https://github.com/huseyngaflanov/PasswordKeepTG`);
        setTimeout(() => {
            ctx.session.requestingMasterPassword = true;
            ctx.reply("Please create a master password (exactly 8 characters).");
        }, 100);
    } else {
        // Existing user
        ctx.reply(`Welcome back, ${firstName}!`);
        if (db.getUser(userId).master === '') {
            setTimeout(() => {
                ctx.session.requestingMasterPassword = true;
                ctx.reply("Please create a master password (exactly 8 characters).");
            }, 100);
        }
    }
});



bot.command("new", (ctx) => {
    ctx.session.requestingPasswordName = true;
    ctx.reply("Name your new credential:");
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

// List all passwords
bot.command("list", (ctx) => {
    const userId = ctx.from.id;
    const passwords = db.getAllPasswords(userId);
    
    if (passwords.length === 0) {
        ctx.reply("📋 You have no saved passwords yet.\n\nUse /new to create one.");
        return;
    }
    
    let message = `📋 Your saved passwords (${passwords.length}):\n\n`;
    passwords.forEach((p, index) => {
        message += `${index + 1}. ${p.name}\n`;
        message += `   Login: ${p.login}\n`;
        message += `   ID: ${p.id}\n\n`;
    });
    message += `\nUse /get <id> to view a password\nUse /search <query> to search`;
    
    ctx.reply(message);
});

// Get a specific password by ID
bot.command("get", (ctx) => {
    const userId = ctx.from.id;
    const passwordId = ctx.match?.trim();
    
    if (!passwordId) {
        ctx.reply("❌ Usage: /get <password_id>\n\nUse /list to see all your passwords.");
        return;
    }
    
    const password = db.getPasswordById(userId, passwordId);
    
    if (!password) {
        ctx.reply("❌ Password not found. Use /list to see all your passwords.");
        return;
    }
    
    ctx.reply(
        `🔐 ${password.name}\n\n` +
        `Login: ${password.login}\n` +
        `Password: ||${password.password}||\n` +
        `ID: ${password.id}\n\n` +
        `Created: ${new Date(password.createdAt).toLocaleString()}`
    ).then(msg => {
        // Auto-delete after 30 seconds
        setTimeout(() => {
            ctx.api.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
        }, 30000);
    });
});

// Search passwords
bot.command("search", (ctx) => {
    const userId = ctx.from.id;
    const query = ctx.match?.trim();
    
    if (!query) {
        ctx.reply("❌ Usage: /search <query>\n\nExample: /search gmail");
        return;
    }
    
    const results = db.searchPassword(userId, query);
    
    if (results.length === 0) {
        ctx.reply(`🔍 No passwords found for "${query}"`);
        return;
    }
    
    let message = `🔍 Found ${results.length} password(s) for "${query}":\n\n`;
    results.forEach((p, index) => {
        message += `${index + 1}. ${p.name}\n`;
        message += `   Login: ${p.login}\n`;
        message += `   ID: ${p.id}\n\n`;
    });
    message += `\nUse /get <id> to view a password`;
    
    ctx.reply(message);
});

// Delete a password
bot.command("delete", (ctx) => {
    const userId = ctx.from.id;
    const passwordId = ctx.match?.trim();
    
    if (!passwordId) {
        ctx.reply("❌ Usage: /delete <password_id>\n\nUse /list to see all your passwords.");
        return;
    }
    
    const success = db.deletePassword(userId, passwordId);
    
    if (success) {
        ctx.reply("✅ Password deleted successfully!");
    } else {
        ctx.reply("❌ Password not found.");
    }
});

// Edit a password (start conversation flow)
bot.command("edit", (ctx) => {
    const userId = ctx.from.id;
    const passwordId = ctx.match?.trim();
    
    if (!passwordId) {
        ctx.reply("❌ Usage: /edit <password_id>\n\nUse /list to see all your passwords.");
        return;
    }
    
    const password = db.getPasswordById(userId, passwordId);
    
    if (!password) {
        ctx.reply("❌ Password not found.");
        return;
    }
    
    ctx.session.editingPasswordId = passwordId;
    ctx.session.requestingEditField = true;
    
    ctx.reply(
        `✏️ Editing: ${password.name}\n\n` +
        `Current Login: ${password.login}\n` +
        `Current Password: ||${password.password}||\n\n` +
        `What would you like to edit?\n\n` +
        `Reply with:\n` +
        `• "name <new_name>" to change name\n` +
        `• "login <new_login>" to change login\n` +
        `• "password <new_password>" to change password\n` +
        `• "cancel" to cancel`
    );
});

// Message Handling
bot.on("message", async (ctx) => {
    refreshChat(ctx);
    ctx.session.deletableMessages.push(ctx.message);
    // Priority 1: Master password setup
    if (ctx.session.requestingMasterPassword) {
        const password = ctx.message.text.trim();
        ctx.deleteMessage();

        if (password.length !== 8) {
            await ctx.reply("Invalid. Password must be exactly 8 characters. Try again:");
            return;
        }

        ctx.session.requestingMasterPassword = false;
        db.saveUser(ctx.from.id, { master: password });
        await ctx.reply(`All set!`);
        return;
    }

    // Priority 2: Password name request
    if (ctx.session.requestingPasswordName) {
        const name = ctx.message.text.trim();
        if (!name) return;

        ctx.session.requestingPasswordName = false;
        ctx.session.passwordName = name;
        ctx.session.requestingPasswordLogin = true;
        await ctx.reply("Please enter a login for the password:");
        return;
    }

    // Priority 3: Password login request
    if (ctx.session.requestingPasswordLogin) {
        const login = ctx.message.text.trim();
        if (!login) return;

        const name = ctx.session.passwordName;
        ctx.session.passwordName = null;
        ctx.session.requestingPasswordLogin = false;

        const password = pr.generatePassword(12);

        // Save password to database
        const savedPassword = db.addPassword(ctx.from.id, {
            name: name,
            login: login,
            password: password
        });

        if (savedPassword) {
            const passwordMessage = await ctx.reply(
                `🔐 Password generated\n\n` +
                `Name: ${name}\n` +
                `Login: ${login}\n` +
                `Password: ||${password}||\n` +
                `ID: ${savedPassword.id}\n\n` +
                `🔒 Stored securely\n\n` +
                `⚠️ DELETE THIS MESSAGE AFTER USE ⚠️\n` +
                `Autodelete in 30s`
            );
            setTimeout(() => ctx.api.deleteMessage(passwordMessage.chat.id, passwordMessage.message_id).catch(() => {}), 30000);
        } else {
            await ctx.reply("❌ Error saving password. Please try again.");
        }
        
        return;
    }

    // Priority 4: Edit password field
    if (ctx.session.requestingEditField) {
        const text = ctx.message.text.trim().toLowerCase();
        
        if (text === 'cancel') {
            ctx.session.requestingEditField = false;
            ctx.session.editingPasswordId = null;
            await ctx.reply("❌ Edit cancelled.");
            return;
        }
        
        const parts = text.split(' ');
        const field = parts[0];
        const value = parts.slice(1).join(' ');
        
        if (!value) {
            await ctx.reply("❌ Please provide a value.\n\nExample: name My New Name");
            return;
        }
        
        const validFields = ['name', 'login', 'password'];
        if (!validFields.includes(field)) {
            await ctx.reply("❌ Invalid field. Use: name, login, or password");
            return;
        }
        
        const passwordId = ctx.session.editingPasswordId;
        const newCredentials = { [field]: value };
        
        const updated = db.editPassword(ctx.from.id, passwordId, newCredentials);
        
        if (updated) {
            ctx.session.requestingEditField = false;
            ctx.session.editingPasswordId = null;
            await ctx.reply(`✅ Password ${field} updated successfully!`);
        } else {
            await ctx.reply("❌ Error updating password.");
        }
        
        return;
    }

    // ADDING EXISTING PASSWORD

});

function refreshChat(ctx) {
    ctx.session.deletableMessages.forEach(message => {
        ctx.api.deleteMessage(message.chat.id, message.message_id).catch(() => {})
    });
    ctx.session.deletableMessages = [];
}

bot.start();
console.log('Bot started!');
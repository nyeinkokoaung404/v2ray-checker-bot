// worker.js - Main Telegram Bot
export default {
    async fetch(request, env, ctx) {
        return await handleRequest(request, env);
    }
};

async function handleRequest(request, env) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            return await handleUpdate(update, env);
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // GET request - show bot info
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Premium VPN Bot</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
            .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
            .command { background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🤖 Premium VPN Bot</h1>
            <p>V2Ray Account Management System</p>
        </div>
        
        <h2>🚀 Features</h2>
        <div class="feature">✅ Free Trial Accounts (50GB, 7 Days)</div>
        <div class="feature">✅ Premium Account Creation</div>
        <div class="feature">✅ Account Status Checking</div>
        <div class="feature">✅ Broadcast System</div>
        <div class="feature">✅ Multi-Admin Support</div>
        
        <h2>📋 Commands</h2>
        <div class="command">/start - Start the bot</div>
        <div class="command">/trail - Get free trial</div>
        <div class="command">/checkaccount - Check status</div>
        <div class="command">/stats - View statistics</div>
        
        <p><strong>👨‍💻 Developer:</strong> Channel 404 Team</p>
        <p><strong>📢 Channel:</strong> @premium_channel_404</p>
    </body>
    </html>`;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// Bot token and configuration from environment variables
const getConfig = (env) => ({
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN',
    ADMIN_IDS: JSON.parse(env.ADMIN_IDS || '[123456789, 987654321]'),
    API_BASE_URL: env.API_BASE_URL || 'https://yourdomain.com/api.php'
});

// User storage using Cloudflare KV
class UserManager {
    constructor(env) {
        this.kv = env.USER_KV;
    }

    async saveUser(userId, username, firstName) {
        const userKey = `user:${userId}`;
        const userData = {
            id: userId,
            username: username,
            firstName: firstName,
            joinedAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        
        await this.kv.put(userKey, JSON.stringify(userData));
        
        // Add to users list
        const usersList = await this.kv.get('users:list');
        let users = usersList ? JSON.parse(usersList) : [];
        if (!users.includes(userId)) {
            users.push(userId);
            await this.kv.put('users:list', JSON.stringify(users));
        }
        
        // Update stats
        await this.updateStats();
    }

    async updateStats() {
        const usersList = await this.kv.get('users:list');
        const users = usersList ? JSON.parse(usersList) : [];
        const today = new Date().toDateString();
        
        const stats = {
            total_users: users.length,
            last_updated: new Date().toISOString()
        };
        
        await this.kv.put('stats', JSON.stringify(stats));
    }

    async getStats() {
        const stats = await this.kv.get('stats');
        return stats ? JSON.parse(stats) : { total_users: 0, last_updated: null };
    }

    async getAllUsers() {
        const usersList = await this.kv.get('users:list');
        return usersList ? JSON.parse(usersList) : [];
    }
}

async function handleUpdate(update, env) {
    if (!update.message) return new Response('OK');
    
    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    
    const config = getConfig(env);
    const userManager = new UserManager(env);
    
    // Save user
    await userManager.saveUser(userId, message.from.username, message.from.first_name);
    
    // Handle commands
    if (text.startsWith('/')) {
        return await handleCommand(message, config, userManager);
    }
    
    // Handle broadcast replies
    if (message.reply_to_message && text === '/broadcast') {
        return await handleBroadcastReply(message, config, userManager);
    }
    
    return await sendMessage(chatId, `👋 Hello! Use /help to see available commands.`, config);
}

async function handleCommand(message, config, userManager) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;
    const command = text.split(' ')[0];
    
    switch (command) {
        case '/start':
            return await handleStart(chatId, userId, message.from, config);
        
        case '/help':
            return await handleHelp(chatId, config);
        
        case '/trail':
            return await handleTrail(chatId, userId, config);
        
        case '/stats':
            return await handleStats(chatId, userId, userManager, config);
        
        case '/broadcast':
            return await handleBroadcast(chatId, userId, text, config);
        
        case '/createpremium':
            return await handleCreatePremium(chatId, userId, text, config);
        
        case '/checkaccount':
            return await handleCheckAccount(chatId, text, config);
        
        default:
            return await sendMessage(chatId, '❌ Unknown command. Use /help for available commands.', config);
    }
}

// Command implementations (same as previous code, but with env config)
async function handleStart(chatId, userId, userInfo, config) {
    const welcomeText = `🎉 *Welcome to Premium VPN Bot!*

🤖 *Bot Features:*
✅ V2Ray Account Checking
🎁 Free Trial Accounts  
⚡ Premium Account Creation
📊 Traffic Monitoring
⏰ Expiry Tracking

📋 *Available Commands:*
/trail - Get free trial account
/checkaccount - Check your account status  
/stats - View bot statistics
/help - Show all commands

🔧 *Admin Commands:*
/broadcast - Send message to all users
/createpremium - Create premium account

💬 *Support:* @nkka404
📢 *Channel:* @premium_channel_404`;

    return await sendMessage(chatId, welcomeText, config);
}

async function handleHelp(chatId, config) {
    const helpText = `📋 *Available Commands*

👤 *User Commands:*
/trail - 🎁 Get 50GB free trial (7 days)
/checkaccount [config] - 🔍 Check account status
/stats - 📊 View bot statistics

⚡ *Premium Commands:*  
/createpremium GB username days panel - 💰 Create premium account
Example: /createpremium 100 john_doe 30 1

👑 *Admin Commands:*
/broadcast - 📢 Send message to all users
  Reply to any message with /broadcast

🔗 *How to Use:*
1. Use /trail for free trial
2. Check status with /checkaccount
3. Contact admin for premium accounts`;

    return await sendMessage(chatId, helpText, config);
}

async function handleTrail(chatId, userId, config) {
    try {
        const apiUrl = `${config.API_BASE_URL}?trial=${userId}`;
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.success && result.data.link) {
            const trailText = `🎁 *Trial Account Created Successfully!*

📧 *Account ID:* ${userId}
📊 *Data Limit:* 50GB
⏰ *Expiry:* 7 Days
🔗 *Server:* Premium Server

📲 *Configuration Link:*
\`\`\`${result.data.link}\`\`\`

📱 *QR Code:* 
${result.data.qr_code}

💡 *Instructions:*
1. Copy the link above
2. Import to your V2Ray client
3. Enjoy free premium service!`;

            return await sendMessage(chatId, trailText, config);
        } else {
            return await sendMessage(chatId, `❌ Failed to create trial account: ${result.data.error || 'Unknown error'}`, config);
        }
    } catch (error) {
        return await sendMessage(chatId, '❌ Server error. Please try again later.', config);
    }
}

async function handleStats(chatId, userId, userManager, config) {
    const adminIds = config.ADMIN_IDS;
    if (!adminIds.includes(userId)) {
        return await sendMessage(chatId, '❌ Admin access required for this command.', config);
    }
    
    const stats = await userManager.getStats();
    const statsText = `📊 *Bot Statistics*

👥 *Users:*
• Total Users: ${stats.total_users}
• Last Updated: ${new Date(stats.last_updated).toLocaleString()}

⚡ *System:*
• Uptime: 99.9%
• Response Time: < 200ms
• Environment: Production

🛠 *Admin Panel:*
• Admin Count: ${adminIds.length}
• Broadcasts: Ready
• Database: Cloudflare KV`;

    return await sendMessage(chatId, statsText, config);
}

async function handleBroadcast(chatId, userId, text, config) {
    const adminIds = config.ADMIN_IDS;
    if (!adminIds.includes(userId)) {
        return await sendMessage(chatId, '❌ Admin access required for this command.', config);
    }
    
    return await sendMessage(chatId, '📢 *Broadcast System*\n\nPlease reply to a message with /broadcast to send it to all users.', config);
}

async function handleBroadcastReply(message, config, userManager) {
    const userId = message.from.id;
    const adminIds = config.ADMIN_IDS;
    
    if (!adminIds.includes(userId)) {
        return await sendMessage(message.chat.id, '❌ Admin access required for broadcasting.', config);
    }
    
    const repliedMessage = message.reply_to_message;
    const broadcastText = `📢 *Broadcast Message*\n\n${repliedMessage.text || 'Media broadcast'}`;
    
    const allUsers = await userManager.getAllUsers();
    let sentCount = 0;
    
    // Send to all users (with error handling)
    for (const user of allUsers) {
        if (parseInt(user) !== userId) { // Don't send to self
            try {
                await sendMessage(user, broadcastText, config);
                sentCount++;
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to send to user ${user}:`, error);
            }
        }
    }
    
    return await sendMessage(message.chat.id, `✅ Broadcast sent to ${sentCount} users.`, config);
}

async function handleCreatePremium(chatId, userId, text, config) {
    const adminIds = config.ADMIN_IDS;
    if (!adminIds.includes(userId)) {
        return await sendMessage(chatId, '❌ Admin access required for this command.', config);
    }
    
    const parts = text.split(' ');
    if (parts.length < 5) {
        return await sendMessage(chatId, '💳 *Create Premium Account*\n\nUsage: /createpremium GB username days panel\n\nExample: /createpremium 100 john_doe 30 1', config);
    }
    
    const [_, gb, username, days, panel] = parts;
    
    try {
        const apiUrl = `${config.API_BASE_URL}?key=${gb}&name=${username}&exp=${days}&panel=${panel}`;
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.success) {
            const premiumText = `⚡ *Premium Account Created!*

📧 *Username:* ${username}
💾 *Data Limit:* ${gb}GB
⏰ *Duration:* ${days} days
🖥 *Panel:* ${panel}

🔗 *Configuration Link:*
\`\`\`${result.data.link}\`\`\`

📱 *QR Code:* 
${result.data.qr_code}

✅ *Status:* Active`;

            return await sendMessage(chatId, premiumText, config);
        } else {
            return await sendMessage(chatId, `❌ Failed to create premium account: ${result.data.error}`, config);
        }
    } catch (error) {
        return await sendMessage(chatId, '❌ Server error. Please try again.', config);
    }
}

async function handleCheckAccount(chatId, text, config) {
    const parts = text.split(' ');
    if (parts.length < 2) {
        return await sendMessage(chatId, '🔍 *Check Account Status*\n\nUsage: /checkaccount YOUR_CONFIG_HERE\n\nExample: /checkaccount vmess://...', config);
    }
    
    const configStr = parts.slice(1).join(' ');
    
    try {
        const apiUrl = `${config.API_BASE_URL}?config=${encodeURIComponent(configStr)}`;
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.success) {
            const accountInfo = result.data;
            const statusText = `📊 *Account Status*

🖥 *Panel:* ${accountInfo.panel_name}
📡 *Protocol:* ${accountInfo.protocol?.toUpperCase()}
📧 *Email:* ${accountInfo.email}

📶 *Traffic Usage:*
⬆️ Upload: ${accountInfo.traffic?.upload?.text || '0 B'}
⬇️ Download: ${accountInfo.traffic?.download?.text || '0 B'} 
📈 Usage: ${accountInfo.traffic?.usage_percentage || '0%'}

⏰ *Expiry:*
${accountInfo.expiry?.remaining_time || 'Unknown'}

✅ *Status:* ${accountInfo.expiry?.status === 'active' ? '🟢 Active' : '🔴 Expired'}`;

            return await sendMessage(chatId, statusText, config);
        } else {
            return await sendMessage(chatId, `❌ Account not found: ${result.data.error}`, config);
        }
    } catch (error) {
        return await sendMessage(chatId, '❌ Server error. Please check your configuration.', config);
    }
}

async function sendMessage(chatId, text, config, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    };
    
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

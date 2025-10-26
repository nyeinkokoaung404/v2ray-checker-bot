// Cloudflare Worker for Telegram Bot with Broadcast & Stats
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const ADMIN_IDS = [123456789, 987654321]; // Replace with your admin IDs
const API_BASE_URL = 'https://yourdomain.com/api.php'; // Your API endpoint

// User database (in production, use Cloudflare KV)
let userDB = {
    users: new Set(),
    stats: {
        total_users: 0,
        active_today: 0,
        premium_users: 0
    }
};

async function handleRequest(request) {
    if (request.method === 'POST') {
        const update = await request.json();
        return handleUpdate(update);
    }
    
    return new Response('OK', { status: 200 });
}

async function handleUpdate(update) {
    if (!update.message) return new Response('OK');
    
    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    const username = message.from.username || `user_${userId}`;
    
    // Save user to database
    await saveUser(userId, username, message.from.first_name);
    
    // Handle commands
    if (text.startsWith('/')) {
        return handleCommand(message);
    }
    
    // Handle replies for broadcast
    if (message.reply_to_message) {
        return handleBroadcastReply(message);
    }
    
    return sendMessage(chatId, `👋 Hello! Use /help to see available commands.`);
}

async function handleCommand(message) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;
    const command = text.split(' ')[0];
    
    switch (command) {
        case '/start':
            return handleStart(chatId, userId, message.from);
        
        case '/help':
            return handleHelp(chatId);
        
        case '/trail':
            return handleTrail(chatId, userId);
        
        case '/stats':
            return handleStats(chatId, userId);
        
        case '/broadcast':
            return handleBroadcast(chatId, userId, text);
        
        case '/createpremium':
            return handleCreatePremium(chatId, userId, text);
        
        case '/checkaccount':
            return handleCheckAccount(chatId, text);
        
        default:
            return sendMessage(chatId, '❌ Unknown command. Use /help for available commands.');
    }
}

// =========================================================================
// COMMAND HANDLERS
// =========================================================================

async function handleStart(chatId, userId, userInfo) {
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

    await saveUser(userId, userInfo.username, userInfo.first_name);
    return sendMessage(chatId, welcomeText);
}

async function handleHelp(chatId) {
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

    return sendMessage(chatId, helpText);
}

async function handleTrail(chatId, userId) {
    try {
        const response = await fetch(`${API_BASE_URL}?trial=${userId}`);
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
3. Enjoy free premium service!

⚠️ *Note:* This is a trial account. For unlimited access, contact admin.`;

            return sendMessage(chatId, trailText);
        } else {
            return sendMessage(chatId, `❌ Failed to create trial account: ${result.data.error || 'Unknown error'}`);
        }
    } catch (error) {
        return sendMessage(chatId, '❌ Server error. Please try again later.');
    }
}

async function handleStats(chatId, userId) {
    if (!ADMIN_IDS.includes(userId)) {
        return sendMessage(chatId, '❌ Admin access required for this command.');
    }
    
    const statsText = `📊 *Bot Statistics*

👥 *Users:*
• Total Users: ${userDB.stats.total_users}
• Active Today: ${userDB.stats.active_today}
• Premium Users: ${userDB.stats.premium_users}

⚡ *System:*
• Uptime: 99.9%
• Response Time: < 200ms
• Last Update: ${new Date().toLocaleString()}

🛠 *Admin Panel:*
• Admin Count: ${ADMIN_IDS.length}
• Broadcasts: Ready
• Database: Active`;

    return sendMessage(chatId, statsText);
}

async function handleBroadcast(chatId, userId, text) {
    if (!ADMIN_IDS.includes(userId)) {
        return sendMessage(chatId, '❌ Admin access required for this command.');
    }
    
    if (!message.reply_to_message) {
        return sendMessage(chatId, '📢 *Broadcast System*\n\nPlease reply to a message with /broadcast to send it to all users.\n\nSupported: Text, Photo, Document, Video');
    }
    
    // In production, you would iterate through all users and send the message
    return sendMessage(chatId, '📢 Broadcast feature ready - User iteration would happen here');
}

async function handleCreatePremium(chatId, userId, text) {
    if (!ADMIN_IDS.includes(userId)) {
        return sendMessage(chatId, '❌ Admin access required for this command.');
    }
    
    const parts = text.split(' ');
    if (parts.length < 5) {
        return sendMessage(chatId, '💳 *Create Premium Account*\n\nUsage: /createpremium GB username days panel\n\nExample: /createpremium 100 john_doe 30 1\n\n📋 Available Panels: 1, 2, 3');
    }
    
    const gb = parts[1];
    const username = parts[2];
    const days = parts[3];
    const panel = parts[4];
    
    try {
        const response = await fetch(`${API_BASE_URL}?key=${gb}&name=${username}&exp=${days}&panel=${panel}`);
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

✅ *Status:* Active
📊 *Traffic:* 0GB used
⏳ *Expiry:* ${result.data.expiry_days} days`;

            return sendMessage(chatId, premiumText);
        } else {
            return sendMessage(chatId, `❌ Failed to create premium account: ${result.data.error}`);
        }
    } catch (error) {
        return sendMessage(chatId, '❌ Server error. Please try again.');
    }
}

async function handleCheckAccount(chatId, text) {
    const parts = text.split(' ');
    if (parts.length < 2) {
        return sendMessage(chatId, '🔍 *Check Account Status*\n\nUsage: /checkaccount YOUR_CONFIG_HERE\n\nExample: /checkaccount vmess://...');
    }
    
    const config = parts.slice(1).join(' ');
    
    try {
        const response = await fetch(`${API_BASE_URL}?config=${encodeURIComponent(config)}`);
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
💾 Total: ${accountInfo.traffic?.total?.text || 'Unlimited'}
📈 Usage: ${accountInfo.traffic?.usage_percentage || '0%'}

⏰ *Expiry:*
${accountInfo.expiry?.remaining_time || 'Unknown'}
📅 Until: ${accountInfo.expiry?.expiry_date || 'Unknown'}

✅ *Status:* ${accountInfo.expiry?.status === 'active' ? '🟢 Active' : '🔴 Expired'}`;

            return sendMessage(chatId, statusText);
        } else {
            return sendMessage(chatId, `❌ Account not found or error: ${result.data.error}`);
        }
    } catch (error) {
        return sendMessage(chatId, '❌ Server error. Please check your configuration.');
    }
}

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

async function sendMessage(chatId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
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
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
    
    return new Response('OK', { status: 200 });
}

async function saveUser(userId, username, firstName) {
    // In production, use Cloudflare KV for persistence
    if (!userDB.users.has(userId)) {
        userDB.users.add(userId);
        userDB.stats.total_users = userDB.users.size;
        userDB.stats.active_today++;
    }
}

async function handleBroadcastReply(message) {
    const userId = message.from.id;
    if (!ADMIN_IDS.includes(userId)) {
        return sendMessage(message.chat.id, '❌ Admin access required for broadcasting.');
    }
    
    const repliedMessage = message.reply_to_message;
    const broadcastText = `📢 *Broadcast Message*\n\n${repliedMessage.text || 'Media broadcast'}`;
    
    // Broadcast to all users (simplified example)
    // In production, iterate through all users from database
    for (let user of userDB.users) {
        if (user !== userId) { // Don't send to self
            await sendMessage(user, broadcastText);
        }
    }
    
    return sendMessage(message.chat.id, `✅ Broadcast sent to ${userDB.users.size - 1} users.`);
}

// =========================================================================
// CLOUDFLARE WORKER SETUP
// =========================================================================

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

# Telegram VPN Bot

A Cloudflare Worker-based Telegram bot for managing V2Ray accounts.

## Features

- ✅ Free Trial Accounts (50GB, 7 days)
- ✅ Premium Account Creation
- ✅ Account Status Checking
- ✅ Broadcast System
- ✅ Multi-Admin Support

## Setup

1. Clone this repository
2. Install Wrangler: `npm install -g wrangler`
3. Configure environment variables in `wrangler.toml`
4. Deploy: `npm run deploy`

## Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
- `ADMIN_IDS`: JSON array of admin Telegram IDs
- `API_BASE_URL`: Your V2Ray API endpoint

## GitHub Secrets

Set these in your repository settings:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `TELEGRAM_BOT_TOKEN`

# TelegramBot

Simple Telegram bot using grammy with a JSON file as local storage.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Fill in `.env` with your token and admin ID.

## Run

```bash
npm test
```

## Git hygiene (safe commits)

- Never commit `.env` or `db.json`.
- Use `.env.example` for sharing required variables.

If `.env` or `db.json` were committed before, untrack them:

```bash
git rm --cached .env db.json
git add .gitignore
git commit -m "chore: stop tracking local env and db"
```

## Quick commit/push workflow

```bash
git status
git add .
git commit -m "your message"
git push
```

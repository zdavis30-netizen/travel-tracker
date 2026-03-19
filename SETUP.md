# Travel Tracker — Setup Guide

---

## Step 1: Firebase (shared real-time database)

### 1a. Create a Firebase project
1. Go to **firebase.google.com** → click **Get started** → **Create a project**
2. Name it `travel-tracker` → click through (disable Google Analytics if asked)
3. Once created, click **Continue**

### 1b. Create a Realtime Database
1. In the left sidebar, click **Build** → **Realtime Database**
2. Click **Create Database**
3. Choose **United States** → click **Next**
4. Select **Start in test mode** → click **Enable**
   _(This lets both of you read/write without login — fine for a private shared app)_

### 1c. Get your config keys
1. Click the ⚙️ gear icon next to "Project Overview" → **Project settings**
2. Scroll down to **Your apps** → click the **</>** (Web) icon
3. Name the app `travel-tracker-web` → click **Register app**
4. You'll see a block of code like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "travel-tracker-xxxxx.firebaseapp.com",
     databaseURL: "https://travel-tracker-xxxxx-default-rtdb.firebaseio.com",
     projectId: "travel-tracker-xxxxx",
     ...
   };
   ```
5. Keep this tab open — you'll need these values in Step 2

---

## Step 2: Deploy to Vercel (shareable URL)

### 2a. Push the code to GitHub
1. Go to **github.com** → click **+** → **New repository**
2. Name it `travel-tracker` → **Private** → click **Create repository**
3. Open Terminal, navigate to the project, and run:
   ```bash
   cd /Users/zachdavis/Claude/travel-tracker
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/travel-tracker.git
   git push -u origin main
   ```
   _(Replace `YOUR_USERNAME` with your GitHub username)_

### 2b. Deploy on Vercel
1. Go to **vercel.com** → **Sign up with GitHub**
2. Click **Add New** → **Project**
3. Find `travel-tracker` in the list → click **Import**
4. Expand **Environment Variables** and add each one:

   | Name | Value |
   |------|-------|
   | `VITE_FIREBASE_API_KEY` | `AIza...` from Step 1c |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `travel-tracker-xxxxx.firebaseapp.com` |
   | `VITE_FIREBASE_DATABASE_URL` | `https://travel-tracker-xxxxx-default-rtdb.firebaseio.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `travel-tracker-xxxxx` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `travel-tracker-xxxxx.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | (the number from the config) |
   | `VITE_FIREBASE_APP_ID` | `1:...` from the config |

5. Click **Deploy** — takes about 1 minute
6. You'll get a URL like `https://travel-tracker-abc123.vercel.app`
7. **Share that link with Arianne** — you're both live!

---

## Step 3: Weekly digest email

### 3a. Get a free Resend account
1. Go to **resend.com** → **Get started free**
2. Verify your email address
3. Click **API Keys** in the sidebar → **Create API Key** → name it `travel-tracker`
4. Copy the key (starts with `re_...`) — you only see it once

### 3b. Set up your sending domain (or use the sandbox)
- **Easiest (no domain needed):** Resend gives you a sandbox address like `onboarding@resend.dev` — works immediately for testing, but both recipients must be your verified email
- **For real use:** Add your own domain (e.g. `yourdomain.com`) in Resend → Domains → Add Domain, then update the `from` address in `api/send-weekly-digest.js`:
  ```js
  from: 'Travel Tracker <digest@yourdomain.com>',
  ```

### 3c. Add remaining env vars to Vercel
Go to your Vercel project → **Settings** → **Environment Variables** and add:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | `re_...` from Step 3a |
| `DIGEST_SECRET` | Any password you choose, e.g. `mySecretWord42` |
| `ZACH_EMAIL` | zach@example.com |
| `ARIANNE_EMAIL` | arianne@example.com |

Then go to **Deployments** → click the three dots on the latest deploy → **Redeploy** to pick up the new variables.

### 3d. Schedule the weekly send
1. Go to **cron-job.org** → **Sign up free**
2. Click **CREATE CRONJOB**
3. Fill in:
   - **Title:** Travel Tracker Weekly Digest
   - **URL:** `https://travel-tracker-abc123.vercel.app/api/send-weekly-digest?secret=mySecretWord42`
     _(Replace with your actual Vercel URL and the secret you chose above)_
   - **Schedule:** Every week → Sunday → 8:00 AM
4. Click **Create** — done!

---

## ✅ You're live

- **Shared URL:** `https://travel-tracker-abc123.vercel.app`
- Both of you can open it on any device, phone or computer
- Changes sync in real time
- Every Sunday morning you'll both get an email summary of the coming week

## Quick-add examples (for reference)

| Type | Example |
|------|---------|
| Location | `Zach Naperville Mar 20-25` |
| Location (both) | `both Chicago Apr 1` |
| Flight | `Arianne AA456 Apr 3` |
| Hotel | `Zach Marriott Milwaukee Mar 17-19` |
| With full date | `Zach UA123 March 20` |

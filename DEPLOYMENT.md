# TransitX Cloud Deployment Guide (100% Free Tier)

This guide walks you through deploying TransitX so you can use it anywhere in the world on mobile data, with genuine satellite GPS tracking, secure HTTPS, and installable PWA mobile apps.

---

## 🏗️ Architecture Overview

```
 [Drivers & Students on 4G/5G/Wi-Fi]
                 │
                 ▼ (HTTPS / WSS)
 ┌──────────────────────────────────────────────────┐
 │  Frontend: Vercel (https://transitx.vercel.app)  │
 └──────────────────────┬───────────────────────────┘
                        │ API & Socket.IO
                        ▼
 ┌──────────────────────────────────────────────────┐
 │  Backend: Render (https://transitx.onrender.com) │
 └──────────────────────┬───────────────────────────┘
                        │ Mongoose Connection
                        ▼
 ┌──────────────────────────────────────────────────┐
 │  Database: MongoDB Atlas (Cloud Cluster M0)      │
 └──────────────────────────────────────────────────┘
```

---

## Step 1: Create Free Cloud Database (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Create a Deployment** and select the **M0 Free** shared tier.
3. Under **Security Quickstart**:
   - **Database User**: Create a username (e.g. `transitx_admin`) and a password (e.g. `TransitX@2026`). *Save these credentials.*
   - **IP Access List**: Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect.
4. Go to **Database** -> Click **Connect** -> Choose **Drivers (Node.js)**.
5. Copy your connection string. It looks like:
   ```text
   mongodb+srv://transitx_admin:<password>@cluster0.abcde.mongodb.net/transitx?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and ensure `/transitx` is set as the database name).*

---

## Step 2: Push Your Code to GitHub

If you haven't already, push your project to a GitHub repository:

```bash
cd C:\Users\soham\.gemini\antigravity\scratch\transitx
git init
git add .
git commit -m "feat: TransitX production deployment ready with Outrun theme & live GPS"
git branch -M main
git remote add origin https://github.com/<your-username>/transitx.git
git push -u origin main
```

---

## Step 3: Deploy Backend (Render.com)

1. Go to [Render.com](https://render.com/) and sign in with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Connect your `transitx` GitHub repository.
4. Configure the service settings:
   - **Name**: `transitx-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Scroll to **Environment Variables** and add:
   - `MONGODB_URI` = *(Your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET` = *(Any random 32-character secret key)*
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL from Render (e.g. `https://transitx-backend.onrender.com`).

> **Seed 20 Goa Routes to Cloud Database**:
> In Render dashboard, go to the **Shell** tab of your deployed backend and run:
> ```bash
> npm run seed
> ```
> This populates all 20 Goa campus bus routes, stops, and demo driver accounts into your cloud MongoDB database!

---

## Step 4: Deploy Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your `transitx` repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and choose `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://transitx-backend.onrender.com/api` *(Your Render backend URL + /api)*
   - `VITE_SOCKET_URL` = `https://transitx-backend.onrender.com` *(Your Render backend URL)*
6. Click **Deploy**.
7. In ~30 seconds, Vercel will give you a live production URL (e.g. `https://transitx.vercel.app`) with automatic HTTPS!

---

## Step 5: Test Real-Life GPS on Mobile

1. Open your live Vercel URL on your mobile phone: `https://your-app.vercel.app`
2. **Log in as a Driver**:
   - Tap **Portal Login** -> log in with demo driver credentials or your registered account.
   - Switch engine mode to **GENUINE GPS**.
   - Tap **"Ignition — Start Share"**.
   - When the browser asks for Location permissions, tap **Allow**.
3. **Open as a Student on another device**:
   - Open `https://your-app.vercel.app` on any other smartphone or laptop.
   - Go to **Student Space** -> **Live Bus Map**.
   - Select the bus -> you will see the bus icon moving live as the driver drives down the road!

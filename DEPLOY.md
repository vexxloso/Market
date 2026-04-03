# Deploy on Ubuntu VPS (full copy-paste guide)

This project needs **Node.js**, **PostgreSQL**, **Nginx**, and the **custom server** `node server.mjs` (for Socket.IO). All shell commands below are for **Ubuntu** (terminal over SSH).

---

## Shell basics (read once)

| You type | What it means |
|----------|----------------|
| **`cd ~/Market`** | Go into your project folder (`~` = your home directory). |
| **`ls`** | List files in the current folder. |
| **`pwd`** | Print the current folder path. |
| **`nano file`** | Open a text editor. Save: **Ctrl+O**, **Enter**. Exit: **Ctrl+X**. |
| **`sudo command`** | Run as administrator (you will enter your password). |
| **`# text`** | In this guide, a line starting with **`#`** in a code block is a **comment** — do not paste the **`#`** if you are copying into `.env` (env files treat `#` as comment, which is OK). |
| **Ctrl+C** | Stop the running program in the terminal (e.g. stop `node server.mjs`). |

---

## Part A — What you will type (overview)

1. Log in to the server with SSH (PuTTY, Bitvise, or `ssh user@IP`).
2. Install **Nginx**, **Git**, **PostgreSQL**, **Node.js**.
3. Create database user + database.
4. Clone your project into a folder (e.g. `~/Market`).
5. Create a **`.env`** file (copy from **Part B** in this file, or from the project’s `.env` after editing).
6. Run **`npm ci`**, **`prisma migrate`**, **`npm run build`**.
7. Start the app with **`PORT=5000 npm start`** (production mode; required for static assets).
8. Edit **Nginx** so **`/market`** goes to port **5000**.
9. Reload Nginx: **`sudo systemctl reload nginx`**.

Lines starting with **`#`** are comments (not run). When you see a command, press **Enter** after pasting it.

---

## Step 1 — Log in to Ubuntu

On your PC, open SSH and connect (replace with your user and IP):

```bash
ssh market@213.165.78.107
```

Type your password when asked.

---

## Step 2 — Update Ubuntu and install basic packages

```bash
sudo apt update
sudo apt install -y git nginx curl
```

- **`sudo`** — run as administrator (you will type your password).
- **`apt update`** — refresh package list.
- **`apt install`** — install **git**, **nginx**, **curl**.

---

## Step 3 — Install Node.js 20 (using NodeSource; simple for beginners)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Check:

```bash
node -v
```

You should see something like **`v20.x.x`**.

---

## Step 4 — Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

Start service (usually already running):

```bash
sudo systemctl enable --now postgresql
```

---

## Step 5 — Create database user and database

Open PostgreSQL shell as system user **`postgres`**:

```bash
sudo -u postgres psql
```

Inside **`psql`**, run (change **`MyStrongPassword`** to your own password; end each line with **Enter**):

```sql
CREATE USER market WITH PASSWORD 'MyStrongPassword';
CREATE DATABASE market OWNER market;
GRANT ALL PRIVILEGES ON DATABASE market TO market;
\q
```

Copy the password — you will put it in **`.env`** as **`DATABASE_URL`**.

---

## Step 6 — Get the project on the server

If you use **Git**:

```bash
cd ~
git clone YOUR_REPOSITORY_URL Market
cd Market
```

If you upload a ZIP instead, unpack it into **`~/Market`** so **`package.json`** is at **`~/Market/package.json`**.

---

## Step 7 — Create the `.env` file

Go to the project folder:

```bash
cd ~/Market
```

**Option A — copy the ready template (fewest steps)**

The file **`deploy/ubuntu.env`** lists every variable for **`http://213.165.78.107`** + **`/market`**. Copy it, then edit secrets:

```bash
cd ~/Market
cp deploy/ubuntu.env .env
nano .env
```

In **nano**:

1. Replace **`YOUR_DB_PASSWORD`** with the PostgreSQL password from Step 5.
2. Run this in the terminal (you can open a second SSH session), then paste the result into **`JWT_SECRET`**:

```bash
openssl rand -base64 32
```

3. Save **nano**: **Ctrl+O**, **Enter**, then **Ctrl+X** to exit.

**Option B — new empty file**

```bash
nano .env
```

Paste everything from **Part B** below, edit passwords, save the same way.

---

## Part B — Full `.env` to copy on the VPS (Lottery + Market on `/market`)

Same content as **`deploy/ubuntu.env`**. Replace **`MyStrongPassword`** and **`JWT`**.

```env
DATABASE_URL="postgresql://market:MyStrongPassword@127.0.0.1:5432/market?schema=public"
DIRECT_DATABASE_URL="postgresql://market:MyStrongPassword@127.0.0.1:5432/market?schema=public"

ADMIN_EMAIL="andrea.business112@gmail.com"

JWT_SECRET="PASTE_OUTPUT_OF_openssl_rand_base64_32"

NEXT_PUBLIC_APP_URL=http://213.165.78.107
NEXT_PUBLIC_BASE_PATH=/market

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-browser-key"

STRIPE_SECRET_KEY=
```

**Important:** After you change **`NEXT_PUBLIC_APP_URL`** or **`NEXT_PUBLIC_BASE_PATH`**, run **`npm run build`** again on the server.

---

## Step 8 — Install dependencies (on Linux only)

```bash
cd ~/Market
rm -rf node_modules .next
npm ci
```

Never copy **`node_modules`** from Windows to Ubuntu.

---

## Step 9 — Database tables and build

```bash
cd ~/Market
npx prisma generate
npx prisma migrate deploy
npm run build
```

If **`migrate deploy`** errors, fix **`DATABASE_URL`** in **`.env`**.

---

## Step 10 — Run the app (test)

In terminal:

```bash
cd ~/Market
export PORT=5000
npm start
```

(`npm start` sets **`NODE_ENV=production`** — required so Next serves the **`npm run build`** output. Running **`node server.mjs`** without that often causes **500** on CSS/JS.)

Leave this running. You should see **`Ready`** and **`socket.io`**.

Stop later with **Ctrl+C**.

---

## Step 11 — Nginx: Lottery on `/`, Market on `/market`

Edit the site that already serves Lottery (file name may vary):

```bash
sudo nano /etc/nginx/sites-available/default
```

Inside the **`server { listen 80; ... }`** block, put **`/socket.io`** and **`/market`** **above** the **`location /`** block for Lottery:

```nginx
    location /socket.io {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location ^~ /market {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        root /var/www/lottery;
        try_files $uri $uri/ /index.html;
    }
```

If **Lottery** uses another **`root`**, keep yours. Save: **Ctrl+O**, **Enter**, **Ctrl+X**.

Test Nginx:

```bash
sudo nginx -t
```

Reload:

```bash
sudo systemctl reload nginx
```

Open in browser: **`http://213.165.78.107/market`**

---

## Step 12 — Firewall (if `ufw` is enabled)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Only open extra ports if you use them.

---

## Step 13 — Keep the app running after you close SSH (systemd)

Create a service file:

```bash
sudo nano /etc/systemd/system/market.service
```

Paste (change **`User=market`** and **`WorkingDirectory`** if your user or path differs):

```ini
[Unit]
Description=Market Next.js + Socket.IO
After=network.target postgresql.service

[Service]
Type=simple
User=market
WorkingDirectory=/home/market/Market
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=/home/market/Market/.env
ExecStart=/usr/bin/node server.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Find where **`node`** is:

```bash
which node
```

Put that full path in **`ExecStart=`** if it is not **`/usr/bin/node`**.

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now market
sudo systemctl status market
```

View logs:

```bash
journalctl -u market -f
```

---

## After a code update

```bash
cd ~/Market
git pull
rm -rf node_modules .next
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart market
sudo nginx -t && sudo systemctl reload nginx
```

---

## Quick checks on the server

| Command | What it does |
|---------|----------------|
| `curl -sI http://127.0.0.1:5000 \| head` | Is Node answering? |
| `curl -sI http://127.0.0.1/market \| head` | Only works if Nginx listens on 80 locally — use **`curl -sI http://127.0.0.1:8080`** if you use 8080 instead |
| `sudo ss -tlnp \| grep 5000` | Something listening on 5000? |
| `sudo systemctl status nginx` | Is Nginx running? |

---

## Common errors (short)

| Problem | What to do |
|--------|------------|
| **`EADDRINUSE`** on port | Another program uses the port — **`sudo ss -tlnp \| grep 5000`** then **`kill PID`** or change **`PORT`**. |
| **502 Bad Gateway** | App not running, or **`proxy_pass`** port wrong. |
| **Build error `lightningcss` / missing module** | **`rm -rf node_modules && npm ci`** on **Ubuntu**, rebuild. |
| **Page works on server `curl` but not from home** | Provider firewall or **`ufw`** — allow **80**/443. |
| **500 on CSS/JS (`turbopack` in filenames)** | You were in **dev** mode with a **production** `.next` build. Use **`PORT=5000 npm start`** or **`export NODE_ENV=production`** before **`node server.mjs`**. Locally use **`npm run dev`**. |

---

## Local Windows development

In **`.env`** set:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_PATH=
```

Use **`npm run dev`** (sets **`NODE_ENV=development`**) — do not use bare **`node server.mjs`** for local dev if you already ran **`npm run build`**, or static assets can 500.

---

## Files in the repo

| File | Purpose |
|------|--------|
| **`.env`** | Local dev on your PC (see top of file). |
| **`deploy/ubuntu.env`** | All variables for Ubuntu VPS — copy to server as **`.env`**. |
| **`.env.example`** | Short template with `YOUR_*` placeholders. |
| **`DEPLOY.md`** | This guide. |

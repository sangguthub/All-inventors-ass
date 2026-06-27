LIVE LINK:-
allo-inventory.vercel.app

# Allo Inventory Reservation System

A full-stack inventory reservation system built as part of the **Allo Engineering Take-Home Exercise**. The application simulates an e-commerce checkout flow where inventory is temporarily reserved to prevent overselling during concurrent purchases.

---

# Features

* Inventory management across multiple warehouses
* Reserve inventory for 10 minutes
* Automatic reservation expiration
* Confirm purchase before reservation expires
* Prevent overselling using database transactions
* Background cron job for releasing expired reservations
* Responsive Next.js UI
* PostgreSQL database with Prisma ORM
* Redis support using Upstash

---

# Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* Prisma ORM
* PostgreSQL (Supabase)

### Database

* Supabase PostgreSQL

### Cache

* Upstash Redis

### Deployment

* Vercel

---

# Project Structure

```text
allo-inventory/
│
├── app/
├── components/
├── lib/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── scripts/
├── package.json
└── README.md
```

---

# Prerequisites

Before running the project, install:

* Node.js (v20 or later)
* npm
* Git
* PostgreSQL (or Supabase account)
* Vercel account
* Upstash Redis account

---

# Supabase Setup

## 1. Create a Project

1. Visit **https://supabase.com**
2. Click **Start your project**
3. Sign in using GitHub or Google
4. Click **New Project**

Fill in:

* Project Name: `allo-inventory`
* Region: Singapore or South Asia
* Database Password: Create a strong password and save it.

Wait until the project is created.

---

## 2. Get Database Connection String

1. Open your project
2. Click **Connect**
3. Select the **Direct** tab
4. Copy the PostgreSQL connection string
5. Replace:

```
[YOUR-PASSWORD]
```

with your database password.

Example:

```env
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

---

# Local Installation

Clone the repository.

```bash
git clone https://github.com/YOUR_USERNAME/allo-inventory.git
```

Move into the project.

```bash
cd allo-inventory
```

Install dependencies.

```bash
npm install
```

---

# Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

UPSTASH_REDIS_REST_URL=

UPSTASH_REDIS_REST_TOKEN=

CRON_SECRET=allo-secret-abc123

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

# Database Setup

Run Prisma migration.

```bash
npx prisma migrate dev --name init
```

Seed the database.

```bash
npx prisma db seed
```

---

# Run the Application

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# GitHub Deployment

Initialize Git.

```bash
git init
```

Stage files.

```bash
git add .
```

Commit.

```bash
git commit -m "feat: allo inventory reservation system"
```

Create a GitHub repository named:

```
allo-inventory
```

Connect it.

```bash
git remote add origin https://github.com/YOUR_USERNAME/allo-inventory.git
```

Rename branch.

```bash
git branch -M main
```

Push code.

```bash
git push -u origin main
```

---

# Vercel Deployment

1. Login to Vercel.
2. Click **Add New Project**.
3. Import the GitHub repository.
4. Add the following environment variables.

| Variable                 | Value                   |
| ------------------------ | ----------------------- |
| DATABASE_URL             | Supabase PostgreSQL URL |
| UPSTASH_REDIS_REST_URL   | Upstash URL             |
| UPSTASH_REDIS_REST_TOKEN | Upstash Token           |
| CRON_SECRET              | allo-secret-abc123      |
| NEXT_PUBLIC_BASE_URL     | Your Vercel URL         |

Deploy the project.

After deployment:

Update

```
NEXT_PUBLIC_BASE_URL
```

to the actual Vercel deployment URL.

Redeploy once.

---

# Production Database Seed

Seed the production database.

```bash
npx prisma db seed
```

---

# Testing

Verify the following functionality.

* Inventory is displayed correctly.
* Three products are available.
* Reserve inventory.
* Select warehouse.
* Reservation countdown starts.
* Confirm purchase successfully.
* Expired reservations are released automatically.
* Attempting to reserve unavailable stock returns HTTP 409.

---

# API Endpoints

| Method | Endpoint      | Description                  |
| ------ | ------------- | ---------------------------- |
| GET    | /api/products | Get products                 |
| POST   | /api/reserve  | Reserve inventory            |
| POST   | /api/confirm  | Confirm reservation          |
| POST   | /api/release  | Release expired reservations |

---

# Design Decisions

* Prisma transactions ensure atomic inventory updates.
* Reservation expiration prevents inventory from remaining locked.
* Redis improves temporary reservation handling.
* Supabase provides managed PostgreSQL.
* Vercel Cron automatically cleans expired reservations.

---

# Future Improvements

* User authentication
* Admin dashboard
* Inventory analytics
* Warehouse management
* Order history
* Email notifications
* WebSocket live inventory updates
* Rate limiting
* Unit and integration testing

---

# Author

**Sangappa Y K**

MCA 2026 •  Full Stack Developer

---

# License

This project is developed for the **Allo Engineering Take-Home Exercise** and is intended for evaluation purposes.

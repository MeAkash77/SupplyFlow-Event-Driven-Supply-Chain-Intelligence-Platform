# Vercel + Neon Demo Setup

This is the simplest public demo path if you only want the web app live on Vercel and the data model backed by Neon.

## 1. Rotate your Neon password

If you pasted a Neon connection string anywhere outside the dashboard, rotate the database password first.

## 2. Set local env vars

Root `.env` is used by the Python API:

```env
NEON_DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
```

`apps/web/.env` is used by Prisma:

```env
PRISMA_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
PRISMA_TENANT_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
```

For a simple demo, both Prisma URLs can point to the same Neon database.

## 3. Validate and generate Prisma clients

```bash
cd apps/web
npm run prisma:validate
npm run prisma:generate
```

## 4. Push tables to Neon

Registry tables:

```bash
cd apps/web
npm run prisma:push
```

Tenant workflow tables:

```bash
cd apps/web
npm run prisma:push:tenant
```

## 5. Build the web app

```bash
cd apps/web
npm run build
```

## 6. Deploy to Vercel

In Vercel, set at least:

- `PRISMA_DATABASE_URL`
- `PRISMA_TENANT_DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`

If you use Google auth later, also set:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Important

This repo is not fully switched from SQLAlchemy to Prisma.

What is done:

- Prisma schemas for registry and tenant workflow data
- Zod schemas that mirror those models
- Neon-compatible Prisma env setup

What still remains if you want a full migration:

- replace Python SQLAlchemy reads/writes with Prisma-backed API routes or another TS backend
- decide whether tenant workflow data stays in separate databases or one shared Neon database
- connect UI data flows to Prisma instead of seed/demo data

# Prisma + Zod data layer

This app keeps two schema files:

- `prisma/schema.prisma` for the shared registry database
- `prisma/tenant.schema.prisma` for per-tenant workflow data

Environment variables:

- `PRISMA_DATABASE_URL` for the shared registry database
- `PRISMA_TENANT_DATABASE_URL` for the tenant workflow database

For a simple demo on Neon, both can point at the same Postgres database.

Useful commands:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:push
npm run prisma:push:tenant
```

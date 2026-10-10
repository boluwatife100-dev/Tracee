This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Set `DATABASE_URL` in `.env.local` to a PostgreSQL connection string. Prisma
reads it via `prisma.config.ts`. For a local Postgres server, use:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tracee?schema=public
```

Then create tables:

```bash
npm run db:migrate
```

Configure Cloudinary for authenticated scan-photo uploads in `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

The API secret is used only by the server-side signing route. Do not prefix it
with `NEXT_PUBLIC_` or commit it.

Plant diagnosis uses Plant.id v3 for plant and health candidates, followed by
Gemini to produce a cautious explanation and structured care tasks. Configure
these server-only values in `.env.local`:

```env
PLANT_ID_API_KEY=your-plant-id-api-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-current-gemini-flash-model
```

Plant scan photos and care answers are saved with the scan. The diagnosis
pipeline stores its candidate scores and creates care tasks that appear in the
dashboard checklist. Keep all provider keys server-side and out of source
control.

Configure these variables in your deployment environment. Do not commit
connection strings or credentials.

## Database

This project uses [Prisma](https://www.prisma.io/) with PostgreSQL. The schema
lives in [`prisma/schema.prisma`](prisma/schema.prisma). The `User` model is
keyed by Clerk user ID and stores account profile fields, preferences, and
onboarding status. Passwords remain managed by Clerk and are not stored in the
database.

Useful scripts:

- `npm run db:generate` — regenerate Prisma Client
- `npm run db:migrate` — apply schema migrations
- `npm run db:studio` — open Prisma Studio

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

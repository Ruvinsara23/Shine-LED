# Shine-LED Analytics Dashboard

A premium Next.js SaaS application for processing, analyzing, and securely exporting `.plylog` bulk data streams.

## Features
- **Data Ingestion Container**: Smoothly upload massive 100+ batches of XML-based `.plylog` files.
- **Neo-Brutalist Aesthetic**: Striking high-contrast UI mimicking modern industry standards (Gumroad-style).
- **Hardened PostgreSQL**: Fully indexed `Supabase` integration capable of safely capturing unlimited streams.
- **Full Scope Export Engine**: Instantly export tens of thousands of processed records via `PapaParse` directly to formatted `.csv`.

## Tech Stack
- Next.js (App Router)
- Tailwind CSS v4 + Shadcn UI
- Supabase Client
- `fast-xml-parser`

## Setup
1. Clone the repository.
2. Run `npm install`.
3. Rename `.env.example` to `.env.local` and add your Supabase details.
4. Run `npm run dev -- -H 0.0.0.0` to start the server globally.

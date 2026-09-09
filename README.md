# EE Tools

IEC / metric electrical engineering calculators (three-phase amps ↔ kW, voltage drop, adiabatic short-circuit CSA, and related protection tools).

## Develop

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Add a calculator

Follow [AGENTS.md](AGENTS.md).

## Deploy

Push to GitHub and import the repo in [Vercel](https://vercel.com). Set `NEXT_PUBLIC_SITE_URL` to your production origin (for sitemap and Open Graph URLs).

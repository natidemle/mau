# MAU ISIMS student portal

A Next.js App Router starter for a Mekdela Amba University student-services dashboard. The backend uses Next.js route handlers and SQLite for local persistent student metrics and service requests.

## Run locally

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database is created and seeded on first API request at `data/mau-isims.sqlite`. Set `DATABASE_PATH` to use a different file.

## API routes

- `GET /api/dashboard` returns the dashboard profile and metrics, read from SQLite.
- `POST /api/service-actions` accepts `{"action":"meal-scan"}`, `{"action":"library-search"}`, `{"action":"clearance-details"}`, or `{"action":"id-card-request"}` and records the action in SQLite.
- `GET /api/service-requests` lists the demo student's ID card requests.
- `POST /api/service-requests` accepts `{"type":"id-card","reason":"My student card is damaged"}` and stores a request with `processing` status. The reason must be 10–500 characters.

The database is seeded with sample records and every route currently uses one fixed demo student. There is no authentication or authorization, and cafeteria scans, library searches, and clearance checks are not connected to real university systems. Do not use real student information or expose these write APIs publicly without adding verified authentication, authorization, and university-approved integrations.

## Deployment

### Publish on Render

The included `render.yaml` configures a Node.js web service with a persistent disk for SQLite. Render persistent disks require a paid web-service plan; the free plan cannot preserve this database.

1. Push this project to a GitHub repository.
2. In Render, choose **New → Blueprint**, connect the GitHub repository, and select the branch containing `render.yaml`.
3. Review the paid service and disk costs, then create the Blueprint. Render will build and publish the app and provide a public `onrender.com` URL.
4. Open that URL and confirm `/api/dashboard` responds.

The SQLite database is stored on the mounted disk, so redeploys preserve it. Do not change or remove the disk if you need to keep its data. GitHub Pages cannot run this backend. Vercel's default filesystem is not persistent for SQLite; use a managed database such as PostgreSQL there instead.

**Before making the site public:** the API currently has no authentication or authorization, and the dashboard displays a fixed sample student profile. Anyone who finds the site can read the sample data and submit demo ID-card requests. Do not publish real student information or connect university systems until authentication and access controls are implemented.

# animated-website

## Transfer dashboard

The Morocco Journeys transfer dashboard is available at `/dashboard/transfers`.
It manages airport routes and prices, private outings and visits, custom-route
locations, and transfer requests submitted through the public booking form.
The dashboard groups the three catalogues under top tabs. Use **Ajouter** to
choose which type of item to create. Custom-transfer locations can be assigned
to the departure list, arrival list, or both; airport routes and private
outings support notes, capacity, and configurable start times. Confirmed private
bookings reserve their activity, date, and time; reserved times remain visible
but unavailable in the booking form.
Outing photos are resized and compressed to WebP (100 KB maximum) in the browser,
then uploaded to Pinata through an admin-authenticated server endpoint. The
returned gateway URL is stored in PostgreSQL; image bytes are not.

Set up PostgreSQL and copy `.env.example` to `.env.local`. Set
`DATABASE_URL`, a unique `TRANSFER_DASHBOARD_SECRET` of at least 32 characters,
and Pinata credentials. Image upload uses `PINATA_JWT` (or `JWT`) and a gateway
configured as `NEXT_PUBLIC_GATEWAY_URL` (or `PINATA_GATEWAY_URL`). Keep JWT
values server-only and do not prefix them with `NEXT_PUBLIC_`. The first
dashboard sign-in creates the initial `ADMIN` user from
`TRANSFER_ADMIN_USERNAME` and `TRANSFER_ADMIN_PASSWORD`; the example values
(`admin` / `password`) are for local development only. Replace them with a
strong password before production deployment. Existing user accounts are not
overwritten by these bootstrap settings. `ADMIN` users can manage the catalogue;
`STAFF` users can review and update transfer requests.

```sh
npm run db:generate
npm run db:deploy
npm run dev
```

The initial airport routes, private services, and custom locations are seeded
automatically once the database is reachable. Without `DATABASE_URL`, the public
site displays the starter catalogue but disables online booking; the dashboard
shows a setup error after sign-in.

For an existing database, apply the user/role migration with
`npm run db:deploy`. For production, set `TRANSFER_ADMIN_USERNAME` and a strong
`TRANSFER_ADMIN_PASSWORD` (at least 8 characters) before the first dashboard
sign-in so the bootstrap admin is not created with local-development defaults.

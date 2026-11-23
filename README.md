# Ayoub Trader

Public service and coaching website with a protected operations dashboard. Legacy travel and activity routes permanently redirect to the home page.

## Services

- **Private rooms:** verified client accounts, Our Broker and Own Broker application options, manual proof/payment review, two-calendar-month memberships, explicit room assignments, private room posts, notifications, and an integrated VIP admin module.
- **Copy trading:** application intake with a $200 minimum balance and 50% profit-share ledger. No trading login, password, API key, recovery phrase, or authorization code is collected by the site or sent through WhatsApp.
- **Online coaching:** Starter (1,500 DH, 1 hour weekdays), Advanced (2,500 DH, 2 hours weekdays), and Premium (5,000 DH, 3 hours daily). All include online video sessions; in-person meetings are Premium-only.
- **Recurring reservations:** one chosen daily start time is held for all plan dates in a calendar month. Every session reserves 15-minute database slots in one transaction. Pending requests hold their schedule; database uniqueness prevents overlapping bookings even when requests arrive concurrently.
- **Payments:** recorded and verified manually. The site does not process payments or automatically activate any service.

## Setup

1. Copy `.env.example` to `.env.local` and configure PostgreSQL, the admin account, and 32-character-or-longer `TRANSFER_DASHBOARD_SECRET` and `VIP_CLIENT_SECRET` values. Keep the two secrets different.
2. Set `TRANSFER_ADMIN_USERNAME` and a strong `TRANSFER_ADMIN_PASSWORD` before the first sign-in. Existing dashboard users are not overwritten.
3. Configure `AYOUB_WHATSAPP_NUMBER`, `AYOUB_BROKER_REFERRAL_URL`, and `AYOUB_BROKER_AUTHORIZATION_URL`. The broker URLs must use HTTPS. Copy-trading activation is blocked until an authorization URL is configured; verify the broker's actual authorization flow before enabling the service.
4. Configure either `RESEND_API_KEY` plus `RESEND_FROM_EMAIL`, or SMTP settings, to deliver VIP client email-verification links. Also set `NEXT_PUBLIC_SITE_URL` and `SITE_URL` to the canonical HTTPS site origin.
5. Apply the schema and start the app:

```sh
npm run db:generate
npm run db:deploy
npm run dev
```

For a fresh database, use the migration commands above. If an existing database was synchronized with `prisma db push`, do not run `migrate deploy` until its migration history has been baselined; `db push` does not record applied migrations.

The admin portal is at `/dashboard`; sign-in remains at `/dashboard/loginP`. VIP clients use `/vip/login`; their application, membership, assigned rooms, profile, and notification pages share a fixed mobile bottom navigation. The existing admin dashboard includes the VIP management module under “VIP management”. Configure broker/payment details there before accepting applications.

## Security and operations

- Deposit screenshots are stored as private PostgreSQL binary data and are downloadable only by an authenticated administrator. Protect the database and its backups accordingly.
- VIP room attachments are stored as private PostgreSQL binary data and are downloaded only after the server confirms the client has a current membership and room assignment.
- Legacy VIP applications created before client accounts cannot be claimed using a phone number alone. Support must verify the customer before linking that application history to a new login.
- VIP membership expiration and seven-/three-day in-app reminders are processed when an authenticated client or admin accesses the VIP area. This repository does not include a hosting scheduler, so proactive timed reminders/email delivery and expiration outside normal traffic require a scheduled job configured by the deployment platform.
- The broker authorization URL is server-only and is not rendered to public pages. Ayoub must verify authorization through the broker before marking an application authorized. A static URL alone does not implement a provider-specific OAuth callback or prove consent; configure and verify the broker-supported flow before production use.
- Coaching dates and times use `Africa/Casablanca`. Admins can block a full date or 15-minute-aligned time range. A block cannot overlap an existing booking.
- Coaching subscriptions record their start/end dates, expected and remaining sessions, and expire when the dashboard processes the expiry check. Completing a session reduces the remaining count.
- `DATABASE_URL` is required for registration, applications, and dashboard management. Confirm Prisma migration history matches the target database before running `db:deploy`; do not replay initial migrations against an existing schema.
- Trading involves risk. The website makes no return guarantees and does not provide investment advice.# Ayoub-Trader

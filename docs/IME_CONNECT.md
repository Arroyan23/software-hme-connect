# IME Connect

IME Connect uses the existing Express session and PostgreSQL connection. No extra database service or client-side Supabase key is required. The page is at `/ime-connect`; all data endpoints are under `/api/connect` and require a valid member or admin session. A guest is redirected to `/member/login?next=...`, and login/registration returns to that Connect URL. The existing admin-only `/auth/me` and dashboard restrictions remain unchanged.

## Features

- Create, edit and delete your posts; view individual posts through shareable links.
- Like/unlike, save/unsave, comment/edit/delete, and share by copying a link.
- Following/followers/discovery, member search, other members' profiles, and suggestions.
- Own posts, private saved posts, editable name/username/bio/headline/company/badges, and profile photo upload/removal.
- Server-side category filters and full-text search; hashtag trending over the last 30 days.
- TENSI publishing is admin-only. Alumni publishing requires an alumni or admin account. Everyone signed in can read, like and comment. Admins may moderate by deleting posts/comments; editing is author-only.
- TENSI and Alumni in Connect contain community posts, separate from the public website's existing CMS content. Old mock social posts and counters are not imported as real users/activity.
- Actual counters replace the demo numbers. TENSI readers counts accounts that opened the channel; share count is unique accounts copying the link, not a count of external deliveries. Profile badges are member-provided text, not verified awards.

## Storage

`connect_profiles` connects one existing member or admin to one integer profile ID. Names stay in the original account table. `connect_posts` and `connect_comments` store text once. Likes, saves, shares and follows use composite primary keys and only integer references, with no duplicate names, emails, JSON arrays of users, synthetic IDs or timestamps per reaction. Deleting a post cascades its comments/reactions/saves/shares; deleting an account cascades its Connect data.

Posts are limited to 180 title characters and 10,000 body characters. Comments are limited to 2,000 characters. Lists use descending integer cursors, default 20 and maximum 30 results; relation counts are calculated only for the selected post page. Search uses an indexed `simple` PostgreSQL full-text document. Trending uses at most 10 normalized hashtags per post.

Photo uploads accept up to 2 MB, are decoded and converted to 256x256 WebP, and may occupy at most 64 KiB per account. One photo is stored on the profile; replacing/removing it does not accumulate media rows. This deliberately avoids putting full-size uploads into a 500 MB database. Actual capacity still depends on total account/post volume, indexes, the existing CMS media, and PostgreSQL overhead. There is no guarantee of unlimited usage within the free quota.

Publishing is limited to 60 combined posts/comments per account per hour. Two small profile fields enforce this atomically in PostgreSQL, including across Vercel instances. Failed inserts roll back quota changes. An additional in-process request limiter reduces bursts. PostgreSQL autovacuum reuses space from updates/deletes; deleting records does not necessarily shrink the allocated database immediately.

Useful storage audit (read-only):

```sql
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_catalog.pg_statio_user_tables
WHERE schemaname = 'hme'
ORDER BY pg_total_relation_size(relid) DESC;
```

## Security and deployment

Requests use HTTP-only session cookies; mutations also require the existing origin/CSRF validation. Account/author IDs come from the server session. API schemas validate lengths, types and category permissions; all user data is passed as SQL parameters. Email, NIM, password hashes, account foreign keys and quota fields are not included in public profile responses. Profile images are authenticated and `no-store`.

RLS is enabled on all seven Connect tables without browser-facing policies. Express must connect as the table-owning migration role (or a trusted server role that bypasses RLS), never the anonymous/authenticated Supabase Data API roles. See [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security). The application uses its own session auth, not Supabase Auth.

Migration entries `ime-connect-v1` and `ime-connect-publish-quota` run transactionally from `server/migrate.js` under the existing advisory lock. Existing accounts get a profile without changing passwords. New registration creates the profile in the account transaction. Run `npm run db:migrate`, or use the existing startup/Vercel handler which runs migrations automatically. Do not remove the migration entries to rerun them.

Vercel still needs the existing `DATABASE_URL`, `SESSION_SECRET`, `APP_ORIGINS` (exact HTTPS origin), and `COOKIE_SECURE=true` environment settings. Redeploy the changed code to enable it on the hosted website. No new secret is required for Connect. `ADMIN_INVITE_CODE` is only for admin registration.

## Verification

The integration suite creates and drops its own temporary database. Use a local PostgreSQL URL with `CREATEDB`; the suite refuses the application's remote database unless an explicit test URL is provided:

```sh
DATABASE_URL=postgresql://localhost/postgres DATABASE_SSL_REJECT_UNAUTHORIZED=true COOKIE_SECURE=false npm test
npm run lint
npm run build
```

`node tests/connect-preview.js` starts a disposable local UI test database, API on 3002, and Vite on 5175. It prints temporary test credentials; Ctrl-C stops the servers and deletes only that preview database. It never connects to Supabase. Keep these ports free before starting it.

Covered cases include guest blocking, member/admin isolation, ownership spoofing, concurrent duplicate likes, private saved lists, follows, search/filter/cursor pagination, cascade deletion, profile updates, avatar compression/replacement, logout/login persistence, RLS flags, and concurrent database publishing quotas. Browser checks cover guest redirects, login, post creation, likes/saves after reload, comments, follow lists, profile editing, saved posts, sharing, search and mobile layout.

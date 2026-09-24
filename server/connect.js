import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { pool, transaction } from './db.js';

export const connectRouter = Router();
const fail = (status, message) => Object.assign(new Error(message), { status });
const idSchema = z.coerce.number().int().positive().max(2147483647);
const categories = ['Beasiswa', 'Magang', 'Organisasi', 'Akademik', 'Info Kampus', 'TENSI', 'Alumni'];
const postSchema = z.object({ title: z.string().trim().min(1).max(180), body: z.string().trim().min(1).max(10000), category: z.enum(categories) });
const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) });
const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,32}$/, 'Username: 3-32 huruf, angka, atau underscore'),
  bio: z.string().trim().max(1000), headline: z.string().trim().max(160), company: z.string().trim().max(100),
  badges: z.array(z.string().trim().min(1).max(40)).max(5),
});
const pageSchema = z.object({ before: idSchema.optional(), limit: z.coerce.number().int().min(1).max(30).default(20) });
const publicProfileSelect = `p.id, p.username, p.bio, p.headline, p.company, p.badges,
  CASE WHEN p.avatar IS NULL THEN NULL ELSE '/api/connect/profiles/' || p.id || '/avatar?v=' || p.avatar_version END AS avatar,
  coalesce(a.name,m.name) AS name, CASE WHEN a.id IS NOT NULL THEN 'admin' ELSE m.status END AS status,
  m.angkatan, CASE WHEN a.id IS NOT NULL THEN 'admin' ELSE 'member' END AS role`;
const profileFrom = 'hme.connect_profiles p LEFT JOIN hme.admins a ON a.id=p.admin_id LEFT JOIN hme.members m ON m.id=p.member_id';

// The session is the only source of account identity; request bodies never select an author.
connectRouter.use(async (req, res, next) => {
  const isAdmin = req.session.role === 'admin';
  const accountId = isAdmin ? req.session.adminId : req.session.role === 'member' ? req.session.memberId : null;
  if (!accountId) throw fail(401, 'Silakan login untuk membuka IME Connect');
  const table = isAdmin ? 'admins' : 'members';
  const column = isAdmin ? 'admin_id' : 'member_id';
  const account = (await pool.query(`SELECT u.id,p.id AS profile_id FROM hme.${table} u LEFT JOIN hme.connect_profiles p ON p.${column}=u.id WHERE u.id=$1`, [accountId])).rows[0];
  if (!account) throw fail(401, 'Sesi tidak valid');
  let profile = account.profile_id ? { id: account.profile_id } : null;
  if (!profile) {
    await pool.query(`INSERT INTO hme.connect_profiles(${column},username) VALUES($1,$2) ON CONFLICT (${column}) DO NOTHING`, [accountId, `${isAdmin ? 'admin' : 'member'}_${accountId}`]);
    profile = (await pool.query(`SELECT id FROM hme.connect_profiles WHERE ${column}=$1`, [accountId])).rows[0];
  }
  req.connect = { id: profile.id, accountId, isAdmin };
  next();
});
const mutationLimit = rateLimit({ windowMs: 60 * 1000, limit: 90, keyGenerator: req => String(req.connect.id), standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Terlalu banyak aktivitas. Coba lagi sebentar.' } });
const publishLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, keyGenerator: req => String(req.connect.id), standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Batas kiriman per jam tercapai. Coba lagi nanti.' } });
connectRouter.use((req, res, next) => ['GET','HEAD'].includes(req.method) ? next() : mutationLimit(req, res, next));

async function getProfile(id, viewer, client = pool) {
  const profile = (await client.query(`SELECT ${publicProfileSelect},
    (SELECT count(*)::int FROM hme.connect_follows WHERE follower_id=p.id) AS following_count,
    (SELECT count(*)::int FROM hme.connect_follows WHERE followed_id=p.id) AS followers_count,
    (SELECT count(*)::int FROM hme.connect_posts WHERE author_id=p.id) AS posts_count,
    EXISTS(SELECT 1 FROM hme.connect_follows WHERE follower_id=$2 AND followed_id=p.id) AS following
    FROM ${profileFrom} WHERE p.id=$1`, [id, viewer])).rows[0];
  if (!profile) throw fail(404, 'Profil tidak ditemukan');
  return profile;
}
connectRouter.get('/me', async (req, res) => res.json(await getProfile(req.connect.id, req.connect.id)));
connectRouter.put('/me', async (req, res) => {
  const data = profileSchema.parse(req.body);
  const current = await getProfile(req.connect.id, req.connect.id);
  if (/^(admin|member)_\d+$/.test(data.username) && data.username !== current.username) throw fail(400, 'Username tersebut dicadangkan');
  try {
    await transaction(async client => {
      await client.query(`UPDATE hme.connect_profiles SET username=$1,bio=$2,headline=$3,company=$4,badges=$5 WHERE id=$6`, [data.username, data.bio, data.headline, data.company, [...new Set(data.badges)], req.connect.id]);
      await client.query(`UPDATE hme.${req.connect.isAdmin ? 'admins' : 'members'} SET name=$1 WHERE id=$2`, [data.name, req.connect.accountId]);
    });
  } catch (error) { if (error.code === '23505') throw fail(409, 'Username sudah digunakan'); throw error; }
  res.json(await getProfile(req.connect.id, req.connect.id));
});
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } });
connectRouter.put('/me/avatar', avatarUpload.single('file'), async (req, res) => {
  if (!req.file) throw fail(400, 'Pilih foto profil');
  let bytes;
  try {
    const image = sharp(req.file.buffer, { limitInputPixels: 16000000 });
    if (!['jpeg','png','webp'].includes((await image.metadata()).format)) throw new Error('Unsupported photo format');
    bytes = await image.rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 72 }).toBuffer();
  } catch { throw fail(400, 'Gunakan foto JPEG, PNG, atau WebP yang valid'); }
  if (bytes.length > 65536) throw fail(400, 'Foto terlalu kompleks. Pilih foto lain');
  await pool.query('UPDATE hme.connect_profiles SET avatar=$1,avatar_version=avatar_version+1 WHERE id=$2', [bytes, req.connect.id]);
  res.json(await getProfile(req.connect.id, req.connect.id));
});
connectRouter.delete('/me/avatar', async (req, res) => {
  await pool.query('UPDATE hme.connect_profiles SET avatar=NULL,avatar_version=avatar_version+1 WHERE id=$1', [req.connect.id]);
  res.json(await getProfile(req.connect.id, req.connect.id));
});
connectRouter.get('/profiles/:id/avatar', async (req, res) => {
  const row = (await pool.query('SELECT avatar FROM hme.connect_profiles WHERE id=$1', [idSchema.parse(req.params.id)])).rows[0];
  if (!row?.avatar) throw fail(404, 'Foto tidak ditemukan');
  res.type('image/webp').send(row.avatar);
});
connectRouter.get('/profiles/:id', async (req, res) => res.json(await getProfile(idSchema.parse(req.params.id), req.connect.id)));
connectRouter.get('/profiles', async (req, res) => {
  const q = pageSchema.extend({ q: z.string().trim().max(120).default(''), tab: z.enum(['discover','following','followers']).default('discover'), owner: idSchema.optional() }).parse(req.query);
  const owner = q.owner || req.connect.id;
  const clauses = [q.tab === 'discover' ? 'p.id<>$1' : 'true'];
  const values = [req.connect.id];
  const param = value => { values.push(value); return `$${values.length}`; };
  if (q.before) clauses.push(`p.id<${param(q.before)}`);
  if (q.q) { const search = param(`%${q.q.replace(/[\\%_]/g, '\\$&')}%`); clauses.push(`(coalesce(a.name,m.name) ILIKE ${search} OR p.username ILIKE ${search} OR p.company ILIKE ${search})`); }
  if (q.tab === 'following') clauses.push(`EXISTS(SELECT 1 FROM hme.connect_follows WHERE follower_id=${param(owner)} AND followed_id=p.id)`);
  if (q.tab === 'followers') clauses.push(`EXISTS(SELECT 1 FROM hme.connect_follows WHERE followed_id=${param(owner)} AND follower_id=p.id)`);
  const result = await pool.query(`SELECT ${publicProfileSelect},
    EXISTS(SELECT 1 FROM hme.connect_follows WHERE follower_id=$1 AND followed_id=p.id) AS following,
    (SELECT count(*)::int FROM hme.connect_follows f JOIN hme.connect_follows g ON f.followed_id=g.followed_id WHERE f.follower_id=$1 AND g.follower_id=p.id) AS mutual
    FROM ${profileFrom} WHERE ${clauses.join(' AND ')} ORDER BY p.id DESC LIMIT ${param(q.limit + 1)}`, values);
  res.json(paginate(result.rows, q.limit));
});
for (const method of ['put', 'delete']) connectRouter[method]('/profiles/:id/follow', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  if (id === req.connect.id) throw fail(400, 'Tidak bisa mengikuti diri sendiri');
  await getProfile(id, req.connect.id);
  if (method === 'put') await pool.query('INSERT INTO hme.connect_follows(follower_id,followed_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.connect.id,id]);
  else await pool.query('DELETE FROM hme.connect_follows WHERE follower_id=$1 AND followed_id=$2', [req.connect.id,id]);
  res.json(await getProfile(id, req.connect.id));
});

function paginate(rows, limit) { return { items: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null }; }
async function publish(profileId, insert) {
  return transaction(async client => {
    // One bounded counter per account works across serverless instances. Failed inserts roll it back.
    const quota = await client.query(`UPDATE hme.connect_profiles SET
      publish_count=CASE WHEN publish_window<=now()-interval '1 hour' THEN 1 ELSE publish_count+1 END,
      publish_window=CASE WHEN publish_window<=now()-interval '1 hour' THEN now() ELSE publish_window END
      WHERE id=$1 AND (publish_count<60 OR publish_window<=now()-interval '1 hour') RETURNING id`, [profileId]);
    if (!quota.rowCount) throw fail(429, 'Batas 60 postingan dan komentar per jam tercapai. Coba lagi nanti.');
    return insert(client);
  });
}
function tagsFor(data) { return [...new Set((`${data.title} ${data.body}`.match(/#[\p{L}\p{N}_]{1,40}/gu) || []).map(tag => tag.slice(1).toLowerCase()))].slice(0, 10); }
async function canPublish(data, req) {
  if (data.category === 'TENSI' && !req.connect.isAdmin) throw fail(403, 'Hanya admin yang dapat menerbitkan TENSI');
  if (data.category === 'Alumni' && !req.connect.isAdmin && (await getProfile(req.connect.id, req.connect.id)).status !== 'alumni') throw fail(403, 'Kanal Alumni khusus kiriman alumni');
}
async function postsWhere(clauses, values, limit = 1) {
  // Limit first, then count relations only for the visible page.
  return (await pool.query(`WITH page AS (SELECT post.* FROM hme.connect_posts post WHERE ${clauses.join(' AND ')} ORDER BY post.id DESC LIMIT ${limit})
    SELECT post.id,post.title,post.body,post.category,post.created_at,post.updated_at,post.author_id,
      coalesce(a.name,m.name) AS author,p.username,p.headline,m.angkatan,
      CASE WHEN a.id IS NOT NULL THEN 'admin' ELSE m.status END AS status,
      CASE WHEN p.avatar IS NULL THEN NULL ELSE '/api/connect/profiles/'||p.id||'/avatar?v='||p.avatar_version END AS avatar,
      (SELECT count(*)::int FROM hme.connect_likes WHERE post_id=post.id) AS likes,
      (SELECT count(*)::int FROM hme.connect_comments WHERE post_id=post.id) AS comments,
      (SELECT count(*)::int FROM hme.connect_shares WHERE post_id=post.id) AS shares,
      EXISTS(SELECT 1 FROM hme.connect_likes WHERE post_id=post.id AND profile_id=$1) AS liked,
      EXISTS(SELECT 1 FROM hme.connect_saves WHERE post_id=post.id AND profile_id=$1) AS saved,
      (post.author_id=$1) AS owned
    FROM page post JOIN hme.connect_profiles p ON p.id=post.author_id
    LEFT JOIN hme.admins a ON a.id=p.admin_id LEFT JOIN hme.members m ON m.id=p.member_id ORDER BY post.id DESC`, values)).rows;
}
async function getPost(id, viewer) {
  const post = (await postsWhere(['post.id=$2'], [viewer,id]))[0];
  if (!post) throw fail(404, 'Postingan tidak ditemukan');
  return post;
}
connectRouter.get('/posts', async (req, res) => {
  const q = pageSchema.extend({ category: z.enum(categories).optional(), q: z.string().trim().max(120).default(''), tag: z.string().max(40).optional(), author: idSchema.optional(), saved: z.enum(['true']).optional() }).parse(req.query);
  const values = [req.connect.id], clauses = ['true'];
  const param = value => { values.push(value); return `$${values.length}`; };
  if (q.before) clauses.push(`post.id<${param(q.before)}`);
  if (q.category) clauses.push(`post.category=${param(q.category)}`);
  if (q.author) clauses.push(`post.author_id=${param(q.author)}`);
  if (q.saved) clauses.push('EXISTS(SELECT 1 FROM hme.connect_saves WHERE post_id=post.id AND profile_id=$1)');
  if (q.tag) clauses.push(`${param(q.tag.toLowerCase())}=ANY(post.tags)`);
  if (q.q) clauses.push(`post.search_vector @@ websearch_to_tsquery('simple',${param(q.q)})`);
  const posts = await postsWhere(clauses, values, q.limit + 1);
  if (q.category === 'TENSI') await pool.query("UPDATE hme.connect_profiles SET tensi_seen_at=now() WHERE id=$1 AND (tensi_seen_at IS NULL OR tensi_seen_at<now()-interval '1 day')", [req.connect.id]);
  res.json(paginate(posts, q.limit));
});
connectRouter.get('/posts/:id', async (req, res) => res.json(await getPost(idSchema.parse(req.params.id), req.connect.id)));
connectRouter.post('/posts', publishLimit, async (req, res) => {
  const data = postSchema.parse(req.body); await canPublish(data, req);
  const row = await publish(req.connect.id, async client => (await client.query('INSERT INTO hme.connect_posts(author_id,category,title,body,tags) VALUES($1,$2,$3,$4,$5) RETURNING id', [req.connect.id,data.category,data.title,data.body,tagsFor(data)])).rows[0]);
  res.status(201).json(await getPost(row.id, req.connect.id));
});
connectRouter.put('/posts/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id), data = postSchema.parse(req.body); await canPublish(data, req);
  const result = await pool.query('UPDATE hme.connect_posts SET category=$1,title=$2,body=$3,tags=$4,updated_at=now() WHERE id=$5 AND author_id=$6', [data.category,data.title,data.body,tagsFor(data),id,req.connect.id]);
  if (!result.rowCount) throw fail(404, 'Postingan milikmu tidak ditemukan');
  res.json(await getPost(id, req.connect.id));
});
connectRouter.delete('/posts/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM hme.connect_posts WHERE id=$1 AND (author_id=$2 OR $3)', [idSchema.parse(req.params.id),req.connect.id,req.connect.isAdmin]);
  if (!result.rowCount) throw fail(404, 'Postingan tidak ditemukan atau tidak dapat dihapus');
  res.json({ ok: true });
});
for (const [action, table] of Object.entries({ like: 'connect_likes', save: 'connect_saves', share: 'connect_shares' })) {
  for (const method of action === 'share' ? ['put'] : ['put','delete']) connectRouter[method](`/posts/:id/${action}`, async (req,res) => {
    const id = idSchema.parse(req.params.id);
    if (method === 'put') await pool.query(`INSERT INTO hme.${table}(post_id,profile_id) SELECT id,$2 FROM hme.connect_posts WHERE id=$1 ON CONFLICT DO NOTHING`, [id,req.connect.id]);
    else await pool.query(`DELETE FROM hme.${table} WHERE post_id=$1 AND profile_id=$2`, [id,req.connect.id]);
    res.json(await getPost(id, req.connect.id));
  });
}
connectRouter.get('/posts/:id/comments', async (req, res) => {
  const id = idSchema.parse(req.params.id), q = pageSchema.parse(req.query);
  await getPost(id, req.connect.id);
  const rows = (await pool.query(`SELECT c.id,c.body,c.created_at,c.updated_at,c.author_id,coalesce(a.name,m.name) AS author,p.username,
    CASE WHEN p.avatar IS NULL THEN NULL ELSE '/api/connect/profiles/'||p.id||'/avatar?v='||p.avatar_version END AS avatar,
    (c.author_id=$2) AS owned FROM hme.connect_comments c JOIN hme.connect_profiles p ON p.id=c.author_id
    LEFT JOIN hme.admins a ON a.id=p.admin_id LEFT JOIN hme.members m ON m.id=p.member_id
    WHERE c.post_id=$1 AND ($3::int IS NULL OR c.id<$3) ORDER BY c.id DESC LIMIT $4`, [id,req.connect.id,q.before || null,q.limit + 1])).rows;
  res.json(paginate(rows, q.limit));
});
connectRouter.post('/posts/:id/comments', publishLimit, async (req,res) => {
  const id = idSchema.parse(req.params.id), data = commentSchema.parse(req.body);
  await getPost(id, req.connect.id);
  const row = await publish(req.connect.id, async client => (await client.query('INSERT INTO hme.connect_comments(post_id,author_id,body) VALUES($1,$2,$3) RETURNING id', [id,req.connect.id,data.body])).rows[0]);
  res.status(201).json(row);
});
connectRouter.put('/comments/:id', async (req, res) => {
  const data = commentSchema.parse(req.body);
  const row = (await pool.query('UPDATE hme.connect_comments SET body=$1,updated_at=now() WHERE id=$2 AND author_id=$3 RETURNING id,body', [data.body,idSchema.parse(req.params.id),req.connect.id])).rows[0];
  if (!row) throw fail(404, 'Komentar milikmu tidak ditemukan');
  res.json(row);
});
connectRouter.delete('/comments/:id', async (req,res) => {
  const result = await pool.query('DELETE FROM hme.connect_comments WHERE id=$1 AND (author_id=$2 OR $3)', [idSchema.parse(req.params.id),req.connect.id,req.connect.isAdmin]);
  if (!result.rowCount) throw fail(404, 'Komentar tidak ditemukan atau tidak dapat dihapus');
  res.json({ ok:true });
});
connectRouter.get('/summary', async (req, res) => {
  const trending = (await pool.query(`SELECT tag,count(*)::int AS count FROM hme.connect_posts CROSS JOIN LATERAL unnest(tags) tag
    WHERE created_at>now()-interval '30 days' GROUP BY tag ORDER BY count(*) DESC,tag LIMIT 5`)).rows;
  const stats = (await pool.query(`SELECT
    (SELECT count(*)::int FROM hme.connect_posts WHERE category='TENSI') AS editions,
    (SELECT max(created_at) FROM hme.connect_posts WHERE category='TENSI') AS latest,
    (SELECT count(*)::int FROM hme.connect_profiles WHERE tensi_seen_at IS NOT NULL) AS readers,
    (SELECT count(*)::int FROM hme.connect_profiles p JOIN hme.members m ON p.member_id=m.id WHERE m.status='alumni') AS alumni,
    (SELECT count(DISTINCT lower(p.company))::int FROM hme.connect_profiles p JOIN hme.members m ON p.member_id=m.id WHERE m.status='alumni' AND p.company<>'') AS companies,
    (SELECT count(DISTINCT m.angkatan)::int FROM hme.connect_profiles p JOIN hme.members m ON p.member_id=m.id WHERE m.status='alumni') AS cohorts`)).rows[0];
  const suggestions = (await pool.query(`SELECT ${publicProfileSelect},false AS following FROM ${profileFrom}
    WHERE p.id<>$1 AND NOT EXISTS(SELECT 1 FROM hme.connect_follows WHERE follower_id=$1 AND followed_id=p.id) ORDER BY p.id DESC LIMIT 3`, [req.connect.id])).rows;
  res.json({ trending, stats, suggestions });
});
connectRouter.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ message:'Foto profil maksimal 2 MB dan satu gambar.' });
  if (error.code === '23503') return res.status(404).json({ message:'Postingan atau akun sudah tidak tersedia.' });
  next(error);
});

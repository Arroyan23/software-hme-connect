import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { Bookmark, Folder, GraduationCap, Heart, House, MessageCircle, Newspaper, Search, Share2, UserRound, UsersRound, Zap, LogOut, X, Pencil, Trash2, Send, Copy } from 'lucide-react';
import { api } from '../lib/api';
import { ConnectContext, useConnect, useConnectQuery, initials, roleLabel, timeAgo } from '../lib/connect-client';

const categories = ['Beasiswa', 'Magang', 'Organisasi', 'Akademik', 'Info Kampus'];
const navItems = [['beranda', 'Beranda', House], ['tensi', 'TENSI', Newspaper], ['alumni', 'Alumni', GraduationCap], ['network', 'Network', UsersRound], ['profil', 'Profil', UserRound]];
const categoryStyle = { Beasiswa: 'bg-emerald-50 text-emerald-700', Magang: 'bg-blue-50 text-blue-700', Organisasi: 'bg-fuchsia-50 text-fuchsia-700', Akademik: 'bg-red-50 text-red-700', 'Info Kampus': 'bg-amber-50 text-amber-700', TENSI: 'bg-[#fbf5ea] text-[#b77b21]', Alumni: 'bg-blue-50 text-[#476da5]' };
const field = 'mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c99235]/40';
const primary = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#c99235] px-5 py-2 text-sm font-bold text-white disabled:opacity-50';

function Avatar({ name, src, goldAvatar = false, large = false }) {
  return <div className={`${large ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'} grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ${goldAvatar ? 'bg-[#d5a344]' : 'bg-[#474747]'}`}>{src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}</div>;
}
function ErrorMessage({ error }) { return error ? <p role="alert" className="my-3 text-sm text-red-700">{error.message || error}</p> : null; }
function QueryState({ query, empty = 'Belum ada postingan.' }) {
  if (query.error) return <div className="py-6"><ErrorMessage error={query.error} /><button className={primary} onClick={query.reload}>Coba lagi</button></div>;
  if (!query.data && query.loading) return <p role="status" className="py-8 text-center text-sm text-stone-500">Memuat...</p>;
  if (query.data?.items?.length === 0) return <p className="rounded-[16px] border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">{empty}</p>;
  return null;
}
function LoadMore({ query }) {
  return <><ErrorMessage error={query.moreError} />{query.data?.nextCursor && <button disabled={query.moreBusy} onClick={query.more} className="mx-auto my-5 block rounded-full border border-stone-200 bg-white px-5 py-2 text-sm disabled:opacity-50">{query.moreBusy ? 'Memuat...' : 'Muat lebih banyak'}</button>}</>;
}
function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} onCancel={onClose} aria-label={title} data-lenis-prevent className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 text-stone-800 shadow-xl backdrop:bg-black/50">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-bold tracking-tight">{title}</h2><button onClick={onClose} aria-label="Tutup dialog" title="Tutup" className="rounded-full p-2 hover:bg-stone-100"><X size={20} /></button></div>{children}
  </dialog>;
}
function ConfirmDelete({ title, path, onClose, onDone }) {
  const { request } = useConnect();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function remove() {
    setBusy(true); setError('');
    try { await request(path, { method: 'DELETE' }); onDone(); onClose(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <Modal title={title} onClose={onClose}><p className="text-sm text-stone-600">Kiriman yang dihapus tidak dapat dikembalikan.</p><ErrorMessage error={error} /><div className="mt-6 flex justify-end gap-4"><button onClick={onClose}>Batal</button><button disabled={busy} onClick={remove} className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Menghapus...' : 'Hapus'}</button></div></Modal>;
}
function PostEditor({ post, category, onClose, onDone }) {
  const { me, request } = useConnect();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const allowed = [...categories, ...(me.role === 'admin' ? ['TENSI'] : []), ...(me.role === 'admin' || me.status === 'alumni' ? ['Alumni'] : [])];
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try { await request(post ? `/posts/${post.id}` : '/posts', { method: post ? 'PUT' : 'POST', body }); onDone(); onClose(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <Modal title={post ? 'Edit Postingan' : 'Bagikan Informasi'} onClose={onClose}><form onSubmit={submit} className="space-y-4">
    <label className="block text-sm">Kategori<select name="category" className={field} defaultValue={post?.category || category || 'Info Kampus'}>{allowed.map(item => <option key={item}>{item}</option>)}</select></label>
    <label className="block text-sm">Judul<input className={field} name="title" defaultValue={post?.title} required maxLength={180} /></label>
    <label className="block text-sm">Isi postingan<textarea className={field} name="body" rows={7} defaultValue={post?.body} required maxLength={10000} /></label>
    <ErrorMessage error={error} /><button disabled={busy} className={primary}><Send size={16} />{busy ? 'Menyimpan...' : post ? 'Simpan perubahan' : 'Terbitkan'}</button>
  </form></Modal>;
}
function ProfileEditor({ profile, onClose, onDone }) {
  const { request, setMe } = useConnect();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [photo, setPhoto] = useState(profile.avatar);
  async function removePhoto() {
    setBusy(true); setError('');
    try { const result = await request('/me/avatar', { method: 'DELETE' }); setPhoto(null); setMe(result); onDone(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget), file = form.get('photo');
    const body = Object.fromEntries(['name', 'username', 'headline', 'company', 'bio'].map(key => [key, form.get(key)]));
    body.badges = String(form.get('badges')).split(',').map(item => item.trim()).filter(Boolean);
    try {
      if (file?.size > 2 * 1024 * 1024) throw new Error('Foto profil maksimal 2 MB');
      let result = await request('/me', { method: 'PUT', body });
      setMe(result);
      if (file?.size) { const upload = new FormData(); upload.append('file', file); result = await request('/me/avatar', { method: 'PUT', body: upload }); setMe(result); }
      onDone(); onClose();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <Modal title="Edit Profil" onClose={onClose}><form onSubmit={submit} className="space-y-4">
    <div className="flex items-center gap-4"><Avatar name={profile.name} src={photo} large goldAvatar />{photo && <button type="button" disabled={busy} className="text-sm text-red-700" onClick={removePhoto}>Hapus foto</button>}</div>
    <label className="block text-sm">Foto profil<input className={field} type="file" name="photo" accept="image/jpeg,image/png,image/webp" /><span className="text-xs text-stone-500">JPEG, PNG, WebP. Maksimal 2 MB.</span></label>
    <label className="block text-sm">Nama lengkap<input className={field} name="name" defaultValue={profile.name} required minLength={2} maxLength={100} /></label>
    <label className="block text-sm">Username<input className={field} name="username" defaultValue={profile.username} required pattern="[a-z0-9_]{3,32}" maxLength={32} /></label>
    <label className="block text-sm">Jabatan / aktivitas<input className={field} name="headline" defaultValue={profile.headline} maxLength={160} /></label>
    <label className="block text-sm">Perusahaan / organisasi<input className={field} name="company" defaultValue={profile.company} maxLength={100} /></label>
    <label className="block text-sm">Bio<textarea className={field} name="bio" defaultValue={profile.bio} rows={4} maxLength={1000} /></label>
    <label className="block text-sm">Pencapaian (pisahkan dengan koma, maksimal 5)<input className={field} name="badges" defaultValue={profile.badges.join(', ')} maxLength={204} /></label>
    <ErrorMessage error={error} /><button disabled={busy} className={primary}>{busy ? 'Menyimpan...' : 'Simpan profil'}</button>
  </form></Modal>;
}
function FollowButton({ person, onDone, compact = false }) {
  const { request, me, notify } = useConnect();
  const [busy, setBusy] = useState(false);
  if (person.id === me.id) return null;
  async function follow() {
    setBusy(true);
    try { const updated = await request(`/profiles/${person.id}/follow`, { method: person.following ? 'DELETE' : 'PUT' }); onDone(updated); }
    catch (e) { notify(e.message); } finally { setBusy(false); }
  }
  return <button disabled={busy} onClick={follow} aria-label={`${person.following ? 'Unfollow' : 'Follow'} ${person.name}`} aria-pressed={person.following} className={`shrink-0 rounded-full font-bold disabled:opacity-50 ${compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm'} ${person.following ? 'bg-[#f0efeb] text-stone-500' : 'bg-[#c99235] text-white'}`}>{person.following ? 'Following' : 'Follow'}</button>;
}
function Sidebar({ active }) {
  const { me, request, notify } = useConnect();
  const navigate = useNavigate();
  async function logout() { try { await request('/auth/logout', { method: 'POST' }, true); navigate('/member/login', { replace: true }); } catch (e) { notify(e.message); } }
  return <aside className="bg-[#1d1d1b] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[236px] lg:shrink-0"><div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-7">
    <Link to="/ime-connect" className="flex items-center gap-3 px-1"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#cb9638]"><Zap size={20} fill="currentColor" /></span><span><b className="block text-[20px] font-extrabold leading-5 tracking-tight">IME Connect</b><small className="text-xs font-normal text-white/40">Himpunan Elektro</small></span></Link>
    <nav aria-label="IME Connect" className="mt-8 flex gap-1 overflow-x-auto pb-1 lg:mt-12 lg:block lg:space-y-2 lg:overflow-visible">{navItems.map(([key, label, Icon]) => <Link key={key} to={key === 'beranda' ? '/ime-connect' : `/ime-connect/${key}`} aria-current={active === key ? 'page' : undefined} className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${active === key ? 'bg-[#382f1c] text-[#d5a344]' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}>{key === 'tensi' && active !== key ? <Folder size={21} /> : <Icon size={21} />}<span>{label}</span>{key === 'tensi' && <em className="ml-auto rounded-full bg-[#d5a344] px-2 py-0.5 text-[11px] not-italic text-white">Baru</em>}</Link>)}</nav>
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-3 lg:mt-auto"><Link to="/ime-connect/profil" className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={me.name} src={me.avatar} goldAvatar /><span className="min-w-0"><b className="block truncate text-sm">{me.name}</b><small className="block truncate text-xs text-white/35">@{me.username}</small></span></Link><button onClick={logout} title="Keluar" aria-label="Keluar" className="shrink-0 p-1 text-white/60 hover:text-white"><LogOut size={17} /></button></div>
  </div></aside>;
}
function SearchBox() {
  const [params, setParams] = useSearchParams();
  return <form onSubmit={event => { event.preventDefault(); const q = new FormData(event.currentTarget).get('q').trim(); setParams(previous => { const next = new URLSearchParams(previous); next.delete('tag'); q ? next.set('q', q) : next.delete('q'); return next; }); }} className="relative block">
    <button type="submit" aria-label="Cari" title="Cari" className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-stone-400"><Search size={19} /></button><input key={params.get('q') || ''} aria-label="Cari informasi" name="q" type="search" defaultValue={params.get('q') || ''} maxLength={120} placeholder="Cari informasi..." className="h-14 w-full rounded-2xl border-0 bg-[#efeee9] pl-12 pr-5 text-sm outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-[#d5a344]/40" />
  </form>;
}
function RightRail({ summary }) {
  const { refresh } = useConnect();
  return <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start"><SearchBox />
    <section className="rounded-[20px] border border-stone-200 bg-white p-5"><h2 className="text-xl font-bold tracking-tight">Trending di Elektro</h2><QueryState query={summary} /><div className="mt-5 space-y-4">{summary.data?.trending.map(({ tag, count }, index) => <Link to={`/ime-connect?tag=${encodeURIComponent(tag)}`} className="block" key={tag}><p className="text-sm text-stone-500">#{index + 1} Elektro</p><b className="block break-words text-[16px] leading-5">#{tag}</b><p className="text-sm text-stone-500">{count} postingan</p></Link>)}{summary.data?.trending.length === 0 && <p className="text-sm text-stone-500">Belum ada topik trending.</p>}</div></section>
    <section className="rounded-[20px] border border-stone-200 bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="text-xl font-bold tracking-tight">Mungkin Kamu Kenal</h2><Link to="/ime-connect/network" className="shrink-0 text-xs font-bold text-[#bf8730]">Lihat semua</Link></div><div className="mt-4 space-y-3">{summary.data?.suggestions.map(person => <div className="flex items-center gap-2" key={person.id}><Link to={`/ime-connect/profil/${person.id}`}><Avatar name={person.name} src={person.avatar} goldAvatar={person.status !== 'mahasiswa'} /></Link><Link to={`/ime-connect/profil/${person.id}`} className="min-w-0 flex-1"><b className="block truncate text-sm">{person.name}</b><p className="truncate text-xs text-stone-500">{roleLabel(person)}</p></Link><FollowButton person={person} onDone={refresh} compact /></div>)}{summary.data?.suggestions.length === 0 && <p className="text-sm text-stone-500">Belum ada saran koneksi baru.</p>}</div></section>
    <p className="text-center text-xs text-stone-500">© {new Date().getFullYear()} IME Connect · Himpunan Elektro</p>
  </aside>;
}
function Comments({ post, onClose, onChange }) {
  const { request, me } = useConnect();
  const query = useConnectQuery(`/posts/${post.id}/comments`);
  const [editing, setEditing] = useState(null), [deleting, setDeleting] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function changed() { query.reload(); onChange(await request(`/posts/${post.id}`)); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = event.currentTarget, body = Object.fromEntries(new FormData(form));
    try { await request(editing ? `/comments/${editing.id}` : `/posts/${post.id}/comments`, { method: editing ? 'PUT' : 'POST', body }); form.reset(); setEditing(null); await changed(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <Modal title="Komentar" onClose={onClose}><p className="mb-4 text-xl font-bold tracking-tight">{post.title}</p><form key={editing?.id || 'new'} onSubmit={submit} className="space-y-3"><label className="block text-sm">{editing ? 'Edit komentar' : 'Tulis komentar'}<textarea name="body" defaultValue={editing?.body} required maxLength={2000} rows={3} className={field} /></label><div className="flex gap-3"><button disabled={busy} className={primary}><Send size={15} />{busy ? 'Menyimpan...' : editing ? 'Simpan komentar' : 'Kirim komentar'}</button>{editing && <button type="button" onClick={() => setEditing(null)}>Batal</button>}</div><ErrorMessage error={error} /></form>
    <div className="mt-6 space-y-5"><QueryState query={query} empty="Belum ada komentar." />{query.data?.items.map(comment => <article key={comment.id} className="border-t border-stone-200 pt-4"><div className="flex items-start gap-3"><Avatar name={comment.author} src={comment.avatar} /><div className="min-w-0 flex-1"><Link onClick={onClose} to={`/ime-connect/profil/${comment.author_id}`} className="text-sm font-bold">{comment.author}</Link><p className="text-xs text-stone-500">{timeAgo(comment.created_at)}</p></div>{comment.owned && <button title="Edit komentar" aria-label="Edit komentar" onClick={() => setEditing(comment)}><Pencil size={16} /></button>}{(comment.owned || me.role === 'admin') && <button title="Hapus komentar" aria-label="Hapus komentar" onClick={() => setDeleting(comment)}><Trash2 size={16} /></button>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p></article>)}</div><LoadMore query={query} />
    {deleting && <ConfirmDelete title="Hapus komentar?" path={`/comments/${deleting.id}`} onClose={() => setDeleting(null)} onDone={() => { changed().catch(e => setError(e.message)); }} />}
  </Modal>;
}
function ShareDialog({ post, onClose, onChange }) {
  const { request } = useConnect();
  const [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const url = `${window.location.origin}/ime-connect/post/${post.id}`;
  async function copy() {
    setBusy(true);
    try { await navigator.clipboard.writeText(url); onChange(await request(`/posts/${post.id}/share`, { method: 'PUT' })); setStatus('Tautan berhasil disalin.'); }
    catch { setStatus('Belum berhasil menyalin tautan. Coba lagi atau salin tautan di atas.'); } finally { setBusy(false); }
  }
  return <Modal title="Bagikan Postingan" onClose={onClose}><label className="text-sm">Tautan postingan<input readOnly value={url} onFocus={e => e.target.select()} className={field} /></label><button className={`${primary} mt-4`} disabled={busy} onClick={copy}><Copy size={16} />Salin tautan</button><p role="status" className="mt-3 text-sm">{status}</p></Modal>;
}
function PostCard({ post, onChange, onRemoved, openComments = false }) {
  const { me, request, refresh } = useConnect();
  const [dialog, setDialog] = useState(openComments ? 'comments' : null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function toggle(action, selected) {
    setBusy(true); setError('');
    try { onChange(await request(`/posts/${post.id}/${action}`, { method: selected ? 'DELETE' : 'PUT' })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <article className="rounded-[16px] border border-stone-200 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><Link to={`/ime-connect/profil/${post.author_id}`}><Avatar name={post.author} src={post.avatar} goldAvatar={post.status === 'admin'} large /></Link><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2"><Link to={`/ime-connect/profil/${post.author_id}`} className="break-words text-[15px] font-bold text-slate-800">{post.author}</Link><span className="break-words text-sm text-stone-500">@{post.username} · {timeAgo(post.created_at)}</span></div><p className="text-sm text-stone-500">{roleLabel(post)}{post.angkatan && ` · ${post.angkatan}`}</p></div>{post.owned && <button aria-label="Edit postingan" title="Edit postingan" className="text-stone-400" onClick={() => setDialog('edit')}><Pencil size={16} /></button>}{(post.owned || me.role === 'admin') && <button aria-label="Hapus postingan" title="Hapus postingan" className="text-stone-400" onClick={() => setDialog('delete')}><Trash2 size={16} /></button>}</div>
    <div className="mt-4 sm:ml-[68px]"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${categoryStyle[post.category]}`}>{post.category}</span><h2 className="mt-3 break-words text-[21px] font-bold leading-tight tracking-tight text-slate-800 sm:text-[22px]"><Link to={`/ime-connect/post/${post.id}`}>{post.title}</Link></h2><p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-6 text-stone-600">{post.body}</p><div className="mt-4 flex items-center gap-4 border-t border-stone-200 pt-3 text-sm text-stone-500"><button disabled={busy} aria-label="Sukai postingan" aria-pressed={post.liked} title="Sukai" onClick={() => toggle('like', post.liked)} className={`flex items-center gap-1.5 disabled:opacity-50 ${post.liked ? 'text-red-500' : 'hover:text-red-500'}`}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />{post.likes}</button><button aria-label="Buka komentar" title="Komentar" onClick={() => setDialog('comments')} className="flex items-center gap-1.5 hover:text-stone-800"><MessageCircle size={17} />{post.comments}</button><button aria-label="Bagikan postingan" title="Bagikan" onClick={() => setDialog('share')} className="flex items-center gap-1.5 hover:text-stone-800"><Share2 size={17} />{post.shares}</button><button disabled={busy} aria-label="Simpan postingan" aria-pressed={post.saved} title="Simpan" onClick={() => toggle('save', post.saved)} className={`ml-auto flex items-center gap-1.5 disabled:opacity-50 ${post.saved ? 'text-[#c99235]' : 'hover:text-[#c99235]'}`}><Bookmark size={17} fill={post.saved ? 'currentColor' : 'none'} /><span className="hidden sm:inline">Simpan</span></button></div><ErrorMessage error={error} /></div>
    {dialog === 'edit' && <PostEditor post={post} onClose={() => setDialog(null)} onDone={refresh} />}
    {dialog === 'delete' && <ConfirmDelete title="Hapus postingan?" path={`/posts/${post.id}`} onClose={() => setDialog(null)} onDone={() => { onRemoved(); refresh(); }} />}
    {dialog === 'comments' && <Comments post={post} onClose={() => setDialog(null)} onChange={onChange} />}
    {dialog === 'share' && <ShareDialog post={post} onClose={() => setDialog(null)} onChange={onChange} />}
  </article>;
}
function Feed({ category, author, saved = false, isHome = false, composer = false }) {
  const { me, revision, refresh } = useConnect();
  const [filter, setFilter] = useState('Semua'), [editing, setEditing] = useState(false);
  const [search] = useSearchParams();
  const params = new URLSearchParams();
  if (category || filter !== 'Semua') params.set('category', category || filter);
  if (author) params.set('author', author);
  if (saved) params.set('saved', 'true');
  if (search.get('q')) params.set('q', search.get('q'));
  if (search.get('tag')) params.set('tag', search.get('tag'));
  const query = useConnectQuery(`/posts?${params}`, revision);
  const visibleItems = query.data?.items.filter(post => !saved || post.saved);
  return <div className="space-y-4">{composer && <div className="rounded-[16px] border border-stone-200 bg-white p-4"><div className="flex items-center gap-3"><Avatar name={me.name} src={me.avatar} goldAvatar /><button onClick={() => setEditing(true)} className="min-h-10 min-w-0 flex-1 rounded-full bg-[#efeeeb] px-5 py-2 text-left text-sm text-stone-500">Bagikan informasi untuk teman Elektro...</button></div></div>}
    {isHome && <div className="flex gap-2 overflow-x-auto pb-1">{['Semua', ...categories].map(item => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === item ? 'bg-[#c99235] text-white' : 'bg-[#efeeeb] text-stone-500 hover:bg-stone-200'}`}>{item}</button>)}</div>}
    {(search.get('q') || search.get('tag')) && <p className="text-sm text-stone-500">Hasil untuk {search.get('q') || `#${search.get('tag')}`}</p>}
    <QueryState query={{ ...query, data: query.data && { ...query.data, items: visibleItems } }} empty={saved ? 'Belum ada postingan yang disimpan.' : 'Belum ada postingan yang sesuai.'} /><div className="space-y-4">{visibleItems?.map(post => <PostCard key={post.id} post={post} onChange={query.replace} onRemoved={query.reload} />)}</div><LoadMore query={query} />
    {editing && <PostEditor category={category} onClose={() => setEditing(false)} onDone={refresh} />}
  </div>;
}
function IntroCard({ type, stats }) {
  const isTensi = type === 'tensi';
  const numbers = isTensi ? [[stats?.editions ?? 0, 'Edisi'], [stats?.readers ?? 0, 'Pembaca'], [stats?.latest ? new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(new Date(stats.latest)) : '-', 'Edisi Terbaru']] : [[stats?.alumni ?? 0, 'Alumni'], [stats?.companies ?? 0, 'Perusahaan'], [stats?.cohorts ?? 0, 'Angkatan']];
  return <section className={`rounded-[20px] p-7 text-white sm:p-8 ${isTensi ? 'bg-gradient-to-br from-[#20201e] to-[#302b22]' : 'bg-gradient-to-br from-[#1b345a] to-[#29496f]'}`}><div className="flex items-center gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${isTensi ? 'bg-[#c99235]' : 'bg-[#45679d]'}`}>{isTensi ? <Newspaper /> : <GraduationCap />}</span><div><h2 className="text-3xl font-extrabold tracking-tight">{isTensi ? 'TENSI' : 'Pojok Alumni'}</h2><p className="text-sm text-white/55">{isTensi ? 'Teknologi & Informasi Himpunan Elektro' : 'Cerita & Informasi dari Para Senior'}</p></div></div><p className="mt-5 max-w-2xl text-[16px] leading-6 text-white/65">{isTensi ? 'Kanal resmi berita, liputan, dan konten editorial dari Himpunan Mahasiswa Teknik Elektro. Ditulis dan dikurasi langsung oleh tim redaksi TENSI.' : 'Ruang berbagi untuk alumni Teknik Elektro - pengalaman kerja, peluang karir, tips industri, dan jejaring profesional.'}</p><div className="mt-6 flex flex-wrap gap-7 border-t border-white/10 pt-5">{numbers.map(([count, label]) => <div key={label}><b className="block text-2xl">{count}</b><span className="text-sm text-white/50">{label}</span></div>)}</div></section>;
}
function Network() {
  const { revision, refresh } = useConnect();
  const [params, setParams] = useSearchParams();
  const tab = ['following', 'followers'].includes(params.get('tab')) ? params.get('tab') : 'discover';
  const queryParams = new URLSearchParams({ tab, q: params.get('q') || '' });
  if (params.get('owner')) queryParams.set('owner', params.get('owner'));
  const query = useConnectQuery(`/profiles?${queryParams}`, revision);
  return <><div className="flex rounded-[18px] bg-[#edebe7] p-1" role="tablist" aria-label="Network">{[['discover', 'Temukan'], ['following', 'Following'], ['followers', 'Followers']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('tab', key); return next; })} className={`h-12 flex-1 rounded-2xl text-sm font-bold ${tab === key ? 'bg-white shadow-sm' : 'text-stone-500'}`}>{label}</button>)}</div><div className="mt-6 space-y-4"><QueryState query={query} empty="Belum ada akun di daftar ini." />{query.data?.items.map(person => <article className="flex items-center gap-4 rounded-[18px] border border-stone-200 bg-white p-5" key={person.id}><Link to={`/ime-connect/profil/${person.id}`}><Avatar name={person.name} src={person.avatar} goldAvatar={person.status !== 'mahasiswa'} large /></Link><Link to={`/ime-connect/profil/${person.id}`} className="min-w-0 flex-1"><h2 className="break-words font-bold text-slate-800">{person.name}</h2><p className="truncate text-sm text-stone-500">{roleLabel(person)}</p><p className="text-sm text-stone-500">{person.mutual} mutual{person.angkatan && ` · Angkatan ${person.angkatan}`}</p></Link><FollowButton person={person} onDone={refresh} /></article>)}</div><LoadMore query={query} /></>;
}
function Profile({ profileId }) {
  const { me, revision, refresh } = useConnect();
  const [tab, setTab] = useState('Postingan'), [editing, setEditing] = useState(false);
  const query = useConnectQuery(`/profiles/${profileId || me.id}`, revision);
  const profile = query.data;
  if (!profile) return <QueryState query={query} />;
  const own = profile.id === me.id;
  return <><section className="overflow-hidden rounded-[20px] border border-stone-200 bg-white"><div className="h-40 bg-[linear-gradient(120deg,#211f1d_0%,#2b2520_48%,#c99235_100%)]" /><div className="relative px-6 pb-6"><div className="-mt-14 flex items-end justify-between"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[22px] border-[5px] border-white bg-[#d5a344] text-2xl font-bold text-white">{profile.avatar ? <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" /> : initials(profile.name)}</div>{own ? <button onClick={() => setEditing(true)} className="rounded-full border border-stone-200 px-5 py-2 text-sm font-bold">Edit Profil</button> : <FollowButton person={profile} onDone={refresh} />}</div><h1 className="mt-5 break-words text-3xl font-extrabold tracking-tight">{profile.name}</h1><p className="break-words text-stone-500">@{profile.username} · {roleLabel(profile)}{profile.angkatan && ` · ${profile.angkatan}`}</p><p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-6 text-stone-700">{profile.bio}</p><div className="mt-5 flex flex-wrap gap-6 text-sm text-stone-500"><Link to={`/ime-connect/network?tab=following&owner=${profile.id}`}><b className="text-lg text-stone-800">{profile.following_count}</b> Following</Link><Link to={`/ime-connect/network?tab=followers&owner=${profile.id}`}><b className="text-lg text-stone-800">{profile.followers_count}</b> Followers</Link><span><b className="text-lg text-stone-800">{profile.posts_count}</b> Postingan</span></div><div className="mt-4 flex flex-wrap gap-2">{profile.badges.map((badge, index) => <span key={badge} className={`rounded-full px-3 py-1 text-sm ${['bg-emerald-50 text-emerald-700', 'bg-amber-50 text-[#bd8530]', 'bg-blue-50 text-blue-700'][index % 3]}`}>{badge}</span>)}</div></div></section>
    <div className="mt-5 flex rounded-[18px] bg-[#edebe7] p-1" role="tablist" aria-label="Profil">{(own ? ['Postingan', 'Disimpan', 'Tentang'] : ['Postingan', 'Tentang']).map(item => <button role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)} className={`h-11 flex-1 rounded-2xl text-sm font-bold ${tab === item ? 'bg-white shadow-sm' : 'text-stone-500'}`}>{item}</button>)}</div>
    <div className="mt-6">{tab === 'Tentang' ? <div className="space-y-3 rounded-[18px] border border-stone-200 bg-white p-6 text-sm text-stone-600"><p>{roleLabel(profile)}</p>{profile.company && <p>{profile.company}</p>}{profile.angkatan && <p>Angkatan {profile.angkatan}</p>}<p className="whitespace-pre-wrap break-words">{profile.bio || 'Belum ada bio.'}</p></div> : <Feed key={tab} author={tab === 'Postingan' ? profile.id : undefined} saved={own && tab === 'Disimpan'} />}</div>
    {editing && <ProfileEditor profile={profile} onClose={() => setEditing(false)} onDone={refresh} />}
  </>;
}
function PostDetail({ postId }) {
  const { revision } = useConnect();
  const navigate = useNavigate();
  const query = useConnectQuery(`/posts/${postId}`, revision);
  return <>{!query.data && <QueryState query={query} />}{query.data && <PostCard post={query.data} onChange={query.replace} onRemoved={() => navigate('/ime-connect')} openComments />}</>;
}
function ConnectContent() {
  const { pathname } = useLocation();
  const { profileId, postId } = useParams();
  const { me, revision, notice, notify } = useConnect();
  const active = pathname.split('/')[2] || 'beranda';
  const summary = useConnectQuery('/summary', revision);
  const title = { beranda: 'Beranda', tensi: 'TENSI', alumni: 'Pojok Alumni', network: 'Network', profil: profileId && Number(profileId) !== me.id ? 'Profil' : 'Profil Saya', post: 'Postingan' }[active];
  return <div className="ime-connect min-h-screen bg-[#f6f5f1] font-normal text-[#252525]"><div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row"><Sidebar active={active} /><div className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-9"><div className="mx-auto grid max-w-[1140px] gap-7 xl:grid-cols-[minmax(0,1fr)_280px]"><section className="min-w-0"><header className="mb-6"><h1 className="text-4xl font-extrabold leading-none tracking-tight sm:text-[42px]">{title}</h1><span className="mt-3 block h-[3px] w-11 rounded-full bg-[#c99235]" /></header><div className="mb-5 xl:hidden"><SearchBox /></div>{notice && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-3 text-sm"><span>{notice}</span><button onClick={() => notify('')} aria-label="Tutup pesan"><X size={16} /></button></div>}
    {active === 'beranda' && <Feed isHome composer />}
    {active === 'tensi' && <div className="space-y-6"><IntroCard type="tensi" stats={summary.data?.stats} /><Feed category="TENSI" composer={me.role === 'admin'} /></div>}
    {active === 'alumni' && <div className="space-y-6"><IntroCard type="alumni" stats={summary.data?.stats} /><Feed category="Alumni" composer={me.role === 'admin' || me.status === 'alumni'} /></div>}
    {active === 'network' && <Network />}{active === 'profil' && <Profile key={profileId || 'me'} profileId={profileId} />}{active === 'post' && <PostDetail key={postId} postId={postId} />}
    </section><div className="hidden xl:block"><RightRail summary={summary} /></div></div></div></div></div>;
}
export default function ImeConnectPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0), [revision, setRevision] = useState(0), [notice, notify] = useState('');
  const request = useCallback(async (path, options, auth = false) => {
    try { return await api(auth ? path : `/connect${path}`, options); }
    catch (e) {
      if (e.status === 401) navigate(`/member/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
      throw e;
    }
  }, [navigate]);
  useEffect(() => {
    const controller = new AbortController();
    request('/me', { signal: controller.signal }).then(user => { if (!controller.signal.aborted) { setMe(user); setError(''); } }).catch(e => { if (!controller.signal.aborted && e.status !== 401) setError(e.message); });
    return () => controller.abort();
  }, [request, retry]);
  if (!me) return <div className="ime-connect min-h-screen bg-[#f6f5f1] p-12 text-center font-normal"><p role="status">{error || 'Memeriksa sesi...'}</p>{error && <button onClick={() => setRetry(value => value + 1)} className={`${primary} mt-4`}>Coba lagi</button>}</div>;
  return <ConnectContext.Provider value={{ me, setMe, request, revision, refresh: () => setRevision(value => value + 1), notice, notify }}><ConnectContent /></ConnectContext.Provider>;
}

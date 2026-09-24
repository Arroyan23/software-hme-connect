import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  Bookmark,
  Folder,
  GraduationCap,
  Heart,
  House,
  LogOut,
  MessageCircle,
  Moon,
  Newspaper,
  Pencil,
  Search,
  Send,
  Share2,
  Trash2,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import hmeLogo from "../img/Patokan Design HME_Aisyah & Althaf .png";
import {
  ConnectContext,
  initials,
  roleLabel,
  timeAgo,
  useConnect,
  useConnectQuery,
} from "../lib/connect-client";

const categories = [
  "Beasiswa",
  "Magang",
  "Organisasi",
  "Akademik",
  "Info Kampus",
];
const navItems = [
  ["beranda", "Beranda", House],
  ["tensi", "TENSI", Newspaper],
  ["alumni", "Alumni", GraduationCap],
  ["network", "Network", UsersRound],
  ["profil", "Profil", UserRound],
];
const colors = {
  Beasiswa: "bg-emerald-50 text-emerald-700",
  Magang: "bg-blue-50 text-blue-700",
  Organisasi: "bg-fuchsia-50 text-fuchsia-700",
  Akademik: "bg-red-50 text-red-700",
  "Info Kampus": "bg-amber-50 text-amber-700",
  TENSI: "bg-[#fbf5ea] text-[#b77b21]",
  Alumni: "bg-blue-50 text-[#476da5]",
};
const primary =
  "rounded-full bg-[#c99235] px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
const input =
  "mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-[#c99235]/30 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-100";

function Avatar({ profile, large = false }) {
  return (
    <div
      className={`${large ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm"} grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#474747] font-bold text-white`}
    >
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(profile.name)
      )}
    </div>
  );
}
function Error({ children }) {
  return children ? (
    <p role="alert" className="mt-3 text-sm text-red-700">
      {children}
    </p>
  ) : null;
}
function HmeLoader({ label = "Memuat...", compact = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center ${compact ? "gap-2" : "gap-3 py-8"}`}
    >
      <div className={`relative ${compact ? "h-7 w-7" : "h-20 w-20"}`}>
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-[#c99235]/20 border-t-[#c99235] motion-safe:animate-spin"
        />
        <span
          aria-hidden="true"
          className="absolute inset-2 rounded-full border border-[#c99235]/20 motion-safe:animate-pulse"
        />
        <div className="absolute inset-[18%] overflow-hidden rounded-full bg-white p-0.5 shadow-sm connect-dark:bg-[#22221f]">
          <img
            src={hmeLogo}
            alt=""
            className="h-full w-full object-contain motion-safe:animate-pulse"
          />
        </div>
      </div>
      <div>
        <p
          className={`${compact ? "text-xs" : "text-sm"} font-semibold text-stone-600 connect-dark:text-stone-300`}
        >
          {label}
        </p>
        {!compact && (
          <span aria-hidden="true" className="mt-1 flex justify-center gap-1">
            {[0, 1, 2].map((dot) => (
              <i
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-[#c99235] motion-safe:animate-bounce"
                style={{ animationDelay: `${dot * 140}ms` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
function Loading({ query, empty = "Belum ada data." }) {
  if (query.error)
    return (
      <div className="py-8 text-center">
        <Error>{query.error.message}</Error>
        <button onClick={query.reload} className={`${primary} mt-3`}>
          Coba lagi
        </button>
      </div>
    );
  if (!query.data && query.loading) return <HmeLoader />;
  if (query.data?.items?.length === 0)
    return (
      <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-400">
        {empty}
      </p>
    );
  return null;
}
function Modal({ title, close, children }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl connect-dark:bg-[#22221f] connect-dark:text-stone-100"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button
            onClick={close}
            aria-label="Tutup dialog"
            className="rounded-full p-2 hover:bg-stone-100"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function PostForm({ post, category, close, done }) {
  const { me, request } = useConnect();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const allowed = [
    ...categories,
    ...(me.role === "admin" ? ["TENSI"] : []),
    ...(me.role === "admin" || me.status === "alumni" ? ["Alumni"] : []),
  ];
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(post ? `/posts/${post.id}` : "/posts", {
        method: post ? "PUT" : "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      done();
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={post ? "Edit Postingan" : "Bagikan Informasi"} close={close}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Kategori
          <select
            className={input}
            name="category"
            defaultValue={post?.category || category || "Info Kampus"}
          >
            {allowed.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Judul
          <input
            className={input}
            name="title"
            required
            maxLength="180"
            defaultValue={post?.title}
          />
        </label>
        <label className="block text-sm">
          Isi postingan
          <textarea
            className={input}
            name="body"
            rows="6"
            required
            maxLength="10000"
            defaultValue={post?.body}
          />
        </label>
        <Error>{error}</Error>
        <button disabled={busy} className={primary}>
          <Send size={15} className="mr-1 inline" />
          {busy ? "Menyimpan..." : post ? "Simpan" : "Terbitkan"}
        </button>
      </form>
    </Modal>
  );
}
function CommentModal({ post, close, updatePost }) {
  const { request } = useConnect();
  const query = useConnectQuery(`/posts/${post.id}/comments`);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(`/posts/${post.id}/comments`, {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      e.currentTarget.reset();
      query.reload();
      updatePost(await request(`/posts/${post.id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Komentar" close={close}>
      <p className="mb-4 font-serif text-xl">{post.title}</p>
      <form onSubmit={submit}>
        <textarea
          className={input}
          name="body"
          rows="3"
          required
          maxLength="2000"
          placeholder="Tulis komentar"
        />
        <Error>{error}</Error>
        <button disabled={busy} className={`${primary} mt-3`}>
          {busy ? "Mengirim..." : "Kirim komentar"}
        </button>
      </form>
      <div className="mt-6 space-y-4">
        <Loading query={query} empty="Belum ada komentar." />
        {query.data?.items.map((c) => (
          <article
            key={c.id}
            className="border-t border-stone-200 pt-3 connect-dark:border-stone-700"
          >
            <div className="flex items-center gap-2">
              <Avatar profile={{ name: c.author, avatar: c.avatar }} />
              <div>
                <b className="text-sm">{c.author}</b>
                <p className="text-xs text-stone-500 connect-dark:text-stone-400">
                  {timeAgo(c.created_at)}
                </p>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              {c.body}
            </p>
          </article>
        ))}
      </div>
    </Modal>
  );
}
function PostCard({ post, changed, removed }) {
  const { me, request, refresh } = useConnect();
  const [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function action(name, on) {
    setBusy(true);
    setError("");
    try {
      changed(
        await request(`/posts/${post.id}/${name}`, {
          method: on ? "DELETE" : "PUT",
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/ime-connect/post/${post.id}`,
      );
      changed(await request(`/posts/${post.id}/share`, { method: "PUT" }));
    } catch {
      setError("Tautan belum dapat disalin.");
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await request(`/posts/${post.id}`, { method: "DELETE" });
      removed();
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-900 transition-colors duration-300 sm:p-6 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-100">
      <div className="flex items-start gap-3">
        <Link to={`/ime-connect/profil/${post.author_id}`}>
          <Avatar profile={{ name: post.author, avatar: post.avatar }} large />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/ime-connect/profil/${post.author_id}`}
            className="font-bold text-slate-800 connect-dark:text-stone-100"
          >
            {post.author}
          </Link>
          <span className="ml-2 text-sm text-stone-500 connect-dark:text-stone-400">
            @{post.username} · {timeAgo(post.created_at)}
          </span>
          <p className="text-sm text-stone-500 connect-dark:text-stone-400">
            {roleLabel(post)}
            {post.angkatan && ` · ${post.angkatan}`}
          </p>
        </div>
        {post.owned && (
          <button
            onClick={() => setModal("edit")}
            title="Edit postingan"
            aria-label="Edit postingan"
          >
            <Pencil size={16} />
          </button>
        )}
        {(post.owned || me.role === "admin") && (
          <button
            onClick={() => setModal("delete")}
            title="Hapus postingan"
            aria-label="Hapus postingan"
            className="ml-3"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="mt-4 sm:ml-[68px]">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${colors[post.category]}`}
        >
          {post.category}
        </span>
        <h2 className="mt-3 font-serif text-[22px] font-bold leading-tight">
          <Link to={`/ime-connect/post/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-6 text-stone-600 connect-dark:text-stone-300">
          {post.body}
        </p>
        <div className="mt-4 flex items-center gap-4 border-t border-stone-200 pt-3 text-sm text-stone-500 connect-dark:border-stone-700 connect-dark:text-stone-400">
          <button
            disabled={busy}
            aria-pressed={post.liked}
            onClick={() => action("like", post.liked)}
            className={
              post.liked
                ? "flex items-center gap-1 text-red-500"
                : "flex items-center gap-1"
            }
          >
            <Heart size={17} fill={post.liked ? "currentColor" : "none"} />
            {post.likes}
          </button>
          <button
            onClick={() => setModal("comments")}
            className="flex items-center gap-1"
          >
            <MessageCircle size={17} />
            {post.comments}
          </button>
          <button onClick={share} className="flex items-center gap-1">
            <Share2 size={17} />
            {post.shares}
          </button>
          <button
            disabled={busy}
            aria-pressed={post.saved}
            onClick={() => action("save", post.saved)}
            className={`ml-auto flex items-center gap-1 ${post.saved ? "text-[#c99235]" : ""}`}
          >
            <Bookmark size={17} fill={post.saved ? "currentColor" : "none"} />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </div>
        <Error>{error}</Error>
      </div>
      {modal === "edit" && (
        <PostForm post={post} close={() => setModal(null)} done={refresh} />
      )}{" "}
      {modal === "comments" && (
        <CommentModal
          post={post}
          close={() => setModal(null)}
          updatePost={changed}
        />
      )}{" "}
      {modal === "delete" && (
        <Modal title="Hapus postingan?" close={() => setModal(null)}>
          <p className="text-sm text-stone-600">
            Postingan dan seluruh komentarnya akan dihapus.
          </p>
          <Error>{error}</Error>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setModal(null)}>Batal</button>
            <button
              onClick={remove}
              disabled={busy}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Hapus
            </button>
          </div>
        </Modal>
      )}
    </article>
  );
}
function Feed({ category, author, saved, composer = false }) {
  const { me, revision, refresh } = useConnect();
  const [filter, setFilter] = useState("Semua"),
    [newPost, setNewPost] = useState(false);
  const [search] = useSearchParams();
  const p = new URLSearchParams();
  if (category || filter !== "Semua") p.set("category", category || filter);
  if (author) p.set("author", author);
  if (saved) p.set("saved", "true");
  if (search.get("q")) p.set("q", search.get("q"));
  if (search.get("tag")) p.set("tag", search.get("tag"));
  const query = useConnectQuery(`/posts?${p}`, revision);
  return (
    <div className="space-y-4">
      {composer && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f]">
          <div className="flex gap-3">
            <Avatar profile={me} />
            <button
              onClick={() => setNewPost(true)}
              className="flex-1 rounded-full bg-[#efeeeb] px-5 text-left text-sm text-stone-500 transition-colors duration-300 connect-dark:bg-stone-800 connect-dark:text-stone-400"
            >
              Bagikan informasi untuk teman Elektro...
            </button>
          </div>
        </div>
      )}
      {!category && !author && !saved && (
        <div className="flex gap-2 overflow-x-auto">
          {["Semua", ...categories].map((x) => (
            <button
              key={x}
              onClick={() => setFilter(x)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${filter === x ? "bg-[#c99235] text-white" : "bg-[#efeeeb] text-stone-500 connect-dark:bg-stone-800 connect-dark:text-stone-400"}`}
            >
              {x}
            </button>
          ))}
        </div>
      )}
      {(search.get("q") || search.get("tag")) && (
        <p className="text-sm text-stone-500 connect-dark:text-stone-400">
          Hasil pencarian: {search.get("q") || `#${search.get("tag")}`}
        </p>
      )}
      <Loading
        query={query}
        empty={saved ? "Belum ada postingan disimpan." : "Belum ada postingan."}
      />
      {query.data?.items.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          changed={query.replace}
          removed={query.reload}
        />
      ))}
      {query.data?.nextCursor && (
        <button
          onClick={query.more}
          disabled={query.moreBusy}
          className="mx-auto block rounded-full border border-stone-200 bg-white px-4 py-2 text-sm transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-200"
        >
          {query.moreBusy ? (
            <HmeLoader label="Memuat" compact />
          ) : (
            "Muat lebih banyak"
          )}
        </button>
      )}
      {newPost && (
        <PostForm
          category={category}
          close={() => setNewPost(false)}
          done={refresh}
        />
      )}
    </div>
  );
}
function Sidebar({ active, theme, toggleTheme }) {
  const { me, request } = useConnect();
  const navigate = useNavigate();
  async function logout() {
    await request("/auth/logout", { method: "POST" }, true);
    navigate("/member/login", { replace: true });
  }
  return (
    <aside className="bg-[#1d1d1b] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[236px]">
      <div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-7">
        <Link to="/ime-connect" className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1">
            <img
              src={hmeLogo}
              alt="Logo HME"
              className="h-full w-full object-contain"
            />
          </span>
          <span>
            <b className="block font-serif text-xl">IME Connect</b>
            <small className="text-white/40">Himpunan Elektro</small>
          </span>
        </Link>
        <nav className="mt-8 flex gap-1 overflow-x-auto lg:mt-12 lg:block lg:space-y-2">
          {navItems.map(([key, label, Icon]) => (
            <Link
              key={key}
              to={key === "beranda" ? "/ime-connect" : `/ime-connect/${key}`}
              className={`flex min-w-fit items-center gap-3 rounded-xl px-3 py-3 font-semibold ${active === key ? "bg-[#382f1c] text-[#d5a344]" : "text-white/75"}`}
            >
              {key === "tensi" && active !== key ? (
                <Folder size={20} />
              ) : (
                <Icon size={20} />
              )}{" "}
              {label}
              {key === "tensi" && (
                <em className="ml-auto rounded-full bg-[#d5a344] px-2 text-[11px] not-italic text-white">
                  Baru
                </em>
              )}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
          className="mt-6 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 lg:mt-auto"
        >
          <span className="flex items-center gap-3">
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            {theme === "dark" ? "Mode gelap" : "Mode terang"}
          </span>
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 rounded-full transition-colors ${theme === "dark" ? "bg-[#c99235]" : "bg-white/20"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-[18px]" : "translate-x-0.5"}`}
            />
          </span>
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-3">
          <Link
            to="/ime-connect/profil"
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar profile={me} />
            <span className="min-w-0">
              <b className="block truncate text-sm">{me.name}</b>
              <small className="block truncate text-xs text-white/40">
                @{me.username}
              </small>
            </span>
          </Link>
          <button onClick={logout} aria-label="Keluar" title="Keluar">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
function SearchBox() {
  const [params, setParams] = useSearchParams();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q").trim();
        setParams(q ? { q } : {});
      }}
      className="relative"
    >
      <Search
        size={18}
        className="absolute left-4 top-4 text-stone-400 connect-dark:text-stone-500"
      />
      <input
        name="q"
        defaultValue={params.get("q") || ""}
        placeholder="Cari informasi..."
        className="h-12 w-full rounded-2xl bg-[#efeeeb] pl-11 pr-4 text-sm text-stone-900 outline-none transition-colors duration-300 placeholder:text-stone-400 connect-dark:bg-stone-800 connect-dark:text-stone-100 connect-dark:placeholder:text-stone-500"
      />
    </form>
  );
}
function Rail() {
  const { revision, refresh } = useConnect();
  const summary = useConnectQuery("/summary", revision);
  return (
    <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
      <SearchBox />
      <section className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-100">
        <h2 className="font-serif text-xl font-bold">Trending di Elektro</h2>
        {summary.data?.trending.length === 0 && (
          <p className="mt-4 text-sm text-stone-500 connect-dark:text-stone-400">
            Belum ada topik trending.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {summary.data?.trending.map((t, i) => (
            <Link
              key={t.tag}
              to={`/ime-connect?tag=${t.tag}`}
              className="block"
            >
              <p className="text-sm text-stone-500 connect-dark:text-stone-400">
                #{i + 1} Elektro
              </p>
              <b>#{t.tag}</b>
              <p className="text-sm text-stone-500 connect-dark:text-stone-400">
                {t.count} postingan
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-100">
        <h2 className="font-serif text-xl font-bold">Mungkin Kamu Kenal</h2>
        <div className="mt-4 space-y-3">
          {summary.data?.suggestions.map((person) => (
            <Person key={person.id} person={person} done={refresh} />
          ))}
        </div>
      </section>
    </aside>
  );
}
function Person({ person, done }) {
  const { me, request } = useConnect();
  const [busy, setBusy] = useState(false);
  if (person.id === me.id) return null;
  async function toggle() {
    setBusy(true);
    try {
      await request(`/profiles/${person.id}/follow`, {
        method: person.following ? "DELETE" : "PUT",
      });
      done();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-3">
      <Link to={`/ime-connect/profil/${person.id}`}>
        <Avatar profile={person} />
      </Link>
      <Link to={`/ime-connect/profil/${person.id}`} className="min-w-0 flex-1">
        <b className="block truncate text-sm">{person.name}</b>
        <p className="truncate text-xs text-stone-500 connect-dark:text-stone-400">
          {roleLabel(person)}
        </p>
      </Link>
      <button
        disabled={busy}
        onClick={toggle}
        className={`${person.following ? "bg-stone-100 text-stone-500 connect-dark:bg-stone-800 connect-dark:text-stone-300" : "bg-[#c99235] text-white"} rounded-full px-3 py-1.5 text-xs font-bold`}
      >
        {person.following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
function Network() {
  const { revision, refresh } = useConnect();
  const [params, setParams] = useSearchParams();
  const tab = ["following", "followers"].includes(params.get("tab"))
    ? params.get("tab")
    : "discover";
  const owner = params.get("owner");
  const q = useConnectQuery(
    `/profiles?tab=${tab}${owner ? `&owner=${owner}` : ""}`,
    revision,
  );
  return (
    <>
      <div className="flex rounded-2xl bg-[#edebe7] p-1 transition-colors duration-300 connect-dark:bg-stone-800">
        {[
          ["discover", "Temukan"],
          ["following", "Following"],
          ["followers", "Followers"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setParams({ tab: key, ...(owner ? { owner } : {}) })}
            className={`h-11 flex-1 rounded-xl text-sm font-bold ${tab === key ? "bg-white shadow-sm connect-dark:bg-[#292925] connect-dark:text-stone-100" : "text-stone-500 connect-dark:text-stone-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-4">
        <Loading query={q} empty="Belum ada akun." />
        {q.data?.items.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-100"
          >
            <Person person={p} done={refresh} />
          </article>
        ))}
      </div>
    </>
  );
}
function Profile({ id }) {
  const { me, revision, refresh, setMe } = useConnect();
  const [tab, setTab] = useState("Postingan");
  const [editing, setEditing] = useState(false);
  const q = useConnectQuery(`/profiles/${id || me.id}`, revision);
  const profile = q.data;
  if (!profile) return <Loading query={q} />;
  const own = profile.id === me.id;
  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await api("/connect/me", {
      method: "PUT",
      body: {
        name: form.get("name"),
        username: form.get("username"),
        headline: form.get("headline"),
        company: form.get("company"),
        bio: form.get("bio"),
        badges: String(form.get("badges"))
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      },
    });
    setMe(result);
    setEditing(false);
    refresh();
  }
  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-100">
        <div className="h-36 bg-[linear-gradient(120deg,#211f1d,#c99235)]" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <div className="rounded-2xl border-4 border-white connect-dark:border-[#22221f]">
              <Avatar profile={profile} large />
            </div>
            {own && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-full border px-4 py-2 text-sm font-bold"
              >
                Edit Profil
              </button>
            )}
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold">{profile.name}</h1>
          <p className="text-stone-500 connect-dark:text-stone-400">
            @{profile.username} · {roleLabel(profile)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm">{profile.bio}</p>
          <div className="mt-4 flex gap-5 text-sm">
            <span>
              <b>{profile.following_count}</b> Following
            </span>
            <span>
              <b>{profile.followers_count}</b> Followers
            </span>
            <span>
              <b>{profile.posts_count}</b> Postingan
            </span>
          </div>
        </div>
      </section>
      <div className="mt-5 flex rounded-2xl bg-[#edebe7] p-1 transition-colors duration-300 connect-dark:bg-stone-800">
        {(own
          ? ["Postingan", "Disimpan", "Tentang"]
          : ["Postingan", "Tentang"]
        ).map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={`h-11 flex-1 rounded-xl text-sm font-bold ${tab === x ? "bg-white shadow-sm connect-dark:bg-[#292925] connect-dark:text-stone-100" : "text-stone-500 connect-dark:text-stone-400"}`}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "Tentang" ? (
          <p className="rounded-2xl border border-stone-200 bg-white p-6 text-sm transition-colors duration-300 connect-dark:border-stone-700 connect-dark:bg-[#22221f] connect-dark:text-stone-200">
            {profile.company || "Belum ada informasi tambahan."}
          </p>
        ) : (
          <Feed
            author={tab === "Postingan" ? profile.id : undefined}
            saved={tab === "Disimpan"}
          />
        )}
      </div>
      {editing && (
        <Modal title="Edit Profil" close={() => setEditing(false)}>
          <form onSubmit={save} className="space-y-3">
            <label className="block text-sm">
              Nama
              <input
                className={input}
                name="name"
                defaultValue={profile.name}
              />
            </label>
            <label className="block text-sm">
              Username
              <input
                className={input}
                name="username"
                defaultValue={profile.username}
              />
            </label>
            <label className="block text-sm">
              Jabatan
              <input
                className={input}
                name="headline"
                defaultValue={profile.headline}
              />
            </label>
            <label className="block text-sm">
              Organisasi
              <input
                className={input}
                name="company"
                defaultValue={profile.company}
              />
            </label>
            <label className="block text-sm">
              Bio
              <textarea
                className={input}
                name="bio"
                defaultValue={profile.bio}
              />
            </label>
            <label className="block text-sm">
              Pencapaian
              <input
                className={input}
                name="badges"
                defaultValue={profile.badges.join(", ")}
              />
            </label>
            <button className={primary}>Simpan profil</button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Content({ theme, toggleTheme }) {
  const { pathname } = useLocation();
  const { profileId, postId } = useParams();
  const { me } = useConnect();
  const active = pathname.split("/")[2] || "beranda";
  const title =
    active === "tensi"
      ? "TENSI"
      : active === "alumni"
        ? "Pojok Alumni"
        : active === "network"
          ? "Network"
          : active === "profil"
            ? "Profil Saya"
            : active === "post"
              ? "Postingan"
              : "Beranda";
  const detail = useConnectQuery(postId ? `/posts/${postId}` : null);
  return (
    <div
      className="ime-connect min-h-screen bg-[#f6f5f1] text-stone-900 transition-colors duration-300 connect-dark:bg-[#171714] connect-dark:text-stone-100"
      data-theme={theme}
    >
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <Sidebar active={active} theme={theme} toggleTheme={toggleTheme} />
        <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-9">
          <div className="mx-auto grid max-w-[1140px] gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
            <section>
              <header className="mb-6">
                <h1 className="font-serif text-4xl font-bold">{title}</h1>
                <span className="mt-3 block h-1 w-11 bg-[#c99235]" />
              </header>
              <div className="mb-5 xl:hidden">
                <SearchBox />
              </div>
              {active === "beranda" && <Feed composer />}
              {active === "tensi" && (
                <Feed category="TENSI" composer={me.role === "admin"} />
              )}{" "}
              {active === "alumni" && (
                <Feed
                  category="Alumni"
                  composer={me.role === "admin" || me.status === "alumni"}
                />
              )}{" "}
              {active === "network" && <Network />}
              {active === "profil" && <Profile id={profileId} />}{" "}
              {active === "post" &&
                (!detail.data ? (
                  <Loading query={detail} />
                ) : (
                  <PostCard
                    post={detail.data}
                    changed={detail.replace}
                    removed={() => {}}
                  />
                ))}
            </section>
            <div className="hidden xl:block">
              <Rail />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default function ImeConnectPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null),
    [retry, setRetry] = useState(0),
    [error, setError] = useState(""),
    [theme, setTheme] = useState(() =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("ime-connect-theme") === "dark"
        ? "dark"
        : "light",
    );
  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    [],
  );
  useEffect(() => {
    window.localStorage.setItem("ime-connect-theme", theme);
  }, [theme]);
  const request = useCallback(
    async (path, options, plain = false) => {
      try {
        return await api(plain ? path : `/connect${path}`, options);
      } catch (e) {
        if (
          e.status === 401 &&
          window.location.pathname.startsWith("/ime-connect")
        )
          navigate(
            `/member/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
            { replace: true },
          );
        throw e;
      }
    },
    [navigate],
  );
  useEffect(() => {
    let alive = true;
    request("/me")
      .then((x) => alive && setMe(x))
      .catch((e) => alive && e.status !== 401 && setError(e.message));
    return () => {
      alive = false;
    };
  }, [request, retry]);
  if (!me)
    return (
      <div
        className={`ime-connect grid min-h-screen place-items-center bg-[#f6f5f1] p-12 text-center transition-colors duration-300 ${theme === "dark" ? "bg-[#171714] text-stone-100" : "text-stone-900"}`}
        data-theme={theme}
      >
        <div>
          <HmeLoader label={error || "Memeriksa sesi..."} />
          {error && (
            <button
              onClick={() => setRetry((x) => x + 1)}
              className={`${primary} mt-3`}
            >
              Coba lagi
            </button>
          )}
        </div>
      </div>
    );
  return (
    <ConnectContext.Provider
      value={{
        me,
        setMe,
        request,
        revision: retry,
        refresh: () => setRetry((x) => x + 1),
      }}
    >
      <Content theme={theme} toggleTheme={toggleTheme} />
    </ConnectContext.Provider>
  );
}

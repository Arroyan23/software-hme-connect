import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const ConnectContext = createContext(null);
export const useConnect = () => useContext(ConnectContext);

const queryCache = new Map();
const queryCacheTtl = 30_000;
const queryCacheLimit = 50;

function readQueryCache(key) {
  const entry = queryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > queryCacheTtl) {
    queryCache.delete(key);
    return null;
  }
  return entry.data;
}

function writeQueryCache(key, data) {
  queryCache.delete(key);
  queryCache.set(key, { data, cachedAt: Date.now() });
  if (queryCache.size > queryCacheLimit) {
    queryCache.delete(queryCache.keys().next().value);
  }
}

export function useConnectQuery(path, revision = 0) {
  const { request, me } = useConnect();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const key = `${path || ''}:${revision}:${retry}`;
  const cacheKey = path ? `${me.role}:${me.id}:${path}` : null;
  useEffect(() => {
    const version = ++generation.current;
    if (!path) return;
    const controller = new AbortController();
    request(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) {
        writeQueryCache(cacheKey, data);
        setState({ cacheKey, key, path, data, version });
      }
    }).catch(error => {
      if (!controller.signal.aborted) setState({ cacheKey, key, path, error, version });
    });
    return () => controller.abort();
  }, [path, key, cacheKey, request]);
  const cached = path ? readQueryCache(cacheKey) : null;
  const current = state?.cacheKey === cacheKey
    ? state
    : cached !== null
      ? { cacheKey, path, data: cached }
      : null;
  async function more() {
    if (!current?.data?.nextCursor || current.moreBusy) return;
    const version = generation.current;
    setState(previous => ({
      ...(previous?.cacheKey === cacheKey ? previous : current),
      moreBusy: true,
      moreError: null,
    }));
    try {
      const page = await request(`${path}${path.includes('?') ? '&' : '?'}before=${current.data.nextCursor}`);
      if (generation.current === version) setState(previous => {
        const base = previous?.cacheKey === cacheKey ? previous : current;
        const data = { ...page, items: [...base.data.items, ...page.items.filter(item => !base.data.items.some(old => old.id === item.id))] };
        writeQueryCache(cacheKey, data);
        return { ...base, moreBusy: false, data };
      });
    } catch (error) {
      if (generation.current === version) setState(previous => ({
        ...(previous?.cacheKey === cacheKey ? previous : current),
        moreBusy: false,
        moreError: error,
      }));
    }
  }
  function replace(item) {
    setState(previous => {
      const base = previous?.cacheKey === cacheKey ? previous : current;
      if (base?.data?.items) {
        const data = { ...base.data, items: base.data.items.map(old => old.id === item.id ? item : old) };
        writeQueryCache(cacheKey, data);
        return { ...base, data };
      }
      if (base?.data?.id === item.id) {
        writeQueryCache(cacheKey, item);
        return { ...base, data: item };
      }
      return previous;
    });
  }
  return { data: current?.data, error: current?.error, loading: !!path && current?.key !== key, more, moreBusy: current?.moreBusy, moreError: current?.moreError, replace, reload: () => setRetry(value => value + 1) };
}

export function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
export function roleLabel(profile) { return profile.headline || (profile.status === 'admin' ? 'Pengurus Himpunan' : profile.status === 'alumni' ? 'Alumni Teknik Elektro' : 'Mahasiswa Teknik Elektro'); }
export function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

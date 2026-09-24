import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const ConnectContext = createContext(null);
export const useConnect = () => useContext(ConnectContext);

export function useConnectQuery(path, revision = 0) {
  const { request } = useConnect();
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const key = `${path || ''}:${revision}:${retry}`;
  useEffect(() => {
    const version = ++generation.current;
    if (!path) return;
    const controller = new AbortController();
    request(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ key, path, data, version });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, path, error, version });
    });
    return () => controller.abort();
  }, [path, key, request]);
  const current = state?.path === path ? state : null;
  async function more() {
    if (!current?.data?.nextCursor || current.moreBusy) return;
    const version = generation.current;
    setState(previous => ({ ...previous, moreBusy: true, moreError: null }));
    try {
      const page = await request(`${path}${path.includes('?') ? '&' : '?'}before=${current.data.nextCursor}`);
      if (generation.current === version) setState(previous => ({ ...previous, moreBusy: false, data: { ...page, items: [...previous.data.items, ...page.items.filter(item => !previous.data.items.some(old => old.id === item.id))] } }));
    } catch (error) {
      if (generation.current === version) setState(previous => ({ ...previous, moreBusy: false, moreError: error }));
    }
  }
  function replace(item) {
    setState(previous => {
      if (previous?.data?.items) return { ...previous, data: { ...previous.data, items: previous.data.items.map(old => old.id === item.id ? item : old) } };
      return previous?.data?.id === item.id ? { ...previous, data: item } : previous;
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

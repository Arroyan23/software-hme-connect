export function connectDestination(search) {
  const value = new URLSearchParams(search).get('next');
  return value && /^\/ime-connect(?:[/?]|$)/.test(value) && !/[\\\r\n]/.test(value) ? value : null;
}
export function authLink(path, search) {
  const next = connectDestination(search);
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

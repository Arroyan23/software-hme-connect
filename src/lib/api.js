let csrf;
let csrfRequest;
export async function api(path, options = {}, retried = false) {
  const method=options.method || 'GET';
  const headers={ ...options.headers };
  if (!['GET','HEAD'].includes(method)) {
    if (!csrf) {
      csrfRequest ||= fetch('/api/auth/csrf',{ credentials:'same-origin' }).then(async r => { if (!r.ok) throw new Error('Gagal membuka sesi'); return r.json(); }).finally(() => { csrfRequest=null; });
      csrf=(await csrfRequest).token;
    }
    headers['x-csrf-token']=csrf;
  }
  const isForm=options.body instanceof FormData;
  if (options.body && !isForm) headers['Content-Type']='application/json';
  const response=await fetch(`/api${path}`,{ ...options,method,headers,credentials:'same-origin',body:options.body ? (isForm ? options.body : JSON.stringify(options.body)) : undefined });
  const data=await response.json().catch(() => ({ message:'Respons server tidak valid' }));
  if (!retried && response.status === 403 && data.message === 'Sesi formulir kedaluwarsa. Muat ulang halaman.') {
    csrf=undefined;
    return api(path, options, true);
  }
  if (!response.ok) { const error=new Error(data.message || 'Permintaan gagal'); error.status=response.status; if (response.status === 403) csrf=undefined; throw error; }
  if (data.csrf) csrf=data.csrf;
  if (path === '/auth/logout') csrf=undefined;
  return data;
}

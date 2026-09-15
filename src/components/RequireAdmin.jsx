import { useEffect,useState } from 'react';
import { Navigate } from 'react-router';
import { api } from '../lib/api';

export default function RequireAdmin({ children }) {
  const [state,setState]=useState({ loading:true });
  useEffect(() => { let active=true; api('/auth/me').then(user => { if(active) setState({user}); }).catch(error => { if(active) setState({error}); }); return () => { active=false; }; },[]);
  if (state.loading) return <p className="pt-28 text-center">Memeriksa sesi...</p>;
  if (state.error?.status === 401) return <Navigate to="/login" replace />;
  if (state.error) return <p role="alert" className="pt-28 text-center">{state.error.message}</p>;
  return children;
}

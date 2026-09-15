import { createContext, useContext } from 'react';
export const SiteContext=createContext(null);
export const useSite=() => useContext(SiteContext);

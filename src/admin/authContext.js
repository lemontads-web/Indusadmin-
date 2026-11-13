import { createContext, useContext } from 'react';

// status: 'loading' | 'signedOut' | 'noAccess' | 'error' (couldn't check — connection problem) | 'ready'
// role:   'owner' | 'editor' | 'sales' | null
export const AdminAuthContext = createContext({ status: 'loading', session: null, role: null });
export const useAdminAuth = () => useContext(AdminAuthContext);

export const canEditContent = (role) => role === 'owner' || role === 'editor';
export const isOwner = (role) => role === 'owner';

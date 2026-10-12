import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { isFirebaseConfigured } from '../services/firebase';

export function useAuth() {
  // undefined = still loading, null = signed out, object = signed in
  const [user,    setUser]    = useState(isFirebaseConfigured ? undefined : null);
  const [error,   setError]   = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  async function signIn(email, password) {
    setPending(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential'  ? 'Incorrect email or password.' :
        err.code === 'auth/user-not-found'       ? 'No account found for that email.' :
        err.code === 'auth/wrong-password'       ? 'Incorrect password.' :
        err.code === 'auth/too-many-requests'    ? 'Too many attempts — try again later.' :
        err.code === 'auth/configuration-not-found' ? 'Auth not enabled yet in Firebase Console.' :
        'Sign-in failed. Check your connection and try again.';
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  function logOut() {
    signOut(getAuth());
  }

  return { user, signIn, logOut, error, pending };
}

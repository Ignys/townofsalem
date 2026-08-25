import {
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type Unsubscribe,
  type User,
} from "firebase/auth";

const pendingSignIns = new WeakMap<Auth, Promise<User>>();

export function observeAuthState(
  auth: Auth,
  onChange: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, onChange);
}

export function ensureAnonymousUser(auth: Auth): Promise<User> {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  const pendingSignIn = pendingSignIns.get(auth);

  if (pendingSignIn) {
    return pendingSignIn;
  }

  const signInRequest = signInAnonymously(auth).then(
    ({ user }) => user,
  );

  pendingSignIns.set(auth, signInRequest);

  const clearPendingRequest = () => {
    if (pendingSignIns.get(auth) === signInRequest) {
      pendingSignIns.delete(auth);
    }
  };

  void signInRequest.then(clearPendingRequest, clearPendingRequest);

  return signInRequest;
}

export function createAnonymousAuthError(cause: unknown): Error {
  const detail =
    cause instanceof Error ? cause.message : "Unknown authentication error.";

  return new Error(`Anonymous authentication failed: ${detail}`);
}

import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  import.meta.env.VITE_FIREBASE_API_KEY
);

let app;
let db = null;
let storage = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Helper to create a user account in Firebase Auth using a secondary app instance.
// This is critical so the Manager's active session is not terminated/overwritten.
export const createAuthAccountSecondary = async (email, password) => {
  if (!isFirebaseConfigured) {
    // Generate a mock UID for LocalStorage/fallback mode
    return { uid: "mock_uid_" + Math.random().toString(36).substring(2, 9) };
  }
  
  // Create a unique temporary app name
  const tempAppName = "temp_auth_app_" + Math.random().toString(36).substring(2, 9);
  let tempApp;
  try {
    tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    return userCredential.user;
  } finally {
    if (tempApp) {
      await deleteApp(tempApp);
    }
  }
};

export { db, storage, auth };

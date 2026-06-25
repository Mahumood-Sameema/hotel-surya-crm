import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/config";
import { getUserProfile, logAction, bootstrapAdminProfile } from "../services/pmsDbService";

const PRIMARY_ADMIN_EMAIL = import.meta.env.VITE_PRIMARY_ADMIN_EMAIL || "admin@suryaresidency.com";

const PmsAuthContext = createContext();

export const PmsAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Listen to Firebase Auth state change events
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      setAuthError("");
      
      if (authUser) {
        try {
          // Fetch associated user profile from Firestore users/{uid}
          let profile = await getUserProfile(authUser.uid);
          
          if (!profile) {
            if (authUser.email === PRIMARY_ADMIN_EMAIL) {
              try {
                profile = await bootstrapAdminProfile(authUser.uid, authUser.email);
              } catch (bootstrapErr) {
                console.error("Failed to bootstrap admin profile:", bootstrapErr);
                setAuthError("Failed to bootstrap admin profile. Please contact the system administrator.");
                await signOut(auth);
                setUser(null);
                setLoading(false);
                return;
              }
            } else {
              console.error("Profile document not found in Firestore for UID:", authUser.uid);
              console.warn(`%c[Surya Residency CRM Dev Helper] Authenticated User UID: ${authUser.uid}. Please create a document in your Firestore 'users' collection with this Document ID.`, "color: #eab308; font-weight: bold; padding: 4px; border: 1px solid #eab308; border-radius: 4px;");
              setAuthError("Staff profile not found. Please contact the administrator.");
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }
          }
          
          if (profile) {
            if (profile.status !== "Active") {
              console.warn(`User status is ${profile.status}. Sign-in blocked.`);
              setAuthError("Your account is not active. Please contact the administrator.");
              await signOut(auth);
              setUser(null);
            } else {
              // Profile is active and verified, save to session
              const sessionUser = {
                userId: authUser.uid,
                uid: authUser.uid,
                fullName: profile.fullName,
                email: authUser.email,
                phone: profile.phone || "",
                role: profile.role,
                status: profile.status,
                createdAt: profile.createdAt
              };
              setUser(sessionUser);
            }
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
          setAuthError("Failed to verify user profile.");
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;
      
      // Load Firestore profile to double-check status right after signing in
      let profile = await getUserProfile(authUser.uid);
      if (!profile) {
        if (authUser.email === PRIMARY_ADMIN_EMAIL) {
          try {
            profile = await bootstrapAdminProfile(authUser.uid, authUser.email);
          } catch (bootstrapErr) {
            console.error("Failed to bootstrap admin profile:", bootstrapErr);
            await signOut(auth);
            throw new Error("Failed to bootstrap admin profile. Please contact the system administrator.");
          }
        } else {
          console.warn(`%c[Surya Residency CRM Dev Helper] Authenticated User UID: ${authUser.uid}. Please create a document in your Firestore 'users' collection with this Document ID.`, "color: #eab308; font-weight: bold; padding: 4px; border: 1px solid #eab308; border-radius: 4px;");
          await signOut(auth);
          throw new Error("Staff profile not found. Please contact the administrator.");
        }
      }
      
      if (profile.status !== "Active") {
        await signOut(auth);
        throw new Error("Your account is not active. Please contact the administrator.");
      }

      const sessionUser = {
        userId: authUser.uid,
        uid: authUser.uid,
        fullName: profile.fullName,
        email: authUser.email,
        phone: profile.phone || "",
        role: profile.role,
        status: profile.status,
        createdAt: profile.createdAt
      };
      
      await logAction(sessionUser, "Login", "Auth", sessionUser.userId, "", "Successful login session start");
      return sessionUser;
    } catch (error) {
      console.error("Login failure:", error);
      let cleanMsg = error.message;
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        cleanMsg = "Invalid email or password credentials.";
      }
      setAuthError(cleanMsg);
      throw new Error(cleanMsg);
    }
  };

  const logout = async () => {
    if (user) {
      await logAction(user, "Logout", "Auth", user.userId, "", "Successful logout session end");
    }
    setUser(null);
    setAuthError("");
    await signOut(auth);
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser) return { success: false, message: "No active user session." };

    try {
      // Re-authenticate user first for security before changing password
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      await logAction(user, "Password Changed", "Auth", user.userId, "", "Password updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Password change failure:", error);
      let msg = error.message;
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        msg = "Current password credentials do not match.";
      }
      return { success: false, message: msg };
    }
  };

  const resetUserPassword = async (email) => {
    if (!isFirebaseConfigured) {
      console.log(`[Mock Auth] Password reset email triggered for ${email}`);
      return { success: true, message: "Password reset email triggered (mock mode)." };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Password reset failure:", error);
      return { success: false, message: error.message };
    }
  };

  const hasPermission = (moduleOrAction) => {
    if (!user) return false;
    if (user.role === "Manager") return true;

    // Strict permissions block for Receptionists
    const receptionistDeny = [
      "admin",
      "admin/users",
      "admin/roles",
      "admin/settings",
      "admin/audit-logs",
      "reports/revenue",
      "reports/payments",
      "bookings/delete",
      "invoices/edit",
      "payments/void"
    ];

    return !receptionistDeny.includes(moduleOrAction);
  };

  return (
    <PmsAuthContext.Provider value={{ user, loading, authError, login, logout, changeUserPassword, resetUserPassword, hasPermission }}>
      {children}
    </PmsAuthContext.Provider>
  );
};

export const usePmsAuth = () => {
  const context = useContext(PmsAuthContext);
  if (!context) {
    throw new Error("usePmsAuth must be used within a PmsAuthProvider");
  }
  return context;
};

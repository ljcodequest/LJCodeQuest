"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.warn("AuthContext running in offline/mock mode.");
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          // Clear session cookie
          await fetch("/api/auth/session", { method: "DELETE" });
        } else {
          setUser(currentUser);
          // Set session cookie
          const token = await currentUser.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });
          
          // Sync user with MongoDB
          await fetch("/api/auth/sync", {
            method: "POST",
          });
        }
      } catch (error) {
        console.error("Error syncing auth session:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error signing out from Firebase:", error);
    } finally {
      // Always clear server session cookie, even if Firebase sign-out fails.
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

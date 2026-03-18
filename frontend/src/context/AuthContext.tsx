"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { apiGet } from "@/lib/api";

interface Org {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  org: Org | null;
  orgs: Org[];
  loading: boolean;
  logout: () => Promise<void>;
  switchOrg: (org: Org) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  org: null,
  orgs: [],
  loading: true,
  logout: async () => {},
  switchOrg: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const fetchedOrgs = await apiGet<Org[]>("/orgs");
          setOrgs(fetchedOrgs);
          setOrg(fetchedOrgs[0] ?? null);
        } catch {
          setOrgs([]);
          setOrg(null);
        }
      } else {
        setOrgs([]);
        setOrg(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    await signOut(auth);
    setOrg(null);
    setOrgs([]);
    router.push("/sign-in");
  }

  function switchOrg(newOrg: Org) {
    setOrg(newOrg);
  }

  return (
    <AuthContext.Provider value={{ user, loading, org, orgs, logout, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

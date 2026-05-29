import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

interface SessionStore {
  session: Session | null | undefined; // undefined = loading
  setSession: (s: Session | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: undefined,
  setSession: (session) => set({ session }),
}));

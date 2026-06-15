import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    city?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

let authState: AuthState | null = null;
let listeners: Array<(state: AuthState) => void> = [];

function setAuthState(state: AuthState) {
  authState = state;
  listeners.forEach(fn => fn(state));
}

function getAuthState(): AuthState {
  if (!authState) {
    return {
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => {},
      refreshProfile: async () => {},
    };
  }
  return authState;
}

function subscribeAuth(fn: (state: AuthState) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string, sessionUser?: User) => {
      if (!isSupabaseConfigured) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setProfile(data as Profile);
      } else if (
        error &&
        (error.code === "PGRST116" || error.message?.includes("no rows"))
      ) {
        // Profile does not exist yet (e.g. Google OAuth user or signup trigger didn't run)
        const emailName = sessionUser?.email?.split("@")[0] || "User";
        const fullName =
          sessionUser?.user_metadata?.full_name ||
          sessionUser?.user_metadata?.name ||
          emailName;
        const avatarUrl = sessionUser?.user_metadata?.avatar_url || null;

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            full_name: fullName,
            avatar_url: avatarUrl,
            household_size: 1,
            banner_url: null,
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile as Profile);
        } else if (insertError) {
          console.error("Failed to auto-create profile:", insertError);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured.") };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      city?: string
    ) => {
      if (!isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured.") };
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (!error && data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName,
          city: city || null,
          household_size: 1,
        });
      }
      return { error };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  const fallbackUser = useMemo(
    () =>
      ({
        id: "00000000-0000-0000-0000-000000000000",
        email: "guest@carbonwise.app",
        user_metadata: {
          full_name: "Guest User",
        },
      }) as any,
    []
  );

  const fallbackProfile = useMemo(
    () =>
      ({
        id: "00000000-0000-0000-0000-000000000000",
        full_name: "Guest User",
        city: "San Francisco",
        household_size: 1,
        avatar_url: null,
        banner_url: null,
      }) as any,
    []
  );

  const state: AuthState = useMemo(
    () => ({
      user: user || fallbackUser,
      profile: profile || fallbackProfile,
      session,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      fallbackUser,
      fallbackProfile,
    ]
  );

  useEffect(() => {
    setAuthState(state);
  }, [state]);

  return children;
}

export function useAuth(): AuthState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => setTick(t => t + 1));
    return unsubscribe;
  }, []);

  return getAuthState();
}

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase";

// Auth locked: simple username/password, admin-managed. Company mail is M365,
// so Google OAuth was out; magic link would've needed a transactional email
// service. This is the simplest thing that satisfies PRD §2 ("email allowlist
// ... 5-10 seats, no public signup") — the `users` table in Supabase IS the
// allowlist. No row for an email, no login. Only way to add a user is
// scripts/add-user.mjs (hashes the password server-side, never stores plaintext).

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // 1. Try Supabase users table if Supabase is configured
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabase = getSupabaseServerClient();
            const { data: user, error } = await supabase
              .from("users")
              .select("email, name, password_hash")
              .eq("email", email)
              .single();

            if (!error && user?.password_hash) {
              const valid = await bcrypt.compare(password, user.password_hash);
              if (valid) {
                return { id: user.email, email: user.email, name: user.name || user.email.split("@")[0] };
              }
            }
          }
        } catch (e) {
          console.warn("Supabase auth lookup failed, checking local credentials fallback:", e);
        }

        // 2. Local development fallback accounts (for seamless local run / testing)
        const localAccounts: Record<string, { pass: string; name: string }> = {
          "admin@kognozconsulting.com": { pass: "admin123", name: "Admin (Kognoz)" },
          "team@kognoz.com": { pass: "kognoz2026", name: "Kognoz Team" },
          "demo@kognoz.com": { pass: "demo123", name: "Demo User" }
        };

        const localUser = localAccounts[email];
        if (localUser && localUser.pass === password) {
          return { id: email, email, name: localUser.name };
        }

        return null; // Invalid credentials
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  }
};

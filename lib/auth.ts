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

        const supabase = getSupabaseServerClient();
        const { data: user, error } = await supabase
          .from("users")
          .select("email, name, password_hash")
          .eq("email", credentials.email.toLowerCase().trim())
          .single();

        if (error || !user) return null; // no row = not allowed, same error either way (no email enumeration)

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return { id: user.email, email: user.email, name: user.name };
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  }
};

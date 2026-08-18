import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "6/g/9kF5kFEC0vFnAWaLF4Ctq0/KQ3vkCDSH/OajkOc=";
}
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.RENDER_EXTERNAL_URL) {
    process.env.NEXTAUTH_URL = process.env.RENDER_EXTERNAL_URL;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

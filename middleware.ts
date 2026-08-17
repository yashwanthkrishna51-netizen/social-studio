import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "6/g/9kF5kFEC0vFnAWaLF4Ctq0/KQ3vkCDSH/OajkOc=",
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - login (the sign in page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - brand (public brand assets)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|login|_next/static|_next/image|brand|favicon.ico).*)"
  ]
};

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Personal Access",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.password === process.env.PERSONAL_PASSWORD) {
          try {
            await dbConnect();
            let user = await User.findOne({ email: "admin@personal.app" });
            if (!user) {
              user = await User.create({
                email: "admin@personal.app",
                name: "Admin",
              });
            }
            return { id: user._id.toString(), name: user.name, email: user.email };
          } catch (error) {
            console.error("MongoDB Connection Error in Auth:", error);
            // Fallback user if DB fails, just so you can login and see the dashboard
            return { id: "offline-user-id", name: "Admin (Offline Mode)", email: "admin@personal.app" };
          }
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};

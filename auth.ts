import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const user = await User.findOne({ email: credentials?.email });
        if (!user) throw new Error("Invalid credentials");

        const isMatch = await bcrypt.compare(
          (credentials?.password as string) || "",
          user.passwords
        );
        if (!isMatch) throw new Error("Invalid credentials");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          restaurantId: user.restaurantId.toString(),
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.restaurantId = user.restaurantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.restaurantId = token.restaurantId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/backoffice/login",
  },
});

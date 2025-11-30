import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import Restaurant from "@/models/restaurants";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const userFound = await User.findOne({
          $or: [
            { username: credentials?.username },
            { email: credentials?.username },
          ],
        }).select("+password");
        if (!userFound) throw new Error("Usuario o contraseña incorrectos");

        const isPasswordValid = await bcrypt.compare(
          credentials!.password,
          userFound.password
        );

        if (!isPasswordValid)
          throw new Error("Usuario o contraseña incorrectos");

        const user = userFound.toObject();
        delete user.password;

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      // Solo si es la primera vez (cuando el usuario inicia sesión)
      if (user) {
        token.restaurantId = user.restaurantId?.toString();
        token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

        // 👇 Obtenemos el slug del restaurante
        if (user.restaurantId) {
          await connectToDatabase();
          const restaurant = await Restaurant.findById(
            user.restaurantId
          ).select("slug");
          if (restaurant) {
            token.slug = restaurant.slug;
            token.role = user.role;
          }
        } // expira en 1 día
      }

      // Si el token ya existe y expira pronto, no lo refresques cada vez
      if (!token.exp) {
        token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.restaurantId = token.restaurantId as string;
        session.user.slug = token.slug as string | null | undefined;
        session.user.role = token.role as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/backoffice/login",
  },
};

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import Restaurant from "@/models/restaurants";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

function getUserIdFromAuthUser(user: unknown): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const record = user as Record<string, unknown>;

  const id = record.id;
  if (typeof id === "string" && id.length > 0) return id;

  // Mongoose documents often expose `_id`
  const _id = record._id;
  if (typeof _id === "string" && _id.length > 0) return _id;
  if (typeof _id === "object" && _id && "toString" in _id) {
    const maybeToString = (_id as { toString?: unknown }).toString;
    if (typeof maybeToString === "function") {
      const value = (_id as { toString: () => string }).toString();
      if (typeof value === "string" && value.length > 0) return value;
    }
  }

  return undefined;
}

function getStringFieldFromUnknown(
  obj: unknown,
  key: string
): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

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

        if (!userFound.isActive) {
          throw new Error("Usuario o contraseña incorrectos");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials!.password,
          userFound.password
        );

        if (!isPasswordValid)
          throw new Error("Usuario o contraseña incorrectos");

        const userObject = userFound.toObject();
        const id = userFound._id.toString();
        delete (userObject as { password?: unknown }).password;

        // NextAuth espera un `id` string.
        // Mantenerlo explícito evita depender de `sub` implícito.
        return { ...userObject, id, username: userFound.username };
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
        token.id = String(getUserIdFromAuthUser(user) ?? token.sub ?? "");
        token.username = getStringFieldFromUnknown(user, "username") ?? null;
        token.restaurantId = user.restaurantId?.toString();
        token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
        token.iat = Math.floor(Date.now() / 1000);

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
      const userId = token.id || token.sub || "";

      if (!userId) {
        if (session.user) {
          session.user.id = "";
          session.user.username = null;
          session.user.restaurantId = undefined;
          session.user.slug = null;
          session.user.role = null;
        }
        return session;
      }

      // Invalida sesiones antiguas tras cambio de contraseña (seguridad fuerte)
      await connectToDatabase();
      const user = await User.findById(userId).select(
        "passwordChangedAt isActive restaurantId"
      );

      if (!user?.isActive) {
        if (session.user) {
          session.user.id = userId;
          session.user.username = token.username ?? null;
          session.user.restaurantId = undefined;
          session.user.slug = null;
          session.user.role = null;
        }
        return session;
      }

      if (
        token.restaurantId &&
        user.restaurantId?.toString() !== token.restaurantId
      ) {
        if (session.user) {
          session.user.id = userId;
          session.user.username = token.username ?? null;
          session.user.restaurantId = undefined;
          session.user.slug = null;
          session.user.role = null;
        }
        return session;
      }

      const tokenIatSeconds = typeof token.iat === "number" ? token.iat : null;
      const tokenIatMs = tokenIatSeconds ? tokenIatSeconds * 1000 : null;

      if (user.passwordChangedAt) {
        // Si no tenemos iat (no debería pasar), forzamos re-login.
        if (!tokenIatMs) {
          if (session.user) {
            session.user.id = userId;
            session.user.username = token.username ?? null;
            session.user.restaurantId = undefined;
            session.user.slug = null;
            session.user.role = null;
          }
          return session;
        }

        if (tokenIatMs < user.passwordChangedAt.getTime()) {
          if (session.user) {
            session.user.id = userId;
            session.user.username = token.username ?? null;
            session.user.restaurantId = undefined;
            session.user.slug = null;
            session.user.role = null;
          }
          return session;
        }
      }

      if (session.user) {
        session.user.id = userId;
        session.user.username = token.username ?? null;
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

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

        return { ...userObject, id, username: userFound.username };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // Update session every hour
  },
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial Sign In
      if (user) {
        token.id = String(getUserIdFromAuthUser(user) ?? token.sub ?? "");
        token.username = getStringFieldFromUnknown(user, "username") ?? null;
        token.restaurantId = user.restaurantId?.toString();
        token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
        token.iat = Math.floor(Date.now() / 1000);

        if (user.restaurantId) {
          await connectToDatabase();
          // Fetch Restaurant to get latest slug and subscription status
          const restaurant = await Restaurant.findById(
            user.restaurantId
          ).select("slug subscription");

          if (restaurant) {
            token.slug = restaurant.slug;
            // Access nested subscription properties with fallbacks
            token.subscriptionStatus =
              restaurant.subscription?.status || "active";
            token.subscriptionPlan =
              restaurant.subscription?.plan || "standard";
            token.role = user.role;
          }
        }
      }

      // Ensure expiration is set
      if (!token.exp) {
        token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
      }

      return token;
    },
    async session({ session, token }) {
      const userId = token.id || token.sub || "";

      // Helper to clear session data (keeps user ID but removes permissions)
      const clearSession = () => {
        if (session.user) {
          session.user.id = userId;
          session.user.username = token.username ?? null;

          // Clear privileged data
          session.user.restaurantId = undefined;
          session.user.slug = null;
          session.user.role = null;
          session.user.subscriptionStatus = null;
          session.user.subscriptionPlan = null;
        }
        return session;
      };

      if (!userId) {
        return clearSession();
      }

      await connectToDatabase();
      const user = await User.findById(userId).select(
        "passwordChangedAt isActive restaurantId"
      );

      // Validate User Status
      if (!user?.isActive) return clearSession();

      // Validate Restaurant Association matches Token
      if (
        token.restaurantId &&
        user.restaurantId?.toString() !== token.restaurantId
      ) {
        return clearSession();
      }

      // Validate Token vs Password Change Time
      const tokenIatSeconds = typeof token.iat === "number" ? token.iat : null;
      const tokenIatMs = tokenIatSeconds ? tokenIatSeconds * 1000 : null;

      if (user.passwordChangedAt) {
        if (!tokenIatMs) return clearSession();
        if (tokenIatMs < user.passwordChangedAt.getTime()) {
          return clearSession();
        }
      }

      // Populate Session with validated data
      if (session.user) {
        session.user.id = userId;
        session.user.username = token.username ?? null;
        session.user.restaurantId = token.restaurantId as string;
        session.user.slug = token.slug as string | null | undefined;
        session.user.role = token.role as string | null | undefined;
        session.user.subscriptionStatus = token.subscriptionStatus as
          | string
          | null
          | undefined;
        session.user.subscriptionPlan = token.subscriptionPlan as
          | string
          | null
          | undefined;
      }

      return session;
    },
  },
  pages: {
    signIn: "/backoffice/login",
  },
};

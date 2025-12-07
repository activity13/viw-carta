import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      restaurantId?: string;
      slug?: string | null;
      role?: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    restaurantId?: string;
    role?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    restaurantId?: string;
    role?: string | null;
    slug?: string | null;
  }
}

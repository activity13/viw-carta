"use client";
import React from "react";
import { useSession } from "next-auth/react";
import NavBar from "../navBar";

export default function NavBarWrapper() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (!session) return null;
  return <NavBar />;
}

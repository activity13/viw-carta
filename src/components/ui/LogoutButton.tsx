"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/backoffice/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-800 transition"
    >
      <LogOut />
    </button>
  );
}

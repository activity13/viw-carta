import { protectPage } from "@/lib/server-guard";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  await protectPage("manage_texts");
  return <MessagesClient />;
}
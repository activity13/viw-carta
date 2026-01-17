import { protectPage } from "@/lib/server-guard";
import TranslationClient from "./TranslationClient";

export default async function TranslationPage() {
  await protectPage("manage_translations");
  return <TranslationClient />;
}

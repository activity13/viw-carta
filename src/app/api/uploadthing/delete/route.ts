import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    await requireAuth("staff");

    const { url } = await req.json();
    if (!url) {
      return new NextResponse("URL is required", { status: 400 });
    }

    // Extract key from URL (https://utfs.io/f/KEY)
    const key = url.split("/").pop();
    if (!key) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    await utapi.deleteFiles(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return handleAuthError(error);
  }
}

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");

    const body = await req.json().catch(() => ({}));
    const { slug, secret: bodySecret } = body;

    const secret = querySecret || bodySecret;

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { revalidated: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    revalidateTag(`menu-${slug}`);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error("Error revalidating menu:", err);
    return NextResponse.json(
      { revalidated: false, error: String(err) },
      { status: 500 }
    );
  }
}

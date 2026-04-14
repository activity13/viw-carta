import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import CashSession from "@/models/cashSession";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // allows ?status=open

    const filter: Record<string, unknown> = { restaurantId: session.user.restaurantId };
    if (status) {
      filter.status = status;
    }

    const cashSessions = await CashSession.find(filter)
      .sort({ openedAt: -1 })
      .populate("openedByUserId", "fullName username")
      .populate("closedByUserId", "fullName username");

    return NextResponse.json({ cashSessions });
  } catch (error: unknown) {
    console.error("Error fetching cash sessions:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const serverSession = await getServerSession(authOptions);

    if (
      !serverSession ||
      !["admin", "superadmin"].includes(serverSession.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { startingCash = 0, notes = "" } = body;

    // Check if there's already an open session
    const existingOpenSession = await CashSession.findOne({
      restaurantId: serverSession.user.restaurantId,
      status: "open",
    });

    if (existingOpenSession) {
      return NextResponse.json(
        { error: "A session is already open. Close it first." },
        { status: 400 },
      );
    }

    const newSession = await CashSession.create({
      restaurantId: serverSession.user.restaurantId,
      openedByUserId: serverSession.user.id,
      status: "open",
      openedAt: new Date(),
      startingCash: Number(startingCash) || 0,
      notes,
    });

    return NextResponse.json({ cashSession: newSession }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A session is already open." },
        { status: 400 },
      );
    }
    console.error("Error opening cash session:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

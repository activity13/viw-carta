import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Meal from "@/models/meals";
import { connectToDatabase } from "@/lib/mongodb";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectToDatabase();

    // Bulk write for performance
    const operations = items.map((item: { _id: string; order: number }) => ({
      updateOne: {
        filter: { _id: item._id, restaurantId: session.user.restaurantId },
        update: { $set: { "display.order": item.order } },
      },
    }));

    if (operations.length > 0) {
      await Meal.bulkWrite(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering meals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb.ts";
import VariantTemplate from "@/models/VariantTemplate";

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 },
      );
    }

    const templates = await VariantTemplate.find({ restaurantId }).sort({
      createdAt: -1,
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.restaurantId || !body.title) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const template = await VariantTemplate.create(body);
    console.log("🚀 ~ route.js:40 ~ POST ~ template:", template);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

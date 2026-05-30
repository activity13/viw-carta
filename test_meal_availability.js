import mongoose from "mongoose";
import Meal from "./src/models/meals.js";
import { connectToDatabase } from "./src/lib/mongodb.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  await connectToDatabase();
  const meal = await Meal.findOne({ "availability.isAvailable": false }).select("name availability");
  if (!meal) {
    console.log("No meals found with isAvailable: false");
  } else {
    console.log("Meal found with isAvailable: false:");
    console.log(JSON.stringify(meal.availability, null, 2));
  }
  process.exit(0);
}
run();

import mongoose from "mongoose";
import Meal from "./src/models/meals.js";
import { connectToDatabase } from "./src/lib/mongodb.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  await connectToDatabase();
  const meals = await Meal.find({ status: "active", "display.showInMenu": true }).select("name availability");
  const unavailable = meals.filter(m => m.availability && m.availability.isAvailable === false);
  console.log(`Total active meals: ${meals.length}`);
  console.log(`Total unavailable meals: ${unavailable.length}`);
  if (unavailable.length > 0) {
    console.log("Sample unavailable meal:", JSON.stringify(unavailable[0], null, 2));
  } else {
    // Check if any meals have schedule completely off
    const noSchedule = meals.filter(m => {
        if (!m.availability || !m.availability.schedule) return false;
        const days = Object.keys(m.availability.schedule).filter(d => !["$init"].includes(d));
        return days.length > 0 && days.every(d => m.availability.schedule[d].isAvailable === false);
    });
    console.log(`Total meals with all days off: ${noSchedule.length}`);
    if (noSchedule.length > 0) {
        console.log("Sample meal with all days off:", JSON.stringify(noSchedule[0], null, 2));
    }
  }
  process.exit(0);
}
run();

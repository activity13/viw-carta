import fs from "fs";
import path from "path";
import { connectToDatabase } from "../src/lib/mongodb";
import VariantTemplate from "../src/models/VariantTemplate.js";

// Manual .env loading
const envPath = path.resolve(process.cwd(), ".env.local");
const envPath2 = path.resolve(process.cwd(), ".env");

// @ts-expect-error herramienta de desarrollo. Ejecutar para listar las plantillas de variantes en la BD.
const loadEnv = (p) => {
  if (fs.existsSync(p)) {
    console.log(`Loading env from ${p}`);
    const content = fs.readFileSync(p, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ""); // Remove quotes
        process.env[key] = value;
      }
    });
  }
};

loadEnv(envPath2);
loadEnv(envPath); // Local overrides

async function run() {
  try {
    console.log("Connecting to DB...");
    await connectToDatabase();

    console.log("Querying VariantTemplates...");
    const templates = await VariantTemplate.find({});

    console.log(`Found ${templates.length} templates.`);
    templates.forEach((t) => {
      console.log("------------------------------------------------");
      console.log(`_id: ${t._id}`);
      console.log(`title: ${t.title}`);
      console.log(`restaurantId: ${t.restaurantId}`);
    });
    console.log("------------------------------------------------");
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

run();

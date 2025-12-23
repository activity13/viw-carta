import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UTApi } from "uploadthing/server";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";

const f = createUploadthing();
const utapi = new UTApi();

export const ourFileRouter = {
  // Ruta para imágenes de platos (Meals)
  mealImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) throw new Error("Unauthorized");
      return { restaurantId: session.user.restaurantId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Solo devolvemos la URL, no guardamos en DB aquí
      // El frontend se encargará de asociarla al plato
      console.log("Meal image uploaded for restaurant:", metadata.restaurantId);
      console.log("File URL:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) throw new Error("Unauthorized");

      return { restaurantId: session.user.restaurantId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Logo Upload complete for restaurant:",
        metadata.restaurantId
      );
      console.log("File URL:", file.ufsUrl);

      try {
        await connectToDatabase();
        const restaurant = await Restaurant.findById(metadata.restaurantId);

        if (restaurant) {
          const oldImageUrl = restaurant.image;

          // Si existe una imagen anterior y es de UploadThing, eliminarla
          if (
            oldImageUrl &&
            (oldImageUrl.includes("ufs.sh") ||
              oldImageUrl.includes("utfs.io") ||
              oldImageUrl.includes("uploadthing")) &&
            oldImageUrl !== file.ufsUrl
          ) {
            const key = oldImageUrl.split("/").pop();
            if (key) {
              await utapi.deleteFiles(key);
              console.log("Deleted old logo:", key);
            }
          }

          // Actualizar con la nueva imagen
          restaurant.image = file.ufsUrl;
          await restaurant.save();
        }
      } catch (error) {
        console.error("Error updating restaurant logo:", error);
      }
    }),

  frameUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) throw new Error("Unauthorized");

      return { restaurantId: session.user.restaurantId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Frame Upload complete for restaurant:",
        metadata.restaurantId
      );
      console.log("File URL:", file.ufsUrl);

      try {
        await connectToDatabase();
        const restaurant = await Restaurant.findById(metadata.restaurantId);

        if (restaurant) {
          const oldFrameUrl = restaurant.frameQR;

          // Si existe un frame anterior y es de UploadThing, eliminarlo
          if (
            oldFrameUrl &&
            (oldFrameUrl.includes("ufs.sh") ||
              oldFrameUrl.includes("utfs.io") ||
              oldFrameUrl.includes("uploadthing")) &&
            oldFrameUrl !== file.ufsUrl
          ) {
            const key = oldFrameUrl.split("/").pop();
            if (key) {
              await utapi.deleteFiles(key);
              console.log("Deleted old frame:", key);
            }
          }

          // Actualizar con el nuevo frame
          restaurant.frameQR = file.ufsUrl;
          await restaurant.save();
        }
      } catch (error) {
        console.error("Error updating restaurant frame:", error);
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

import mongoose from "mongoose";

/**
 * Executes a callback within a MongoDB transaction when available (replica set / Atlas).
 * Falls back to executing without a transaction on standalone instances (local dev).
 *
 * This ensures ACID guarantees in production while keeping local development functional.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>,
): Promise<T> {
  let mongoSession: mongoose.ClientSession | null = null;

  try {
    mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    const result = await fn(mongoSession);

    await mongoSession.commitTransaction();
    return result;
  } catch (error: unknown) {
    // If transactions aren't supported (standalone MongoDB), fallback to non-transactional
    const isTransactionError =
      error instanceof Error &&
      (error.message.includes("Transaction numbers are only allowed on a replica set") ||
        (error as Record<string, unknown>).codeName === "IllegalOperation");

    if (isTransactionError) {
      // Clean up the failed session
      if (mongoSession) {
        try {
          await mongoSession.abortTransaction();
        } catch {
          // Ignore abort errors on unsupported topology
        }
        mongoSession.endSession();
      }

      // Re-execute without transaction (development fallback)
      console.warn(
        "⚠️ MongoDB transactions not supported (standalone mode). Running without ACID guarantees.",
      );
      return fn(null);
    }

    // For any other error, abort and rethrow
    if (mongoSession) {
      try {
        await mongoSession.abortTransaction();
      } catch {
        // Ignore abort errors
      }
    }
    throw error;
  } finally {
    if (mongoSession) {
      mongoSession.endSession();
    }
  }
}

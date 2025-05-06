import { NextApiRequest, NextApiResponse } from "next";
import { createTodoTable } from "../../src/lib/dynamodb";

// API to set up DynamoDB table
// Note: In production, this should not be exposed as a public API but executed as a CLI script
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Prevent execution in production environment (security measure)
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed in production" });
  }

  try {
    const result = await createTodoTable();
    return res.status(200).json({
      message: "DynamoDB table created successfully",
      tableDescription: result.TableDescription
    });
  } catch (error: any) {
    // Return error message if table already exists
    if (error.name === "ResourceInUseException") {
      return res.status(400).json({
        error: "Table already exists",
        message: error.message
      });
    }

    console.error("Error setting up DynamoDB:", error);
    return res.status(500).json({
      error: "Failed to create DynamoDB table",
      message: error.message
    });
  }
}

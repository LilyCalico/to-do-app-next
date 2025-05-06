import { NextApiRequest, NextApiResponse } from "next";
import { TaskService } from "../../../src/models/task";
import { getSession } from "next-auth/react";

// API for reordering tasks
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let userId = process.env.TEST_USER_ID || "";

  // Perform authentication check except in development environment
  if (process.env.NODE_ENV !== "development") {
    // Get user ID from session
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user ID (using email as ID)
    userId = session.user.email as string;
  } else {
    console.log("開発環境: 認証をスキップします");
  }

  try {
    const { taskId, newPosition } = req.body;

    // Check required parameters
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    if (newPosition === undefined || typeof newPosition !== "number") {
      return res.status(400).json({ error: "New position must be a number" });
    }

    // Execute task reordering
    const success = await TaskService.reorderTask(userId, taskId, newPosition);

    if (!success) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

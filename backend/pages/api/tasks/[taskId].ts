import { NextApiRequest, NextApiResponse } from "next";
import { TaskService, TaskUpdate } from "../../../src/models/task";
import { getSession } from "next-auth/react";

// API for getting, updating, and deleting specific tasks
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    // Get task ID
    const { taskId } = req.query;

    if (!taskId || Array.isArray(taskId)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    // GET request - Get task details
    if (req.method === "GET") {
      const task = await TaskService.getTask(userId, taskId);

      if (!task) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.status(200).json(task);
    }

    // PUT request - Update task
    if (req.method === "PUT") {
      const { title, status, position } = req.body;

      // Return error if no fields to update
      if (
        title === undefined &&
        status === undefined &&
        position === undefined
      ) {
        return res.status(400).json({ error: "No fields to update" });
      }

      // Check if status is valid
      if (status && status !== "OPEN" && status !== "COMPLETED") {
        return res.status(400).json({ error: "Invalid status value" });
      }

      // Verify position is a number
      if (position !== undefined && typeof position !== "number") {
        return res.status(400).json({ error: "Position must be a number" });
      }

      const taskUpdate: TaskUpdate = {};

      if (title !== undefined) taskUpdate.title = title;
      if (status !== undefined) taskUpdate.status = status;
      if (position !== undefined) taskUpdate.position = position;

      // Update task
      const updatedTask = await TaskService.updateTask(
        userId,
        taskId,
        taskUpdate
      );

      if (!updatedTask) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.status(200).json(updatedTask);
    }

    // DELETE request - Delete task
    if (req.method === "DELETE") {
      const success = await TaskService.deleteTask(userId, taskId);

      if (!success) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.status(204).end();
    }

    // Other HTTP methods not allowed
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

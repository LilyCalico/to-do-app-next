import { NextApiRequest, NextApiResponse } from "next";
import { TaskService, TaskInput } from "../../../src/models/task";
import { getSession } from "next-auth/react";

// API for getting and creating task list
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
    // GET request - Get task list
    if (req.method === "GET") {
      // Get status from query parameters
      const { status } = req.query;

      // Check if status is valid
      const validStatus =
        status === "OPEN" || status === "COMPLETED" ? status : undefined;

      // Get task list
      const tasks = await TaskService.getTasks(userId, validStatus);

      // Sort
      const sortBy = (req.query.sortBy as string) || "position";
      const sortedTasks = [...tasks].sort((a, b) => {
        if (sortBy === "position") {
          return a.position - b.position;
        } else if (sortBy === "createdAt") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      });

      return res.status(200).json({ tasks: sortedTasks });
    }

    // POST request - Create new task
    if (req.method === "POST") {
      const { title, status } = req.body;

      // Title is required
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Check if status is valid
      if (status && status !== "OPEN" && status !== "COMPLETED") {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const taskInput: TaskInput = {
        title,
        ...(status && { status })
      };

      // Create task
      const newTask = await TaskService.createTask(userId, taskInput);

      return res.status(201).json(newTask);
    }

    // Other HTTP methods not allowed
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

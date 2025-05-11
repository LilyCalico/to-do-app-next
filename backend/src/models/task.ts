import {
  docClient,
  TABLE_NAME,
  USER_PREFIX,
  TASK_PREFIX,
  STATUS_PREFIX
} from "../lib/dynamodb";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Task type definition
export interface Task {
  taskId: string;
  title: string;
  status: "OPEN" | "COMPLETED";
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  status?: "OPEN" | "COMPLETED";
}

export interface TaskUpdate {
  title?: string;
  status?: "OPEN" | "COMPLETED";
  position?: number;
}

export class TaskService {
  // Get tasks based on user ID
  static async getTasks(
    userId: string,
    status?: "OPEN" | "COMPLETED"
  ): Promise<Task[]> {
    try {
      let params;

      if (status) {
        // Use GSI if status is specified
        params = {
          TableName: TABLE_NAME,
          IndexName: "StatusIndex",
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :statusPrefix)",
          ExpressionAttributeValues: {
            ":pk": `${USER_PREFIX}${userId}`,
            ":statusPrefix": `${STATUS_PREFIX}${status}`
          }
        };
      } else {
        // Get all tasks if status is not specified
        params = {
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :taskPrefix)",
          ExpressionAttributeValues: {
            ":pk": `${USER_PREFIX}${userId}`,
            ":taskPrefix": TASK_PREFIX
          }
        };
      }

      const result = await docClient.send(new QueryCommand(params));

      // Convert DynamoDB results to application model
      return (result.Items || []).map((item) => ({
        taskId: item.SK.replace(TASK_PREFIX, ""),
        title: item.title,
        status: item.status,
        position: item.position,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  }

  // Get specific task
  static async getTask(userId: string, taskId: string): Promise<Task | null> {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: {
          PK: `${USER_PREFIX}${userId}`,
          SK: `${TASK_PREFIX}${taskId}`
        }
      };

      const result = await docClient.send(new GetCommand(params));

      if (!result.Item) {
        return null;
      }

      return {
        taskId: result.Item.SK.replace(TASK_PREFIX, ""),
        title: result.Item.title,
        status: result.Item.status,
        position: result.Item.position,
        createdAt: result.Item.createdAt,
        updatedAt: result.Item.updatedAt
      };
    } catch (error) {
      console.error("Error fetching task:", error);
      throw error;
    }
  }

  // Create new task
  static async createTask(userId: string, taskInput: TaskInput): Promise<Task> {
    try {
      const taskId = uuidv4();
      const now = new Date().toISOString();

      // Get latest task to set position value
      const existingTasks = await this.getTasks(userId);
      const maxPosition =
        existingTasks.length > 0
          ? Math.max(...existingTasks.map((task) => task.position || 0))
          : 0;
      const position = maxPosition + 1000; // Set in units of 1000 to allow insertion between tasks

      const status = taskInput.status || "OPEN";

      const item = {
        PK: `${USER_PREFIX}${userId}`,
        SK: `${TASK_PREFIX}${taskId}`,
        GSI1PK: `${USER_PREFIX}${userId}`,
        GSI1SK: `${STATUS_PREFIX}${status}#${TASK_PREFIX}${taskId}`,
        title: taskInput.title,
        status,
        position,
        createdAt: now,
        updatedAt: now
      };

      const params = {
        TableName: TABLE_NAME,
        Item: item
      };

      await docClient.send(new PutCommand(params));

      return {
        taskId,
        title: taskInput.title,
        status,
        position,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  // Update task
  static async updateTask(
    userId: string,
    taskId: string,
    taskUpdate: TaskUpdate
  ): Promise<Task | null> {
    try {
      // First get existing task
      const existingTask = await this.getTask(userId, taskId);
      if (!existingTask) {
        return null;
      }

      const now = new Date().toISOString();

      // Build update expression
      let updateExpression = "SET updatedAt = :updatedAt";
      const expressionAttributeValues: Record<string, unknown> = {
        ":updatedAt": now
      };
      const expressionAttributeNames: Record<string, string> = {};

      if (taskUpdate.title !== undefined) {
        updateExpression += ", title = :title";
        expressionAttributeValues[":title"] = taskUpdate.title;
      }

      if (taskUpdate.position !== undefined) {
        updateExpression += ", position = :position";
        expressionAttributeValues[":position"] = taskUpdate.position;
      }

      // Update GSI if status changes
      if (
        taskUpdate.status !== undefined &&
        taskUpdate.status !== existingTask.status
      ) {
        updateExpression += ", #status = :status, GSI1SK = :gsi1sk";
        expressionAttributeNames["#status"] = "status";
        expressionAttributeValues[":status"] = taskUpdate.status;
        expressionAttributeValues[
          ":gsi1sk"
        ] = `${STATUS_PREFIX}${taskUpdate.status}#${TASK_PREFIX}${taskId}`;
      }

      const params = {
        TableName: TABLE_NAME,
        Key: {
          PK: `${USER_PREFIX}${userId}`,
          SK: `${TASK_PREFIX}${taskId}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: "ALL_NEW" as const
      };

      const result = await docClient.send(new UpdateCommand(params));

      if (!result.Attributes) {
        return null;
      }

      return {
        taskId,
        title: result.Attributes.title,
        status: result.Attributes.status,
        position: result.Attributes.position,
        createdAt: result.Attributes.createdAt,
        updatedAt: result.Attributes.updatedAt
      };
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  // Delete task
  static async deleteTask(userId: string, taskId: string): Promise<boolean> {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: {
          PK: `${USER_PREFIX}${userId}`,
          SK: `${TASK_PREFIX}${taskId}`
        }
      };

      await docClient.send(new DeleteCommand(params));
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  // Reorder tasks
  static async reorderTask(
    userId: string,
    taskId: string,
    newPosition: number
  ): Promise<boolean> {
    try {
      const task = await this.getTask(userId, taskId);
      if (!task) {
        return false;
      }

      await this.updateTask(userId, taskId, { position: newPosition });
      return true;
    } catch (error) {
      console.error("Error reordering task:", error);
      throw error;
    }
  }
}

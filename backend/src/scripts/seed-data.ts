import {
  docClient,
  TABLE_NAME,
  USER_PREFIX,
  TASK_PREFIX,
  STATUS_PREFIX
} from "../lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

async function seedData() {
  console.log("Insert sample data...");

  const userId = "user1";
  const tasks = [
    {
      id: "1",
      title: "DynamoDBの勉強",
      description: "AWSのDynamoDBについて学習する",
      status: "pending",
      dueDate: "2023-12-31",
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      title: "Dockerの復習",
      description: "Dockerコンテナの基本を復習する",
      status: "inProgress",
      dueDate: "2023-12-15",
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      title: "Next.jsプロジェクト完成",
      description: "Todoアプリを完成させる",
      status: "completed",
      dueDate: "2023-12-20",
      createdAt: new Date().toISOString()
    }
  ];

  try {
    // Insert user data
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `${USER_PREFIX}${userId}`,
          SK: `${USER_PREFIX}${userId}`,
          id: userId,
          email: "user1@example.com",
          name: "テストユーザー",
          createdAt: new Date().toISOString()
        }
      })
    );

    // Insert task data
    for (const task of tasks) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `${USER_PREFIX}${userId}`,
            SK: `${TASK_PREFIX}${task.id}`,
            GSI1PK: `${USER_PREFIX}${userId}`,
            GSI1SK: `${STATUS_PREFIX}${task.status}#${task.dueDate}`,
            ...task,
            userId
          }
        })
      );
    }

    console.log("Insert sample data completed");
  } catch (error) {
    console.error("Error occurred during data insertion:", error);
  }
}

seedData();

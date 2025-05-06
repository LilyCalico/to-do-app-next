import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  CreateTableCommand,
  KeyType,
  ScalarAttributeType,
  ProjectionType
} from "@aws-sdk/client-dynamodb";

// DynamoDB client configuration
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  endpoint:
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : undefined,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "LOCAL",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "LOCAL"
  }
});

// Initialize DynamoDB document client
export const docClient = DynamoDBDocumentClient.from(client);

// Table name definition
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "TodoApp";

// Partition key and sort key prefixes
export const USER_PREFIX = "USER#";
export const TASK_PREFIX = "TASK#";
export const STATUS_PREFIX = "STATUS#";

// Create DynamoDB table
export async function createTodoTable() {
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: "PK", KeyType: KeyType.HASH }, // Partition key
      { AttributeName: "SK", KeyType: KeyType.RANGE } // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: ScalarAttributeType.S },
      { AttributeName: "SK", AttributeType: ScalarAttributeType.S },
      { AttributeName: "GSI1PK", AttributeType: ScalarAttributeType.S },
      { AttributeName: "GSI1SK", AttributeType: ScalarAttributeType.S }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: KeyType.HASH },
          { AttributeName: "GSI1SK", KeyType: KeyType.RANGE }
        ],
        Projection: { ProjectionType: ProjectionType.ALL },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log("Table created successfully:", response);
    return response;
  } catch (error) {
    // Error handling for cases like table already exists
    console.error("Error creating table:", error);
    throw error;
  }
}

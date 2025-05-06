import { createTodoTable } from '../lib/dynamodb';

async function setupDatabase() {
  console.log('DynamoDBテーブルを初期化します...');
  
  try {
    await createTodoTable();
    console.log('テーブルの初期化が完了しました');
  } catch (error) {
    console.error('テーブル初期化中にエラーが発生しました:', error);
  }
}

setupDatabase(); 
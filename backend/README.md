This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

# バックエンド部分

## 概要
このディレクトリにはToDoアプリケーションのバックエンド部分が含まれています。

## 技術スタック
- Next.js API Routes / AWS Lambda (TypeScript)
- Amazon DynamoDB
- Amazon Cognito + NextAuth

## DynamoDB設計

### メインテーブル (single-table design)
```
TodoApp
- PK: USER#{userId}
- SK: TASK#{taskId}
- title: string
- status: string (OPEN, COMPLETED)
- position: number (並び替え用の順序値)
- createdAt: string (ISO形式)
- updatedAt: string (ISO形式)
```

### グローバルセカンダリインデックス (GSI)
```
StatusIndex
- PK: USER#{userId}
- SK: STATUS#{status}#TASK#{taskId}
```

### アクセスパターン
- ユーザーの全タスク取得: `PK = USER#{userId}`
- ステータス別タスク取得: `StatusIndex`で`PK = USER#{userId} AND begins_with(SK, "STATUS#{status}")`
- ドラッグアンドドロップ: タスクの`position`値で並び替え

## API仕様
API仕様は以下のファイルを参照してください：
- [Todo API仕様書 (YAML)](./docs/api/openapi.yaml)

API仕様は以下のように構造化されています：
```
docs/
├── api/
│   └── openapi.yaml       # メインのOpenAPI定義ファイル
└── schemas/
    ├── components/        # 再利用可能なコンポーネント
    │   ├── schemas.yaml   # データモデル定義
    │   ├── responses.yaml # 共通レスポンス
    │   └── securitySchemes.yaml # 認証方式
    └── paths/             # API エンドポイント定義
        ├── tasks.yaml     # タスク一覧の取得・作成
        ├── task.yaml      # タスク個別の操作
        └── reorder.yaml   # タスクの並び替え
```

## 開発方法

### 必要条件
- Node.js 18.x以上
- npm 8.x以上

### セットアップ
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### テスト
```bash
npm test
```

## デプロイ方法
AWS CDKを使ったデプロイ方法は別途ドキュメントに記載予定。

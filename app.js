require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const lineWebhook = require('./routes/lineWebhook');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// セキュリティ向上のためのヘッダー設定
app.use(helmet());

// JSONとURLエンコードパース
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhookルート
app.use('/webhook', lineWebhook);

// エラーハンドリングミドルウェア
app.use(errorHandler);

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

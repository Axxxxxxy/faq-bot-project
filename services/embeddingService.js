// embeddingService.js

const axios = require('axios');
const path = require('path');
const faqEmbeddings = require('../cache/faqEmbeddings.json');
const faqDatabase = require('../cache/faqDatabase.json'); // 追加: キーワード保持用
const { getEmbedding } = require('../services/openaiService'); // 外部化してる場合のみ使用

// OpenAI Embedding APIを呼び出してEmbeddingを取得する関数
async function getEmbedding(text) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI APIキーが未設定です');

    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-3-small',
        input: text
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Embedding APIエラー:', error.message);
    throw new Error('Embedding取得失敗');
  }
}

// ユーザー入力からEmbeddingを取得してキャッシュと比較する形式（Dialogflow的解釈）
async function getEmbeddingFromCache(userInput) {
  const userEmbedding = await getEmbedding(userInput);
  return userEmbedding; // 呼び元で比較処理を行う
}

module.exports = {
  getEmbedding,
  getEmbeddingFromCache
};

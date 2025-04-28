// embeddingService.js

const axios = require('axios');
const path = require('path');
const faqEmbeddings = require('../cache/faqEmbeddings.json');

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

// キャッシュから直接Embeddingを取得するダミー関数（今はOpenAIコールは不要）
async function getEmbeddingFromCache(text) {
  // 簡易ダミー：textの文字列を単純にEmbeddingベクトル化（テスト用）
  return Array(faqEmbeddings[0].length).fill(Math.random());
}

module.exports = {
  getEmbedding,
  getEmbeddingFromCache
};

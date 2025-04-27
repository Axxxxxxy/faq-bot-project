// services/embeddingService.js

const axios = require('axios');
const { openaiApiKey } = require('../config/config'); // 修正！単独キーで読み込み

/**
 * ユーザー入力のEmbeddingベクトルを取得
 * @param {string} text ユーザーの入力テキスト
 * @returns {Promise<number[]>} ベクトル配列
 */
async function getEmbedding(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-ada-002',
        input: text
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`, // 修正！ここも単独キーを使用
          'Content-Type': 'application/json'
        },
        timeout: 1500 // タイムアウト設定（1.5秒以内に応答なければエラー）
      }
    );

    if (response.data && response.data.data && response.data.data[0].embedding) {
      return response.data.data[0].embedding;
    } else {
      throw new Error('Embedding APIレスポンス異常');
    }
  } catch (error) {
    console.error('Embedding APIエラー:', error.message);
    throw new Error('Embedding取得失敗');
  }
}

module.exports = {
  getEmbedding
};

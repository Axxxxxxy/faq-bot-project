// services/embeddingService.js

const axios = require('axios');

/**
 * ユーザー入力のEmbeddingベクトルを取得
 * @param {string} text ユーザーの入力テキスト
 * @returns {Promise<number[]>} ベクトル配列
 */
async function getEmbedding(text) {
  try {
    const apiKey = process.env.OPENAI_API_KEY; // 🔥 ここで直接読む！
    if (!apiKey) throw new Error('OpenAI APIキーが未設定です');

    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-ada-002',
        input: text
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 1500
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

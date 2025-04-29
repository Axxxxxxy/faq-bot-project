// embeddingService.js

const axios = require('axios');
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

// ユーザー入力からEmbeddingを取得して、呼び元（lineController.js）でFAQとの比較に使う形式
async function getEmbeddingFromCache(text) {
  const embedding = await getEmbedding(text);
  return embedding;
}

module.exports = {
  getEmbedding,
  getEmbeddingFromCache
};

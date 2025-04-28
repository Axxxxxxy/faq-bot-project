// scripts/generateFaqEmbeddings.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// FAQデータベース（lineController.jsと合わせる）
const faqDatabase = [
  { keyword: '送料' },
  { keyword: '返送' },
  { keyword: '配送予定日' },
  { keyword: '受け取り方法' },
  { keyword: '注文手順' },
  { keyword: '指定住所受取り方法' },
  { keyword: '店舗受取り方法' },
  { keyword: 'コンビニ受取り方法' },
  { keyword: '配送日時の変更' }
];

// Embedding APIコール
async function getEmbedding(text) {
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
}

// メイン処理
async function main() {
  try {
    const embeddings = [];

    for (const faq of faqDatabase) {
      console.log(`Embedding取得中: ${faq.keyword}`);
      const embedding = await getEmbedding(faq.keyword);
      embeddings.push(embedding);
    }

    // 保存先ディレクトリ作成（なければ）
    const outputDir = path.join(__dirname, '../cache');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // JSONとして保存
    const outputPath = path.join(outputDir, 'faqEmbeddings.json');
    fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));

    console.log('faqEmbeddings.json 生成完了 ✅');
  } catch (error) {
    console.error('Embedding生成エラー:', error.message);
  }
}

main();

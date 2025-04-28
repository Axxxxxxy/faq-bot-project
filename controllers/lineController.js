// lineController.js

// 必要なサービスをインポート
const { sendTextMessage, sendQuickReply } = require('../services/messageService');
const { sendFlexMessage } = require('../services/flexMessageService');
const { getEmbedding } = require('../services/embeddingService');
const { calculateCosineSimilarity } = require('../utils/similarity');

// ユーザーごとのセッションを管理するMap
const sessionMap = new Map();

// Flexメッセージ用ターゲット定義
const flexTargets = {
  '注文手順': { title: '注文手順', url: 'https://dummy-link.com/order-procedure' },
  '受け取り方法': { title: '受け取り方法', url: 'https://dummy-link.com/receive-method' },
  '指定住所受取り方法': { title: '指定住所受取り方法', url: 'https://dummy-link.com/home-receive' },
  '店舗受取り方法': { title: '店舗受取り方法', url: 'https://dummy-link.com/store-receive' },
  'コンビニ受取り方法': { title: 'コンビニ受取り方法', url: 'https://dummy-link.com/conveni-receive' },
  '配送日時の変更': { title: '配送日時の変更', url: 'https://dummy-link.com/datetime-change' }
};

// FAQ用データベース（Embeddingジャンプ対象）
const faqDatabase = [
  { keyword: '送料', type: 'flex', payload: { title: '送料について', url: 'https://dummy-link.com/shipping-fee' } },
  { keyword: '返送', type: 'text', payload: { text: '返送方法はこちら https://dummy-link.com/returns' } },
  { keyword: '配送予定日', type: 'flex', payload: { title: '配送予定日', url: 'https://dummy-link.com/delivery-date' } },
  { keyword: '受け取り方法', type: 'flex', payload: { title: '受け取り方法', url: 'https://dummy-link.com/receive-method' } },
  { keyword: '注文手順', type: 'flex', payload: { title: '注文手順', url: 'https://dummy-link.com/order-procedure' } },
  { keyword: '指定住所受取り方法', type: 'flex', payload: { title: '指定住所受取り', url: 'https://dummy-link.com/home-receive' } },
  { keyword: '店舗受取り方法', type: 'flex', payload: { title: '店舗受取り方法', url: 'https://dummy-link.com/store-receive' } },
  { keyword: 'コンビニ受取り方法', type: 'flex', payload: { title: 'コンビニ受取り方法', url: 'https://dummy-link.com/conveni-receive' } },
  { keyword: '配送日時の変更', type: 'flex', payload: { title: '配送日時の変更', url: 'https://dummy-link.com/datetime-change' } }
];

let faqEmbeddings = [];

exports.handleLineWebhook = async (req, res) => {
  try {
    const events = req.body.events;

    // FAQのEmbeddingを初回のみロード
    if (faqEmbeddings.length === 0) {
      console.log('FAQ Embeddingロード中...');
      faqEmbeddings = await Promise.all(
        faqDatabase.map(faq => getEmbedding(faq.keyword))
      );
      console.log('FAQ Embeddingロード完了');
    }

    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userId = event.source.userId;
      const userMessage = event.message.text.trim();
      let session = sessionMap.get(userId) || { phase: 'initial' };

      // "配送"単語検知で初期フェーズ誘導
      const isSimpleDeliveryWord = (msg) => msg.replace(/\s|\n|\r/g, '') === '配送';
      if (isSimpleDeliveryWord(userMessage)) {
        session.phase = 'initial';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送に関するお問い合わせですね。ご注文前・ご注文後どちらでしょうか？', [
          { label: 'ご注文前', text: 'ご注文前' },
          { label: 'ご注文後', text: 'ご注文後' }
        ]);
        continue;
      }

      // 通常配送フロー（ご注文前・後分岐）
      if (session.phase === 'initial') {
        if (userMessage === 'ご注文前') {
          session.phase = 'ご注文前';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, 'ご注文前のお問い合わせですね。以下からお選びください。', [
            { label: '送料', text: '送料' },
            { label: 'お届け日の目安', text: 'お届け日の目安' },
            { label: '店舗受け取り方法', text: '店舗受け取り方法' },
            { label: '配送日時の指定', text: '配送日時の指定' },
            { label: '配送先の変更', text: '配送先の変更' }
          ]);
          continue;
        }
        if (userMessage === 'ご注文後') {
          session.phase = 'ご注文後';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, 'ご注文後のお問い合わせですね。以下からお選びください。', [
            { label: '配送予定日', text: '配送予定日' },
            { label: '配送先の変更', text: '配送先の変更' },
            { label: '配送日時の変更', text: '配送日時の変更' },
            { label: '受け取り手順', text: '受け取り手順' }
          ]);
          continue;
        }
      }

      // ご注文前詳細分岐（店舗受け取り）
      if (session.phase === 'ご注文前' && userMessage === '店舗受け取り方法') {
        session.phase = '店舗受取りフェーズ';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '店舗受け取りについて以下からお選びください。', [
          { label: '概要・送料', text: '概要・送料' },
          { label: '注文手順', text: '注文手順' },
          { label: 'お届け予定日', text: 'お届け予定日' },
          { label: '受け取り方法', text: '受け取り方法' }
        ]);
        continue;
      }

      // ご注文後詳細分岐（配送予定日）
      if (session.phase === 'ご注文後' && userMessage === '配送予定日') {
        session.phase = '配送予定日フェーズ';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送予定日について以下からお選びください。', [
          { label: '指定住所受取り方法', text: '指定住所受取り方法' },
          { label: '店舗受取り方法', text: '店舗受取り方法' },
          { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
        ]);
        continue;
      }

      // ご注文後詳細分岐（受け取り手順）
      if (session.phase === 'ご注文後' && userMessage === '受け取り手順') {
        session.phase = '受け取り手順フェーズ';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '受け取り方法について以下からお選びください。', [
          { label: '店舗受取り方法', text: '店舗受取り方法' },
          { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
        ]);
        continue;
      }

      // Flexターゲット送信（固定リンク）
      if (flexTargets[userMessage]) {
        const { title, url } = flexTargets[userMessage];
        await sendFlexMessage(event.replyToken, title, url);
        sessionMap.delete(userId);
        continue;
      }

      // FAQジャンプ判定 (Embeddingベース)
      try {
        const userEmbedding = await getEmbedding(userMessage);
        let bestSimilarity = 0;
        let bestIndex = -1;

        for (let i = 0; i < faqEmbeddings.length; i++) {
          const similarity = calculateCosineSimilarity(userEmbedding, faqEmbeddings[i]);
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestIndex = i;
          }
        }

        if (bestSimilarity > 0.85 && bestIndex !== -1) {
          const matchedFaq = faqDatabase[bestIndex];
          if (matchedFaq.type === 'flex') {
            await sendFlexMessage(event.replyToken, matchedFaq.payload.title, matchedFaq.payload.url);
          } else if (matchedFaq.type === 'text') {
            await sendTextMessage(event.replyToken, matchedFaq.payload.text);
          }
          sessionMap.delete(userId);
          continue;
        }
      } catch (error) {
        console.error('Embedding FAQジャンプ失敗:', error.message);
      }

      // 最後のフォールバック応答
      await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
      sessionMap.delete(userId);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};
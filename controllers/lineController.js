// lineController.js

const { sendTextMessage, sendQuickReply } = require('../services/messageService');
const { sendFlexMessage } = require('../services/flexMessageService');
const { getEmbedding } = require('../services/embeddingService');
const { calculateCosineSimilarity } = require('../utils/similarity');

const sessionMap = new Map();

const flexTargets = {
  '注文手順': { title: '注文手順', url: 'https://dummy-link.com/order-procedure' },
  '受け取り方法': { title: '受け取り方法', url: 'https://dummy-link.com/receive-method' },
  '指定住所受取り方法': { title: '指定住所受取り方法', url: 'https://dummy-link.com/home-receive' },
  '店舗受取り方法': { title: '店舗受取り方法', url: 'https://dummy-link.com/store-receive' },
  'コンビニ受取り方法': { title: 'コンビニ受取り方法', url: 'https://dummy-link.com/conveni-receive' },
  '配送日時の変更': { title: '配送日時の変更', url: 'https://dummy-link.com/datetime-change' }
};

// Embedding対象ワードリスト
const deliveryStatusKeywords = [
  '配送状況', '配送追跡', '送り状番号', '問い合わせ番号', '追跡番号',
  'どこにある', '届く予定', '配達状況', 'いつ', '状況', 'ステータス'
];

// 配送状況キーワードのEmbedding（初回のみロード）
let deliveryStatusEmbeddings = [];

exports.handleLineWebhook = async (req, res) => {
  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userId = event.source.userId;
      const userMessage = event.message.text.trim();
      let session = sessionMap.get(userId) || { phase: 'initial' };

      const isSimpleDeliveryWord = (msg) => msg.replace(/[\s\n\r]/g, '') === '配送';

      // 📍 初回アクセス時にのみEmbeddingロード
      if (deliveryStatusEmbeddings.length === 0) {
        try {
          console.log('Embeddingロード開始...');
          deliveryStatusEmbeddings = await Promise.all(
            deliveryStatusKeywords.map(keyword => getEmbedding(keyword))
          );
          console.log('配送状況Embedding初期ロード完了');
        } catch (error) {
          console.error('配送状況Embedding初期ロード失敗:', error.message);
        }
      }

      // ① 「配送」単語だけなら初期フェーズに誘導
      if (isSimpleDeliveryWord(userMessage)) {
        session.phase = 'initial';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送に関するお問い合わせですね。ご注文前・ご注文後どちらでしょうか？', [
          { label: 'ご注文前', text: 'ご注文前' },
          { label: 'ご注文後', text: 'ご注文後' }
        ]);
        continue;
      }

      // ② 通常のフェーズ分岐
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

      if (session.phase === 'ご注文後' && userMessage === '受け取り手順') {
        session.phase = '受け取り手順フェーズ';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '受け取り方法について以下からお選びください。', [
          { label: '店舗受取り方法', text: '店舗受取り方法' },
          { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
        ]);
        continue;
      }

      // ③ Flexリンク送信
      if (flexTargets[userMessage]) {
        const { title, url } = flexTargets[userMessage];
        await sendFlexMessage(event.replyToken, title, url);
        sessionMap.delete(userId);
        continue;
      }

      // ④ 🔥 Embedding意味判定
      try {
        const userEmbedding = await getEmbedding(userMessage);

        let bestSimilarity = 0;
        for (const statusEmbedding of deliveryStatusEmbeddings) {
          const similarity = calculateCosineSimilarity(userEmbedding, statusEmbedding);
          bestSimilarity = Math.max(bestSimilarity, similarity);
        }

        if (bestSimilarity > 0.8) {
          session.phase = '配送状況確認フェーズ';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, '配送状況に関するお問い合わせですね。以下からお選びください。', [
            { label: '配送予定日', text: '配送予定日' },
            { label: '配送の追跡', text: '配送の追跡' },
            { label: '店舗受け取り方法', text: '店舗受け取り方法' }
          ]);
          continue;
        }
      } catch (embeddingError) {
        console.error('Embedding判定失敗:', embeddingError.message);
      }

      // ⑤ 最後のフォールバック
      await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
      sessionMap.delete(userId);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// lineController.js（Dialogflow形式対応）

const { sendTextMessage, sendQuickReply } = require('../services/messageService');
const { sendFlexMessage } = require('../services/flexMessageService');
const { getEmbeddingFromCache } = require('../services/embeddingService');
const { calculateCosineSimilarity } = require('../utils/similarity');
const sessionMap = new Map();

const flexTargets = require('../cache/flexTargets.json');
const faqDatabase = require('../cache/faqDatabase.json');
const faqEmbeddings = require('../cache/faqEmbeddings.json');

exports.handleLineWebhook = async (req, res) => {
  try {
    const events = req.body.events;
    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userId = event.source.userId;
      const userMessage = event.message.text.trim();
      let session = sessionMap.get(userId) || { phase: 'initial' };

      const isSimpleDeliveryWord = (msg) => msg.replace(/\s|\n|\r/g, '') === '配送';
      if (isSimpleDeliveryWord(userMessage)) {
        session.phase = 'initial';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送に関するお問い合わせですね。ご注文前・ご注文後どちらでしょうか？', [
          { label: 'ご注文前', text: 'ご注文前' },
          { label: 'ご注文後', text: 'ご注文後' }
        ]);
      }

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
      }

      if (session.phase === 'ご注文後' && userMessage === '配送予定日') {
        session.phase = '配送予定日フェーズ';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送予定日について以下からお選びください。', [
          { label: '指定住所受取り方法', text: '指定住所受取り方法' },
          { label: '店舗受取り方法', text: '店舗受取り方法' },
          { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
        ]);
      }

      if (session.phase === 'ご注文後' && userMessage === '受け取り手順') {
        session.phase = '受け取り手順フェーズ';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '受け取り方法について以下からお選びください。', [
          { label: '店舗受取り方法', text: '店舗受取り方法' },
          { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
        ]);
      }

      // 🔄 Flexターゲットにマッチする場合は送信
      if (flexTargets[userMessage]) {
        const { title, url } = flexTargets[userMessage];
        await sendFlexMessage(event.replyToken, title, url);
        sessionMap.delete(userId);
        return;
      }

      // 🔍 Dialogflow形式：常にEmbedding類似度を確認しジャンプ可能にする
      try {
        const userEmbedding = await getEmbeddingFromCache(userMessage);
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
          return;
        }
      } catch (embeddingError) {
        console.error('Embedding類似度検索エラー:', embeddingError.message);
      }

      // 何にもマッチしなければフォールバック応答
      await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
      sessionMap.delete(userId);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

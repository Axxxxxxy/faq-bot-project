// 最終版 lineController.js（ユニクロ式＋自然言語柔軟対応＋フェーズ完全網羅＋配送状況確認追加）

const { sendTextMessage, sendQuickReply } = require('../services/messageService');
const { sendFlexMessage } = require('../services/flexMessageService');

const sessionMap = new Map();

exports.handleLineWebhook = async (req, res) => {
  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userId = event.source.userId;
      const userMessage = event.message.text.trim();
      let session = sessionMap.get(userId) || { phase: 'initial' };

      const isSimpleDeliveryWord = (msg) => {
        const cleaned = msg.replace(/[\s\n\r]/g, '');
        return cleaned === '配送';
      };

      const matchKeyword = (msg, keywords) => {
        return keywords.some(keyword => msg.includes(keyword));
      };

      // --- 手入力で単に「配送」だけが来たら初期リセット ---
      if (isSimpleDeliveryWord(userMessage)) {
        session.phase = 'initial';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送に関するお問い合わせですね。ご注文前・ご注文後どちらでしょうか？', [
          { label: 'ご注文前', text: 'ご注文前' },
          { label: 'ご注文後', text: 'ご注文後' }
        ]);
        continue;
      }

      // --- 配送状況確認トリガー ---
      if (userMessage.includes('配送状況確認') || userMessage.includes('配送状況') || userMessage.includes('配送追跡')) {
        session.phase = '配送状況確認';
        sessionMap.set(userId, session);
        await sendQuickReply(event.replyToken, '配送状況についてですね。以下からお選びください。', [
          { label: '配送予定日確認', text: '配送予定日確認' },
          { label: '配送追跡', text: '配送追跡' },
          { label: '店舗受け取り状況確認', text: '店舗受け取り状況確認' }
        ]);
        continue;
      }

      // --- 初期フェーズ：ご注文前／後選択 ---
      if (session.phase === 'initial') {
        if (userMessage === 'ご注文前') {
          session.phase = 'ご注文前';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, 'ご注文前のお問い合わせですね。以下からお選びください。', [
            { label: '送料', text: '送料' },
            { label: 'お届け日の目安', text: 'お届け日の目安' },
            { label: '店舗受け取り', text: '店舗受け取り' },
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

      // --- ご注文前フェーズ ---
      if (session.phase === 'ご注文前') {
        const frontOrderKeywords = ['送料', 'お届け日の目安', '店舗受け取り', '配送日時の指定', '配送先の変更'];

        if (matchKeyword(userMessage, frontOrderKeywords)) {
          if (userMessage.includes('店舗受け取り')) {
            session.phase = '店舗受け取り';
            sessionMap.set(userId, session);
            await sendQuickReply(event.replyToken, '店舗受け取りについてですね。以下からお選びください。', [
              { label: '概要・送料', text: '概要・送料' },
              { label: '注文手順', text: '注文手順' },
              { label: 'お届け予定日', text: 'お届け予定日' },
              { label: '受け取り方法', text: '受け取り方法' }
            ]);
            continue;
          } else {
            await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
            sessionMap.delete(userId);
            continue;
          }
        }
      }

      // --- ご注文後フェーズ ---
      if (session.phase === 'ご注文後') {
        const afterOrderKeywords = ['配送予定日', '配送先の変更', '配送日時の変更', '受け取り手順'];

        if (matchKeyword(userMessage, afterOrderKeywords)) {
          if (userMessage.includes('配送予定日')) {
            session.phase = '配送予定日';
            sessionMap.set(userId, session);
            await sendQuickReply(event.replyToken, '配送予定日についてですね。以下からお選びください。', [
              { label: '指定住所受取り', text: '指定住所受取り' },
              { label: '店舗受取り', text: '店舗受取り' },
              { label: 'コンビニ受取り', text: 'コンビニ受取り' }
            ]);
            continue;
          }

          if (userMessage.includes('受け取り手順')) {
            session.phase = '受け取り手順';
            sessionMap.set(userId, session);
            await sendQuickReply(event.replyToken, '受け取り手順についてですね。以下からお選びください。', [
              { label: '店舗受取り方法', text: '店舗受取り方法' },
              { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
            ]);
            continue;
          }

          const flexTargets = {
            '配送先の変更': { title: '配送先の変更', url: 'https://dummy-link.com/address-change' },
            '配送日時の変更': { title: '配送日時の変更', url: 'https://dummy-link.com/datetime-change' }
          };

          if (flexTargets[userMessage]) {
            const { title, url } = flexTargets[userMessage];
            await sendFlexMessage(event.replyToken, title, url);
            sessionMap.delete(userId);
            continue;
          }
        }
      }

      // --- 配送状況確認フェーズ ---
      if (session.phase === '配送状況確認') {
        if (matchKeyword(userMessage, ['配送予定日確認', '配送追跡', '店舗受け取り状況確認'])) {
          await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
          sessionMap.delete(userId);
          continue;
        }
      }

      // --- 店舗受取りフェーズ ---
      if (session.phase === '店舗受け取り') {
        if (matchKeyword(userMessage, ['概要・送料', '注文手順', 'お届け予定日', '受け取り方法'])) {
          await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
          sessionMap.delete(userId);
          continue;
        }
      }

      // --- 配送予定日フェーズ ---
      if (session.phase === '配送予定日') {
        if (matchKeyword(userMessage, ['指定住所受取り', '店舗受取り', 'コンビニ受取り'])) {
          await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
          sessionMap.delete(userId);
          continue;
        }
      }

      // --- 受け取り手順フェーズ ---
      if (session.phase === '受け取り手順') {
        if (matchKeyword(userMessage, ['店舗受取り方法', 'コンビニ受取り方法'])) {
          await sendTextMessage(event.replyToken, `${userMessage}に関するご案内です。`);
          sessionMap.delete(userId);
          continue;
        }
      }

      // --- fallback ---
      await sendTextMessage(event.replyToken, '申し訳ありません、もう一度選択してください。');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

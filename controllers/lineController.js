// 完全版 lineController.js（フェーズ管理型・落ち着いて作成）

const { sendTextMessage, sendQuickReply } = require('../services/messageService');
const { sendFlexMessage } = require('../services/flexMessageService');

// 仮想セッション管理（超簡易版・メモリ保持）
const sessionMap = new Map();

exports.handleLineWebhook = async (req, res) => {
  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userId = event.source.userId;
      const userMessage = event.message.text.trim();
      let session = sessionMap.get(userId) || { phase: 'initial' };

      // --- 初回配送系トリガー ---
      if (session.phase === 'initial') {
        if (userMessage.includes('配送状況確認')) {
          session.phase = '配送状況確認';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, '配送状況確認ですね。以下からお選びください。', [
            { label: '配送予定日', text: '配送予定日' },
            { label: '配送の追跡', text: '配送の追跡' },
            { label: '店舗受け取り', text: '店舗受け取り' }
          ]);
          continue;
        }

        if (userMessage.includes('配送')) {
          session.phase = '配送';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, '配送に関するお問い合わせですね。ご注文前・ご注文後どちらでしょうか？', [
            { label: 'ご注文前', text: 'ご注文前' },
            { label: 'ご注文後', text: 'ご注文後' }
          ]);
          continue;
        }
      }

      // --- 配送フェーズ ---
      if (session.phase === '配送') {
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
        const textReplies = {
          '送料': '送料に関するご案内です。',
          'お届け日の目安': 'お届け日の目安に関するご案内です。',
          '概要・送料': '店舗受け取りに関する概要・送料についてご案内します。',
          'お届け予定日': 'お届け予定日に関する概要・送料についてご案内します。',
          '配送先の変更': '配送先の変更に関するご案内です。',
          '配送日時の指定': '配送日時の指定に関するご案内です。'
        };

        if (textReplies[userMessage]) {
          await sendTextMessage(event.replyToken, textReplies[userMessage]);
          sessionMap.delete(userId);
          continue;
        }

        if (userMessage === '店舗受け取り') {
          session.phase = '店舗受け取り';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, '店舗受け取りについてですね。以下からお選びください。', [
            { label: '概要・送料', text: '概要・送料' },
            { label: '注文手順', text: '注文手順' },
            { label: 'お届け予定日', text: 'お届け予定日' },
            { label: '受け取り方法', text: '受け取り方法' }
          ]);
          continue;
        }
      }

      // --- ご注文後フェーズ ---
      if (session.phase === 'ご注文後') {
        if (userMessage === '配送予定日') {
          await sendQuickReply(event.replyToken, '配送予定日についてですね。以下からお選びください。', [
            { label: '指定住所受取り', text: '指定住所受取り' },
            { label: '店舗受取り', text: '店舗受取り' },
            { label: 'コンビニ受取り', text: 'コンビニ受取り' }
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

        if (userMessage === '受け取り手順') {
          session.phase = '受け取り手順';
          sessionMap.set(userId, session);
          await sendQuickReply(event.replyToken, '受け取り手順についてですね。以下からお選びください。', [
            { label: '店舗受取り方法', text: '店舗受取り方法' },
            { label: 'コンビニ受取り方法', text: 'コンビニ受取り方法' }
          ]);
          continue;
        }
      }

      // --- fallback（どれにも該当しない場合） ---
      await sendTextMessage(event.replyToken, '申し訳ありません、もう一度選択してください。');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

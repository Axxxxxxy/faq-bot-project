const line = require('@line/bot-sdk');
const {
  createDeliveryStatusQuickReply,
  createDefaultQuickReply
} = require('../services/messageService');
const {
  createDeliveryStatusFlex,
  createPurchaseHistoryFlex
} = require('../services/flexMessageService');

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

exports.handleLineWebhook = async (req, res) => {
  try {
    console.log('=== Webhook受信 ===');

    // 署名検証
    const signature = req.headers['x-line-signature'];
    if (!line.validateSignature(JSON.stringify(req.body), process.env.LINE_CHANNEL_SECRET, signature)) {
      console.error('署名検証失敗');
      return res.status(401).send('Unauthorized');
    }

    const events = req.body.events;
    console.log('受信イベント:', JSON.stringify(events, null, 2));

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;
        console.log('ユーザー発言:', userMessage);

        if (!replyToken) {
          console.log('無効なリプライトークン検出');
          continue;
        }

        if (
          userMessage.includes('配送') ||
          userMessage.includes('届かない') ||
          userMessage.includes('配達') ||
          userMessage.includes('受け取り')
        ) {
          console.log('配送関連ワードを検出しました');

          const flexMessage = createDeliveryStatusFlex(); // Flexメッセージを生成
          await client.replyMessage(replyToken, flexMessage); // 直接Flexを返す
          console.log('配送状況Flexメッセージ送信完了');
          continue;
        }

        if (userMessage.includes('購入履歴') || userMessage.includes('注文履歴')) {
          console.log('購入履歴関連ワードを検出しました');

          const flexMessage = createPurchaseHistoryFlex(); // Flexメッセージを生成
          await client.replyMessage(replyToken, flexMessage);
          console.log('購入履歴Flexメッセージ送信完了');
          continue;
        }

        console.log('配送・購入履歴以外の通常応答 → クイックリプライ');

        await client.replyMessage(replyToken, {
          type: 'text',
          text: '申し訳ありません、うまく認識できませんでした。もう一度メニューから選択してください。',
          quickReply: createDefaultQuickReply()
        });
      }

      if (event.type === 'postback') {
        console.log('Postbackイベント受信:', event.postback.data);

        const postbackData = event.postback.data;
        let messages = [];

        if (postbackData === 'delivery_timing_inquiry') {
          messages = [
            {
              type: 'text',
              text: '配送予定日はご注文履歴ページよりご確認いただけます。'
            }
          ];
        } else if (postbackData === 'delivery_status_inquiry') {
          messages = [
            {
              type: 'text',
              text: '配送状況は配送業者の追跡ページからご確認ください。'
            }
          ];
        } else if (postbackData === 'store_pickup_inquiry') {
          messages = [
            {
              type: 'text',
              text: '店舗受取商品はご購入履歴ページから確認できます。'
            }
          ];
        } else {
          messages = [
            {
              type: 'text',
              text: '恐れ入りますが、もう一度メニューから選び直してください。'
            }
          ];
        }

        await client.replyMessage(event.replyToken, messages);
        console.log('Postback応答送信成功');
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('=== Webhookエラーハンドリング開始 ===');
    if (req && req.body) {
      console.error('リクエストボディ:', JSON.stringify(req.body, null, 2));
    }
    console.error('エラー内容:', typeof error === 'object' ? JSON.stringify(error, null, 2) : error);
    if (error && error.stack) {
      console.error('エラースタック:', error.stack);
    }
    console.error('=== Webhookエラーハンドリング終了 ===');
    res.status(500).send('Internal Server Error');
  }
};
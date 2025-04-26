const line = require('@line/bot-sdk');
const {
  createDeliveryStatusQuickReply,
  createDeliveryTimingResponse,
  createDeliveryStatusResponse,
  createStorePickupResponse
} = require('../services/messageService');

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
          const replyPayload = createDeliveryStatusQuickReply(replyToken);
          console.log('クイックリプライ送信準備');
          await client.replyMessage(replyPayload.replyToken, replyPayload.messages);
          console.log('クイックリプライ送信成功');
          continue;
        }

        console.log('配送ワード以外の通常応答');
        await client.replyMessage(replyToken, {
          type: 'text',
          text: 'ご質問内容をもう一度詳しく教えてください。'
        });
      }

      if (event.type === 'postback') {
        console.log('Postbackイベント受信:', event.postback.data);

        const postbackData = event.postback.data;
        let messages = [];

        if (postbackData === 'delivery_timing_inquiry') {
          messages = createDeliveryTimingResponse();
        } else if (postbackData === 'delivery_status_inquiry') {
          messages = createDeliveryStatusResponse();
        } else if (postbackData === 'store_pickup_inquiry') {
          messages = createStorePickupResponse();
        } else {
          messages = [{
            type: 'text',
            text: '恐れ入りますが、もう一度メニューから選び直してください。'
          }];
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

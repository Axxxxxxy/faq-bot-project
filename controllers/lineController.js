const line = require('@line/bot-sdk');
const {
  createDeliveryStatusQuickReply,
  createDeliveryTimingResponse,
  createDeliveryStatusResponse,
  createStorePickupResponse
} = require('../services/messageService');

// LINE SDKクライアントインスタンス作成
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

exports.handleLineWebhook = async (req, res) => {
  try {
    console.log('=== Webhook受信 ===');
    const events = req.body.events;
    console.log('受信イベント:', JSON.stringify(events, null, 2));

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;
        console.log('ユーザー発言:', userMessage);

        // ダミーリクエストかを判定
        if (!replyToken || replyToken === 'DUMMY_REPLY_TOKEN') {
          console.log('ダミーリクエストのためLINE APIリプライをスキップ');
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
          console.log('クイックリプライメッセージを送信準備完了');

          await client.replyMessage(replyPayload.replyToken, replyPayload.messages);
          console.log('クイックリプライメッセージを送信しました');
          continue;
        }

        console.log('配送ワードではないため通常メッセージ応答');
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
        console.log('Postback応答を送信しました');
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

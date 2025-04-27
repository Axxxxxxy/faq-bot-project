// services/messageService.js

const line = require('@line/bot-sdk');

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

/**
 * 通常のテキストメッセージ送信
 */
async function sendTextMessage(replyToken, text) {
  const message = { type: 'text', text };
  await client.replyMessage(replyToken, message);
}

/**
 * クイックリプライメッセージ送信
 */
async function sendQuickReply(replyToken, text, quickReplies) {
  const message = {
    type: 'text',
    text,
    quickReply: {
      items: quickReplies.map(item => ({
        type: 'action',
        action: {
          type: 'message',
          label: item.label,
          text: item.text
        }
      }))
    }
  };
  await client.replyMessage(replyToken, message);
}

module.exports = {
  sendTextMessage,
  sendQuickReply
};

// services/messageService.js

const { Client } = require('@line/bot-sdk');
const config = require('../config/lineConfig');
const client = new Client(config);

// ▼ 通常のテキストメッセージ送信
async function sendTextMessage(replyToken, text) {
  await client.replyMessage(replyToken, {
    type: 'text',
    text: text
  });
}

// ▼ クイックリプライ付きテキスト送信
async function sendQuickReply(replyToken, text, quickReplies) {
  await client.replyMessage(replyToken, {
    type: 'text',
    text: text,
    quickReply: {
      items: quickReplies.map(q => ({
        type: 'action',
        action: {
          type: 'message',
          label: q.label,
          text: q.text
        }
      }))
    }
  });
}

module.exports = {
  sendTextMessage,
  sendQuickReply
};

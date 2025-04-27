// services/flexMessageService.js

const { Client } = require('@line/bot-sdk');
const config = require('../config/lineConfig');
const client = new Client(config);

// ▼ Flexメッセージ送信（罫線入り）
async function sendFlexMessage(replyToken, title, url) {
  const message = {
    type: 'flex',
    altText: `${title}のご案内`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: 'xl',
        backgroundColor: '#fafafa',
        contents: [
          {
            type: 'text',
            text: title,
            size: 'md',
            weight: 'bold',
            wrap: true
          },
          {
            type: 'text',
            text: 'こちらから詳細をご確認ください。',
            size: 'sm',
            wrap: true,
            color: '#555555'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        borderColor: '#DDDDDD', // ← グレー罫線
        borderWidth: '1px',     // ← 線の太さもOK
        paddingTop: '12px',
        contents: [
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: '詳しく見る',
              uri: url
            },
            color: '#495a86'
          }
        ],
        flex: 0
      }
    }
  };

  await client.replyMessage(replyToken, message);
}

module.exports = {
  sendFlexMessage
};

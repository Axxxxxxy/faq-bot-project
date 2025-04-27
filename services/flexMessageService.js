// services/flexMessageService.js

const line = require('@line/bot-sdk');

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

/**
 * 汎用Flexメッセージ生成＆送信
 */
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
        borderWidth: "0.75px",
        contents: [
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: '詳しく見る',
              uri: url
            }
          }
        ]
      }
    }
  };

  await client.replyMessage(replyToken, message);
}

module.exports = {
  sendFlexMessage
};

// 配送状況に関するクイックリプライメッセージ生成

function createDeliveryStatusQuickReply(replyToken) {
    return {
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: '配送についてのお問い合わせですね。\nお届けに関する内容を、以下からお選びください。',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '商品はいつごろ届きますか？',
                  data: 'delivery_timing_inquiry',
                  displayText: '商品はいつごろ届きますか？'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '配送状況の確認はできますか？',
                  data: 'delivery_status_inquiry',
                  displayText: '配送状況の確認はできますか？'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '店舗受け取り商品は到着していますか？',
                  data: 'store_pickup_inquiry',
                  displayText: '店舗受け取り商品は到着していますか？'
                }
              }
            ]
          }
        }
      ]
    };
  }
  
  // 商品到着タイミングに関する応答メッセージ生成
  
  function createDeliveryTimingResponse() {
    return [
      {
        type: 'text',
        text: 'ご注文商品の配送予定については、購入履歴ページに記載されています。最終日までに届かない場合もございますので、あらかじめご了承ください。'
      },
      {
        type: 'flex',
        altText: '配送予定日を確認する',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '配送予定日を確認する',
                weight: 'bold',
                size: 'md'
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '購入履歴を開く',
                  uri: 'https://example.com/purchase-history' // ★実際の購入履歴URLに差し替え
                }
              }
            ]
          }
        }
      }
    ];
  }
  
  // 配送状況確認に関する応答メッセージ生成
  
  function createDeliveryStatusResponse() {
    return [
      {
        type: 'text',
        text: '配送状況の詳細は、配送業者の追跡ページにてご確認いただけます。ご注文時にご案内した追跡番号をご用意ください。'
      },
      {
        type: 'flex',
        altText: '配送状況を確認する',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '配送状況を確認する',
                weight: 'bold',
                size: 'md'
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '配送業者サイトを開く',
                  uri: 'https://example.com/track-order' // ★実際の追跡ページURLに差し替え
                }
              }
            ]
          }
        }
      }
    ];
  }
  
  // 店舗受け取り到着に関する応答メッセージ生成
  
  function createStorePickupResponse() {
    return [
      {
        type: 'text',
        text: '店舗受け取り商品は、到着次第お知らせメールまたはメッセージでご案内いたします。購入履歴でも到着状況をご確認いただけます。'
      },
      {
        type: 'flex',
        altText: '店舗受け取り状況を確認する',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '店舗受け取り状況を確認する',
                weight: 'bold',
                size: 'md'
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '購入履歴を開く',
                  uri: 'https://example.com/purchase-history' // ★購入履歴URLに差し替え
                }
              }
            ]
          }
        }
      }
    ];
  }
  
  // エクスポート
  
  module.exports = {
    createDeliveryStatusQuickReply,
    createDeliveryTimingResponse,
    createDeliveryStatusResponse,
    createStorePickupResponse
  };
  
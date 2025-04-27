// services/flexMessageService.js

/**
 * Flexメッセージ（配送状況確認）
 */
function createDeliveryStatusFlex() {
    return {
      type: "flex",
      altText: "配送状況のご案内",
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          paddingAll: "xl",
          backgroundColor: "#fafafa",
          contents: [
            {
              type: "text",
              text: "配送状況のご案内",
              size: "sm",
              color: "#222931",
              wrap: true,
              weight: "bold"
            },
            {
              type: "text",
              text: "ご注文商品の配送状況をご案内します。詳細は以下よりご確認ください。",
              size: "sm",
              color: "#222931",
              wrap: true
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          borderWidth: "1px",
          borderColor: "#DDDDDD",
          paddingTop: "12px",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "配送状況を確認する",
                uri: "https://your-delivery-link.com"
              },
              height: "sm",
              style: "link",
              color: "#495a86",
              margin: "sm"
            }
          ],
          flex: 0
        }
      }
    };
  }
  
  /**
   * Flexメッセージ（購入履歴確認）
   */
  function createPurchaseHistoryFlex() {
    return {
      type: "flex",
      altText: "購入履歴のご案内",
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          paddingAll: "xl",
          backgroundColor: "#fafafa",
          contents: [
            {
              type: "text",
              text: "購入履歴のご案内",
              size: "sm",
              color: "#222931",
              wrap: true,
              weight: "bold"
            },
            {
              type: "text",
              text: "ご注文履歴の詳細を以下よりご確認いただけます。",
              size: "sm",
              color: "#222931",
              wrap: true
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          borderWidth: "1px",
          borderColor: "#DDDDDD",
          paddingTop: "12px",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "購入履歴を開く",
                uri: "https://your-purchase-history-link.com"
              },
              height: "sm",
              style: "link",
              color: "#495a86",
              margin: "sm"
            }
          ],
          flex: 0
        }
      }
    };
  }
  
  module.exports = {
    createDeliveryStatusFlex,
    createPurchaseHistoryFlex
  };
  
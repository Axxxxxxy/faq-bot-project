// services/messageService.js

// テキスト・クイックリプライ系サービスまとめ

/** 配送状況に関するクイックリプライ生成 */
function createDeliveryStatusQuickReply() {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '配送状況を確認',
          text: '配送状況を確認'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '購入履歴を見る',
          text: '購入履歴を見る'
        }
      }
    ]
  };
}

/** 問い合わせメニュー用クイックリプライ生成 */
function createDefaultQuickReply() {
  return {
    items: [
      { type: 'action', action: { type: 'message', label: '注文・キャンセル', text: '注文・キャンセル' } },
      { type: 'action', action: { type: 'message', label: '商品をさがす', text: '商品をさがす' } },
      { type: 'action', action: { type: 'message', label: '商品サイズ', text: '商品サイズ' } },
      { type: 'action', action: { type: 'message', label: '送料・配送', text: '送料・配送' } },
      { type: 'action', action: { type: 'message', label: '返品・交換', text: '返品・交換' } },
      { type: 'action', action: { type: 'message', label: '支払い方法', text: '支払い方法' } },
      { type: 'action', action: { type: 'message', label: '会員登録・ログイン', text: '会員登録・ログイン' } },
      { type: 'action', action: { type: 'message', label: 'クーポン・キャンペーン', text: 'クーポン・キャンペーン' } },
      { type: 'action', action: { type: 'message', label: 'よくある質問', text: 'よくある質問' } }
    ]
  };
}

module.exports = {
  createDeliveryStatusQuickReply,
  createDefaultQuickReply
};

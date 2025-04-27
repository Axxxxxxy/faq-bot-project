// config/config.js
require('dotenv').config();

module.exports = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
  };
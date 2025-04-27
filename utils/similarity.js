// utils/similarity.js

/**
 * 2つのベクトル間のコサイン類似度を計算する
 * @param {number[]} vecA - ベクトルA
 * @param {number[]} vecB - ベクトルB
 * @returns {number} - 類似度（0〜1）
 */
function calculateCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('ベクトルの次元が一致していません');
    }
  
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0; // 片方がゼロベクトルなら類似度0
    }
  
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  module.exports = { calculateCosineSimilarity };
  
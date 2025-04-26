// エラーハンドリング用ミドルウェア

function errorHandler(err, req, res, next) {
    console.error('Error:', err.stack || err.message || err);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
  
  module.exports = { errorHandler };
  
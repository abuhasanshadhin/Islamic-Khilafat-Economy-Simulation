// Middleware to ensure BigInt values serialize to strings in JSON responses
function bigIntMiddleware(req, res, next) {
  const originalJson = res.json;
  res.json = function (body) {
    function replacer(_, value) {
      if (typeof value === 'bigint') return value.toString();
      return value;
    }
    const text = JSON.stringify(body, replacer);
    res.set('Content-Type', 'application/json');
    return res.send(text);
  };
  next();
}

module.exports = bigIntMiddleware;

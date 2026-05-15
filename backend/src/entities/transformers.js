const bigIntTransformer = {
  to: (value) => (value !== null && value !== undefined ? value.toString() : null),
  from: (value) => (value !== null && value !== undefined ? BigInt(value) : null),
};

module.exports = { bigIntTransformer };

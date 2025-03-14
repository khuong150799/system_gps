const safeJsonParse = (str = "{}") => {
  try {
    return JSON.parse(str);
  } catch (err) {
    throw err;
  }
};

module.exports = safeJsonParse;

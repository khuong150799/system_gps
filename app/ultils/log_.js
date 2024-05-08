const getTime = require("./getTime");

const log_ = (...args) => {
  const currTime = getTime.current();
  console.log(`${currTime}:`, ...args);
};

module.exports = log_;

const crypto = require("crypto");

function generateRandomNumber() {
  const number = BigInt("0x" + crypto.randomBytes(8).toString("hex"))
    .toString()
    .slice(0, 20);
  return number.padEnd(20, "0");
}
module.exports = generateRandomNumber;

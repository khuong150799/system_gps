function makeUsername(input) {
  let cleaned = input.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned.toLowerCase();
}

module.exports = makeUsername;

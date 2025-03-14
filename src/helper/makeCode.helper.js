const makeCode = () => {
  const char = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];
  const charOne = Math.floor(Math.random() * char.length);
  const charTwo = Math.floor(Math.random() * char.length);
  return `${char[charOne]}${char[charTwo]}${Date.now()}`;
};

module.exports = { makeCode };

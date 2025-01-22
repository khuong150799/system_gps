const handleShufflePhoneNumber = (phoneNumber) => {
  const digits = phoneNumber.split("");

  const digitsToShuffle = digits.slice(3);

  // algorithm Fisher-Yates
  for (let i = digitsToShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digitsToShuffle[i], digitsToShuffle[j]] = [
      digitsToShuffle[j],
      digitsToShuffle[i],
    ];
  }

  const shuffledPhoneNumber = [...digits.slice(0, 3), ...digitsToShuffle].join(
    ""
  );

  return shuffledPhoneNumber;
};

module.exports = handleShufflePhoneNumber;

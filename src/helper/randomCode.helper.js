const generateNumberDivisibleBy = (numberDivisible) => {
  let number;

  do {
    number = Math.floor(Math.random() * 900) + 100;

    const squared = number ** 2 / 2;

    if (squared % Number(numberDivisible) === 0) {
      return number;
    }
  } while (true);
};

function sumOfDigits(number) {
  return number
    .toString()
    .split("")
    .reduce((result, num) => {
      result += Number(num);
      return result;
    }, 0);
}

function sumNumbersBy18() {
  let number;

  do {
    number = Math.floor(Math.random() * 900) + 100;

    const squared = number ** 2;

    if (sumOfDigits(squared) === 18) {
      return number;
    }
  } while (true);
}
function generateRandomSixDigitNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

function getLastTwoDigitsOfYear() {
  const year = new Date().getFullYear(); // Lấy năm hiện tại
  return year % 100; // Lấy 2 chữ số cuối
}

function generateRandomNumber(type) {
  const threeNumberDivisibleBy9 = generateNumberDivisibleBy(9);
  const threesumNumbersBy18 = sumNumbersBy18(9);

  const currentYear = getLastTwoDigitsOfYear();

  const year =
    Number(`${threeNumberDivisibleBy9 % 5}${threesumNumbersBy18 % 5}`) +
    currentYear;

  const numRandom = generateRandomSixDigitNumber();

  const sumAuthWithType =
    (sumOfDigits(
      `${threeNumberDivisibleBy9}${year}${numRandom}${threesumNumbersBy18}`
    ) %
      90) +
    Number(type);

  // console.log(
  //   'sumAuthWithType?.length === 1 ? "0" + sumAuthWithType : sumAuthWithType',
  //   sumAuthWithType?.length === 1 ? "0" + sumAuthWithType : sumAuthWithType
  // );

  return Number(
    `${threeNumberDivisibleBy9}${year}${numRandom}${threesumNumbersBy18}${
      sumAuthWithType?.length === 1 ? "0" + sumAuthWithType : sumAuthWithType
    }`
  );
}
module.exports = generateRandomNumber;

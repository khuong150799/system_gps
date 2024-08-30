const handleSortData = async (arr, length) => {
  const arrClone = JSON.parse(JSON.stringify(arr));
  for (let i = 1; i < length; i++) {
    const key = Number(arrClone[i]);

    let j = i - 1;

    while (j >= 0 && Number(arrClone[j]) > key) {
      arrClone[j + 1] = arrClone[j];
      j--;
    }
    arrClone[j + 1] = key;
  }

  return arrClone;
};

module.exports = handleSortData;

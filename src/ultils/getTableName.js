const getTableName = (tableDefault, deviceId = 1, time = Date.now()) => {
  const newDate = new Date(time);

  const tableNumber = Math.ceil(deviceId / 1000);

  return `${tableDefault}_${tableNumber}_${
    newDate.getMonth() + 1
  }_${newDate.getFullYear()}`;
};

module.exports = getTableName;

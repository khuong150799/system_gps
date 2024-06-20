const getTableNameDeviceGps = (deviceId = 1, time = Date.now()) => {
  const newDate = new Date(time);

  const tableNumber = Math.ceil(deviceId / 1000);

  return `tbl_device_gps_${tableNumber}_${
    newDate.getMonth() + 1
  }_${newDate.getFullYear()}`;
};

module.exports = getTableNameDeviceGps;

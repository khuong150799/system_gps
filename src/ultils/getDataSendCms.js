const handleDataAddDeviceCms = ({ devIdno, chnCount }) => {
  return {
    devIdno,
    protocol: "28",
    devType: "7",
    companyName: "MIDVN",
    factoryType: "70",
    channelNum: chnCount,
  };
};

const handleDataAddVehicleCms = ({ vehiIdno, devIdno }) => {
  return {
    vehiIdno,
    devIdno,
    devType: "7",
    companyName: "MIDVN",
    factoryType: "70",
  };
};

const handleDataAddConfigCms = ({ data }) => {
  return {
    Flag: 9,
    TextInfo: data,
    TextType: 1,
    utf8: 1,
  };
};

module.exports = {
  handleDataAddVehicleCms,
  handleDataAddDeviceCms,
  handleDataAddConfigCms,
};

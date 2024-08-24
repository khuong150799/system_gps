// const handleDataAddVehicleCms = ({ vehiIDNO, devIDNO, chnCount }) => {
//   return {
//     vehiIDNO,
//     company: { id: "1", name: "MIDVN" },
//     chnCount,
//     relations: [
//       {
//         device: {
//           devIDNO,
//           factoryType: "70",
//           factoryDevType: "28",
//           devType: "7",
//         },
//         module: 361,
//       },
//     ],
//     simInfo: { cardNum: "" },
//     allowLogin: 0,
//   };
// };

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

module.exports = { handleDataAddVehicleCms, handleDataAddDeviceCms };

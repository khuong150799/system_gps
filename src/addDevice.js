const { default: axios } = require("axios");
const DatabaseModel = require("./models/database.model");
const deviceModel = require("./models/device.model");
const deviceService = require("./services/device.service");

const dataImeis = [
  "08944FE54T",
  "08944FE57T",
  "08944FDCDT",
  "08944FDCCT",
  "08944FDDBT",
  "08944FE02T",
  "08944FEE7T",
  "08F2BA250T",
  //   "08944FDEFT",
  "08944FDDDT",
  "08944FDF9T",
  "08F2BA0DDT",
  "08944FDF0T",
  "08944FE55T",
  "08944FDCET",
  "08F1C5A4ET",
];

const dataLicenseNumber = [
  "50F04253",
  "50F04273",
  "50F04293",
  "50G02607",
  "50G02619",
  "50G02643",
  "50G02648",
  "50G02651",
  //   "50G02658",
  "50G02699",
  "50H26233",
  "50H26580",
  "50H26642",
  "50LD19682",
  "50LD19827",
  "61D01618",
];

let i = 0;
const id = setInterval(async () => {
  if (dataImeis.length === i) {
    return clearInterval(id);
  }
  const item = dataImeis[i];
  try {
    const data = await axios({
      method: "post",
      url: "http://localhost:4000/api/v1/device/activation-inside",
      data: {
        vehicle: dataLicenseNumber[i],
        weight: 4000,
        type: "17",
        warning_speed: 90,
        imei: item,
        quantity_channel: "0",
        service_package_id: "6",
        is_transmission_gps: "1",
        is_transmission_image: "0",
        note: "",
        activation_date: "",
      },
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExMSwicGFyZW50SWQiOjEsImNsaWVudElkIjoiZWE1YTZhODUtZjljYi00YTI4LTkyYTktMjA2NTJhZTQxNGZkIiwicm9sZSI6NDAsImxldmVsIjoxMCwiY3VzdG9tZXJJZCI6OTEsImlhdCI6MTcyMTg3NDM5NCwiZXhwIjoxNzI0NDY2Mzk0fQ.7LUNhMRvwF5Xj7BN8KiJ3LYb5ByTrQWVPWDbb385Xjw",
      },
    });

    console.log(data.data.data);
  } catch (error) {
    console.log(error?.response?.data);
  } finally {
    i++;
  }
}, 3000);

// Promise.all(
//   dataImeis.map((item, i) =>
//     deviceService.activationInside(
//       {
//         vehicle: dataLicenseNumber[i],
//         weight: 4000,
//         type: "17",
//         warning_speed: 90,
//         imei: item,
//         quantity_channel: "0",
//         service_package_id: "6",
//         is_transmission_gps: "1",
//         is_transmission_image: "0",
//         note: "",
//         activation_date: "",
//       },
//       111,
//       1
//     )
//   )
// )
//   .then((data) => console.log(data))
//   .catch((err) => console.log(err));

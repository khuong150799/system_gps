const { default: axios } = require("axios");
const DatabaseModel = require("./models/database.model");
const deviceModel = require("./models/device.model");
const deviceService = require("./services/device.service");

const dataImeis = [
  "08F4A29A3T",
  "08F4A29CET",
  "08F4A2A17T",
  "08F3AE65CT",
  "08F3AE64DT",
  "08F4A2902T",
  "08F4A2A7AT",
  "08F3AE5D4T",
  "089CE59D2T",
  "089CE58DBT",
  "08F4A290ET",
  "08F3AE5CAT",
  "08F3AE641T",
  "08F3AE5D9T",
  "08F3AE668T",
  "08F3AE632T",
  "08F3AE63FT",
  "08F3AE66FT",
  "08F3AE65ET",
  "08F3AE662T",
  "08F3AE5E5T",
  "08F3AE635T",
  "08F4A2922T",
  "08F4A28FBT",
  "08F4A2906T",
  "08F4A2AB4T",
  "08F4A291DT",
  "08F4A28F0T",
  "08F4A28E6T",
  "08F4A28F9T",
  "08F4A2AC7T",
  "08F4A2970T",
  "08F4A28ECT",
  "08F4A2B1FT",
  "08F4A2B0BT",
  "08F4A28EFT",
  "08F4A291BT",
  "08F4A2A74T",
  "08F4A2A14T",
  "08F3AE630T",
  "08F4A2B2AT",
  "08F4A297AT",
  "08F4A2A10T",
  "08F4A28F8T",
  "08F4A2A3CT",
  "08F4A2953T",
  "08F4A2945T",
  "08F4A295ET",
  "08F4A29E0T",
  "08F4A2B11T",
  "08F4A2B01T",
  "08F4A2AB7T",
  "08F4A2AFDT",
  "08F4A28EDT",
  "08F4A2A53T",
  "08F4A29CFT",
  "08F4A2B2ET",
  "08F4A291CT",
  "08F4A29CDT",
  "08F4A297FT",
  "08F4A2914T",
  "08F4A2959T",
  "08F4A28F5T",
  "08F4A2974T",
  "08F4A290AT",
  "08F4A2A42T",
  "08F4A2909T",
  "08F4A28EBT",
  "08F4A2A29T",
];

const dataLicenseNumber = [
  "34F00777",
  "34H03198",
  "29K04463",
  "12A19974",
  "29F01212",
  "29F01215",
  "29F01220",
  "29F01222",
  "29F01250",
  "29F01256",
  "29F01259",
  "29F01262",
  "29F01274",
  "29F01289",
  "30K81125",
  "30K90404",
  "30K92358",
  "30L01146",
  "30L01755",
  "30L12170",
  "30L12382",
  "30L12814",
  "12A14825",
  "12A14923",
  "12A14950",
  "12A14963",
  "12A14997",
  "12A19629",
  "12A19654",
  "12A19694",
  "12A19713",
  "12A19718",
  "12A19728",
  "12B00579",
  "12B00656",
  "12B00662",
  "12B00665",
  "12B00670",
  "12B00673",
  "12B00676",
  "12B00679",
  "12B00684",
  "12B00695",
  "12B00700",
  "12B00742",
  "12B00743",
  "12B00749",
  "29B12605",
  "29B12608",
  "29B12670",
  "29B12785",
  "29B12930",
  "29B14524",
  "29B14546",
  "29B14684",
  "29B40086",
  "29B40164",
  "29B40257",
  "29B40308",
  "29B40385",
  "29B40425",
  "29B60444",
  "29B60592",
  "29F01224",
  "29F01290",
  "29F01293",
  "30F67011",
  "30Y2916",
  "31F1870",
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
        Authorization: "Bearer token",
      },
    });

    console.log(data.data.data);
  } catch (error) {
    console.log(error?.response?.data);
  } finally {
    i++;
  }
}, 1000);

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

// for (let i = 0; i < dataImeis.length; i++) {
//   const imei = dataImeis[i];
//   setInterval(async () => {
//     await deviceService.register({ dev_id: imei, imei, model_id: 3 }, 1);
//   }, 500);
// }

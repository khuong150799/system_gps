const { default: axios } = require("axios");
const DatabaseModel = require("./models/database.model");
const deviceModel = require("./models/device.model");
const deviceService = require("./services/device.service");
const ordersService = require("./services/orders.service");

const dataImeis = [
  "089914D09T",
  "08F1C5A56T",
  "08F2B9EC7T",
  "089914CEET",
  "08F1C5B36T",
  "08F2BA122T",
  "08F2BA156T",
  "08F2BA0C9T",
  "089AFD341T",
  "08F68B352T",
  "08F1C5A59T",
  "08944FE06T",
  "08944FE46T",
  "08F1C5B9AT",
  "08F1C5A97T",
  "089CE5993T",
  "089AFD348T",
  "089AFD34CT",
  "089CE5937T",
  "089AFD30AT",
  "08F2B9E7ET",
  "08F2B9EC8T",
  "08F1C5A79T",
  "08F2BA19ET",
  "08F2BA1C9T",
  "08F1C5BF4T",
  "08F2B9F36T",
  "08F2BA07DT",
  "08F1C5C1AT",
  "08F2B9F09T",
  "08F2BA1F3T",
  "08F2BA095T",
  "08F1C5C15T",
  "08F2BA24AT",
  "08F2BA22DT",
  "08F2BA014T",
  "08F2BA24CT",
  "08F68B318T",
  "08F2B9FC2T",
  "08F2BA1A1T",
  "08F1C5A5FT",
  "08F1C5B12T",
  "08F2BA05FT",
  "08F1C5BD5T",
  "08F2BA07BT",
  "089CE5944T",
  "08F1C5A8BT",
  "08F1C5A72T",
  "08F2B9F69T",
  "089CE59A1T",
  "089AFD352T",
  "089AFD35CT",
  "089CE59A3T",
  "08F1C5A69T",
  "08F1C5A76T",
  "089914D6AT",
  "08944FE3BT",
  "08F1C5C27T",
  "08F1C5A55T",
  "08F2BA10DT",
  "089914D18T",
  "08F1C5A89T",
  "089CE5919T",
  "08F2BA0B4T",
  "08944FE13T",
  "08F1C5AD4T",
  "089CE599AT",
  "08944FE1AT",
  "08944FDFAT",
  "08944FE6ET",
  "08F1C5A66T",
  "08F2BA1A7T",
  "08F1C5ADDT",
  "08F1C5A8FT",
  "08944FE3ET",
  "08944FE4FT",
  "089CE5996T",
  "08F2BA23FT",
  "08F2BA217T",
  "089CE593DT",
  "08F2BA0D3T",
  "08F1C5BC1T",
  "08F2BA0BCT",
  "08F2BA248T",
  "08F2BA1D5T",
  "08F2BA14ET",
  "08F2BA191T",
  "08F2BA23AT",
  "08F2BA0F5T",
  "08F1C5B71T",
  "08F2BA0A4T",
  "08F2BA0E1T",
  "08F2BA08CT",
  "08F2BA1F9T",
  "08F1C5B31T",
  "08F2BA204T",
  "08F2BA08DT",
  "08F2BA0DAT",
  "08F2BA0A0T",
  "08F2BA20CT",
  "08F2BA079T",
  "08F1C5BCDT",
  "08F1C5B7AT",
  "08F1C5BD2T",
  "08F1C5B9FT",
  "08F2BA1A9T",
  "08F2BA10FT",
  "08F2BA0C5T",
  "08F1C5BDBT",
  "08F2BA129T",
  "08F1C5B96T",
  "08F2BA251T",
  "08F2BA15ET",
  "08F2BA1FET",
  "08F1C5B74T",
  "08F2BA0B2T",
  "08F2BA16DT",
  "08F1C5BD4T",
  "08F2BA1C4T",
  "08F1C5B8CT",
  "08F2BA18DT",
  "08F2BA137T",
  "08F2BA1CCT",
  "08F2BA211T",
  "08F1C5B3DT",
  "08F2BA23DT",
  "08F2BA1C0T",
  "08F2BA09ET",
  "08F2BA18FT",
  "08F1C5B53T",
  "08F1C5BB4T",
  "08F2BA092T",
  "08F1C5B7FT",
  "08F1C5BCFT",
  "08F1C5B42T",
  "08F1C5BD6T",
  "08F2BA215T",
  "08F1C5B4BT",
  "08F1C5B8BT",
  "08F1C5B49T",
  "08F2BA228T",
  "08F1C5B28T",
  "08F2BA240T",
  "08F4A2AC1T",
  "08F4A2A59T",
  "08F68AFEAT",
  "08F4A2AACT",
  "089AFD365T",
  "08F68AFE0T",
  "08F4A2A70T",
  "08F4A2A98T",
  "08F4A2A61T",
  "08F4A2ABBT",
  "08F4A2ADCT",
  "08F4A2AA5T",
  "08F4A28D6T",
  "08F4A29E1T",
  "08F4A2A9BT",
  "08F4A2AD7T",
  "08F4A2ABDT",
  "08F4A29F4T",
  "08F4A2A62T",
  "08F4A2AD0T",
  "08F4A2A4CT",
  "08F4A2AD9T",
  "08F4A29ADT",
  "08F68AFF3T",
  "08F68AFE5T",
  "08F68AFEDT",
  "08F4A2A71T",
];

const dataLicenseNumber = [
  "36A89156",
  "36C41925",
  "37E00512",
  "47H02540",
  "47H05111",
  "49H03532",
  "50E00574",
  "50E02302",
  "50E02526",
  "50E02706",
  "50H11784",
  "50H25803",
  "50H26392",
  "50H26911",
  "50H28742",
  "50H28894",
  "50H31786",
  "50H34296",
  "50H34503",
  "50H34713",
  "50H34878",
  "50H39062",
  "50H42007",
  "50H42116",
  "50H42242",
  "50H42427",
  "50H42594",
  "50H42778",
  "50H43661",
  "50H44384",
  "50H45796",
  "50H48826",
  "50H48849",
  "50H48919",
  "50H49043",
  "50H49107",
  "50H49144",
  "50H49366",
  "50H49393",
  "50H49778",
  "50H49871",
  "50H50145",
  "50H50660",
  "50H50793",
  "51C09399",
  "51C25729",
  "51C72752",
  "51C81249",
  "51D56922",
  "51F44387",
  "51F84945",
  "51F87951",
  "51G10054",
  "51G12480",
  "51G26427",
  "51G34062",
  "51G57088",
  "51G59169",
  "51G63046",
  "51G95097",
  "51H13620",
  "51H19483",
  "51H53752",
  "51H92981",
  "51K01744",
  "60C26086",
  "60H15038",
  "61A66635",
  "61C01970",
  "61C28617",
  "61E01625",
  "61E01933",
  "61E02720",
  "61E03828",
  "61H04095",
  "61K23239",
  "63H03791",
  "64H02974",
  "66G00384",
  "68E00560",
  "68E00596",
  "77A00551",
  "77A05266",
  "77A06133",
  "77A07164",
  "77A07416",
  "77A08074",
  "77A09848",
  "77A10316",
  "77A12139",
  "77A12232",
  "77A13134",
  "77A13190",
  "77A13359",
  "77A13836",
  "77A14249",
  "77A15442",
  "77A16854",
  "77A18163",
  "77A18394",
  "77A20321",
  "77A29163",
  "77E00035",
  "77E00036",
  "77E00061",
  "77E00140",
  "77E00168",
  "77E00452",
  "77E00640",
  "77E00695",
  "77E00812",
  "77E01144",
  "77F00720",
  "77F00726",
  "77F00747",
  "77F00798",
  "77F00809",
  "77H05014",
  "77H05041",
  "77H05051",
  "77H05132",
  "77H05194",
  "77H05251",
  "77H05477",
  "77H05479",
  "77H05520",
  "77H05539",
  "77H05564",
  "77H05579",
  "77H05649",
  "77H05812",
  "77H05869",
  "77H05870",
  "77H05889",
  "77H05916",
  "77H05917",
  "77H05949",
  "77H05956",
  "77H05959",
  "77H05978",
  "77H05983",
  "78A06435",
  "81H02128",
  "86A08963",
  "86A10763",
  "86A21284",
  "86E00140",
  "86E00200",
  "86E00296",
  "86E00372",
  "86E00413",
  "86E00456",
  "86F00496",
  "86G00043",
  "86G00099",
  "86H01991",
  "86H02240",
  "86H02258",
  "86H02301",
  "86H02307",
  "86H02313",
  "86H02316",
  "86H02336",
  "86H02339",
  "86H02344",
  "86H02418",
  "86H02465",
  "86H02491",
  "86H02492",
  "92H03301",
];

let i = 0;
const id = setInterval(async () => {
  if (dataImeis.length === i) {
    return clearInterval(id);
  }
  console.log("i", i);
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
        is_use_gps: 1,
        is_is_check_exited: 1,
      },
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjM1LCJwYXJlbnRJZCI6MSwiY2xpZW50SWQiOiJkZWViYWE1Ny1hYThmLTQ5OGUtYThmMC01ZjU4YmQ1NjA2YTkiLCJyb2xlIjo0MCwibGV2ZWwiOjEwLCJjdXN0b21lcklkIjoyNSwiaWF0IjoxNzIzMDA3MTUxLCJleHAiOjE3MjU1OTkxNTF9.1ng6r5fbSRtB2ch1N6O0yb3FxDdWvtYygs_vXXcCHwo",
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
//     try {
//       await deviceService.register({ dev_id: imei, imei, model_id: 3 }, 1, {
//         user_id: 1,
//         ip: null,
//         os: null,
//         gps: null,
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   }, 500);
// }

// const a = async (imei) => {
//   try {
//     const data = await deviceService.selectId(imei);
//     console.log("data", data);
//     const listId = data.map((item) => item.id);

//     console.log(JSON.stringify(listId, null, 2));
//   } catch (error) {
//     console.log(error);
//   }
// };

// a(dataImeis);

// const listId = [
//   1490, 1492, 1494, 1496, 1498, 1500, 1502, 1504, 1506, 1508, 1510, 1512, 1514,
//   1516, 1518, 1520, 1522, 1524, 1526, 1528, 1530, 1532, 1534, 1536, 1538, 1542,
//   1544, 1546, 1548, 1550, 1552, 1554, 1556, 1558, 1560, 1562, 1564, 1566, 1568,
//   1570, 1572, 1574, 1576, 1578, 1580, 1582, 1584, 1586, 1588, 1590, 1592, 1594,
//   1596, 1598, 1600, 1602, 1604, 1606, 1608, 1610, 1612, 1614, 1620, 1622, 1624,
//   1626, 1628, 1630, 1632, 1634, 1636, 1638, 1640, 1642, 1644, 1646, 1648, 1650,
//   1652, 1654, 1656, 1658, 1660, 1662, 1664, 1666, 1668, 1670, 1672, 1674, 1676,
//   1678, 1680, 1682, 1684, 1686, 1688, 1690, 1692, 1694, 1696, 1698, 1700, 1702,
//   1704, 1706, 1708, 1710, 1712, 1714, 1716, 1718, 1720, 1722, 1724, 1726, 1728,
//   1730, 1732, 1734, 1736, 1738, 1740, 1742, 1744, 1746, 1748, 1750, 1752, 1754,
//   1756, 1758, 1760, 1762, 1764, 1766, 1768, 1770, 1772, 1774, 1776, 1778, 1780,
//   1782, 1784, 1786, 1788, 1790, 1792, 1794, 1796, 1798, 1800, 1802, 1804, 1806,
//   1808, 1814, 1816, 1818, 1822, 1824, 1826, 1828, 1830, 1832, 1842, 1846, 1848,
// ];

// const dataOrder = {
//   code: "2024080701",
//   reciver: "25",
//   note: "Đơn hàng được lên cho Loca",
//   devices_id: JSON.stringify(listId),
// };

// const a = async (dataOrder) => {
//   try {
//     await ordersService.register(dataOrder, 1, 5);
//   } catch (error) {
//     console.log(error);
//   }
// };

// a(dataOrder);
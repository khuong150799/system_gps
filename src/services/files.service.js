const filesApi = require("../api/files.api");
const {
  TOO_MANY_FILE,
  FIRMWARE_OVER_SIZE,
  SERVER_ERROR,
  IMAGE_TYPE_FAIL,
  ERROR,
} = require("../constants/msg.constant");

class FilesService {
  saveFirmware(firmwareFile = [], lengthFile, param) {
    return new Promise(async (resolve, reject) => {
      const firmwareBuffer = [];
      // console.log("firmwareFile.length", firmwareFile.length);

      if (firmwareFile?.length) {
        if (firmwareFile.length > lengthFile) {
          return reject({
            msg: ERROR,
            errors: [{ msg: TOO_MANY_FILE, param }],
          });
        }
        const arrBigFile = [];
        const arrTypeFail = [];
        firmwareFile.forEach((item, i) => {
          if (item.size > 2 * 1024 * 1024) {
            arrBigFile.push(i + 1);
          }
          const math = ["bin", "txt"];
          const type =
            item?.originalname?.split(".")[
              item?.originalname?.split(".")?.length - 1
            ];
          if (math.indexOf(type) === -1) {
            arrTypeFail.push(i + 1);
          }
          firmwareBuffer.push({
            buffer: item?.buffer,
            originalname: item?.originalname,
            param,
          });
        });
        if (arrBigFile.length) {
          return reject({
            msg: ERROR,
            errors: [
              {
                msg: `Firmware thứ ${arrBigFile.join(
                  ","
                )} ${FIRMWARE_OVER_SIZE}`,
                param,
              },
            ],
          });
        }
        if (arrTypeFail.length) {
          return reject({
            msg: ERROR,
            errors: [
              {
                msg: `Firmware thứ ${arrBigFile.join(",")} ${IMAGE_TYPE_FAIL}`,
                param,
              },
            ],
          });
        }
      }
      const dataSend = {
        firmware: JSON.stringify(firmwareBuffer),
      };
      filesApi
        .upload(dataSend)
        .then((response) => {
          if (!response.result) {
            return reject({ msg: SERVER_ERROR });
          }
          // console.log('response', response);
          // return res.send({ ressult: true, data: response });
          if (response.data?.length > 0) {
            return resolve(response.data);
          }
          return resolve([]);
        })
        .catch((err) => reject({ msg: SERVER_ERROR }));
    });
  }

  deleteFirmware(paths) {
    return new Promise(async (resolve, reject) => {
      const response = await filesApi.delete({ path: JSON.stringify(paths) });

      if (!response.result) {
        return reject({ msg: constantNotify.ERROR });
      }
      return resolve(true);
    });
  }
}

module.exports = new FilesService();

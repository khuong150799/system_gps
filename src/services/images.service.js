const imageApi = require("../api/image.api");
const {
  TOO_MANY_FILE,
  IMAGE_OVER_SIZE,
  SERVER_ERROR,
  IMAGE_TYPE_FAIL,
  ERROR,
} = require("../constants/msg.constant");

class ImagesService {
  saveImage(imageFile = [], lengthFile, param) {
    return new Promise(async (resolve, reject) => {
      const imageBuffer = [];
      console.log("imageFile.length", imageFile.length);

      if (imageFile?.length) {
        if (imageFile.length > lengthFile) {
          return reject({
            msg: ERROR,
            errors: [{ msg: TOO_MANY_FILE, param }],
          });
        }
        const arrBigFile = [];
        const arrTypeFail = [];
        imageFile.forEach((item, i) => {
          if (item.size > 2 * 1024 * 1024) {
            arrBigFile.push(i + 1);
          }
          const math = ["png", "jpeg", "jpg", "webp"];
          const type =
            item?.originalname?.split(".")[
              item?.originalname?.split(".")?.length - 1
            ];
          if (math.indexOf(type) === -1) {
            arrTypeFail.push(i + 1);
          }
          imageBuffer.push({
            buffer: item?.buffer,
            originalname: `${Date.now()}_${item?.originalname}`,
            param,
          });
        });
        if (arrBigFile.length) {
          return reject({
            msg: ERROR,
            errors: [
              {
                msg: `Hình ảnh thứ ${arrBigFile.join(",")} ${IMAGE_OVER_SIZE}`,
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
                msg: `Hình ảnh thứ ${arrBigFile.join(",")} ${IMAGE_TYPE_FAIL}`,
                param,
              },
            ],
          });
        }
      }
      const dataSend = {
        image: JSON.stringify(imageBuffer),
      };
      imageApi
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

  deleteImage(paths) {
    return new Promise(async (resolve, reject) => {
      const response = await imageApi.delete({ path: JSON.stringify(paths) });

      if (!response.result) {
        return reject({ msg: constantNotify.ERROR });
      }
      return resolve(true);
    });
  }
}

module.exports = new ImagesService();

class ImageService {
  save(
    imageFile = [],
    width_pc = 300,
    height_pc = 300,
    width_mobile = 150,
    height_mobile = 150,
    isMain = true,
    type = 1
  ) {
    return new Promise(async (resolve, reject) => {
      const imageBuffer = [];

      if (imageFile?.length) {
        if (imageFile.length > 6) {
          return reject({
            msg: `${constantNotify.VALIDATE_FILE_COUNT} 6 hình`,
            param: "image",
          });
        }
        const arrBigFile = [];
        imageFile.forEach((item, i) => {
          if (item.size > 2 * 1024 * 1024) {
            arrBigFile.push(i + 1);
          }
          if (isMain) {
            if (i === 0) {
              imageBuffer.push({
                buffer: item?.buffer,
                originalname: `${Date.now()}_${item?.originalname}`,
                name: "image_main",
              });
            } else {
              imageBuffer.push({
                buffer: item?.buffer,
                originalname: `${Date.now()}_${item?.originalname}`,
                name: "image_detail",
              });
            }
          } else {
            imageBuffer.push({
              buffer: item?.buffer,
              originalname: `${Date.now()}_${item?.originalname}`,
              name: "image",
            });
          }
        });
        if (arrBigFile.length) {
          return reject({
            msg: `Hình ảnh thứ ${arrBigFile.join(",")} ${
              constantNotify.VALIDATE_FILE_SIZE_WITH_INDEX
            }`,
            param: "image",
          });
        }
      }
      const dataSend = {
        type,
        width_pc,
        height_pc,
        width_mobile,
        height_mobile,
        image: JSON.stringify(imageBuffer),
      };
      const response = await imageApi.upload(dataSend);
      if (!response.result) {
        return reject({ msg: constantNotify.ERROR });
      }
      // console.log('response', response);
      // return res.send({ ressult: true, data: response });
      if (response.data?.length > 0) {
        const resultImg = response.data.reduce((result, item) => {
          if (item.type !== 1) {
            const key = item.originalname;
            if (!result[key]) {
              result[key] = [];
            }

            result[key].push(`${item.url}`);
          }
          if (!result.allPath) {
            result.allPath = [];
          }
          result.allPath = [...result.allPath, `./uploads/${item.url}`];

          if (!result.name) {
            result.name = { main: false, detail: false };
          }
          if (item.name === "image_main" && !result.name.main) {
            result.name.main = true;
          }
          if (item.name === "image_detail" && !result.name.detail) {
            result.name.main = true;
          }

          return result;
        }, {});

        return resolve(resultImg);
      }
      return resolve({});
    });
  }

  delete(paths) {
    return new Promise(async (resolve, reject) => {
      const response = await imageApi.delete({ path: JSON.stringify(paths) });

      if (!response.result) {
        return reject({ msg: constantNotify.ERROR });
      }
      return resolve(true);
    });
  }
}

module.exports = new ImageService();

const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");

const { tableInterface } = require("../constants/tableName.constant");
const validateModel = require("../models/validate.model");
const interfaceAppModel = require("../models/interfaceApp.model");
const imagesService = require("./images.service");
const imageApi = require("../api/image.api");
const { ERROR, VALIDATE_DATA } = require("../constants/msg.constant");
const { REDIS_KEY_LIST_INTERFACE } = require("../constants/redis.constant");
const cacheModel = require("../models/cache.model");

class InterfaceService {
  async handleImg(
    logoFile,
    faviconFile,
    bannerFiles,
    register = true,
    contentProperty
  ) {
    const arrPromiseSaveFiles = [];
    if (logoFile) {
      arrPromiseSaveFiles.push(imagesService.saveImage(logoFile, 1, "logo"));
    }
    if (faviconFile) {
      arrPromiseSaveFiles.push(
        imagesService.saveImage(faviconFile, 1, "favicon")
      );
    }
    if (bannerFiles) {
      arrPromiseSaveFiles.push(
        imagesService.saveImage(bannerFiles, 5, "banner")
      );
    }
    let img = {};
    if (arrPromiseSaveFiles.length) {
      const resultImg = await Promise.all(arrPromiseSaveFiles);
      if (resultImg.length) {
        img = resultImg.reduce((result, item) => {
          if (logoFile && !result.logo) {
            result.logo = item[0];
          } else if (faviconFile && !result.favicon) {
            result.favicon = item[0];
          } else {
            for (let i = 0; i < item.length; i++) {
              const banner = item[i];
              if (register) {
                result[`banner${i + 1}`] = banner;
              } else {
                result[contentProperty[i]] = banner;
              }
            }
          }
          return result;
        }, {});
      }
    }
    return img;
  }

  //getallrow
  async getallrows(query) {
    try {
      const { keyword } = query;
      const cache = await cacheModel.hgetRedis(
        REDIS_KEY_LIST_INTERFACE,
        keyword
      );
      if (cache) return { data: cache, totalPage: 1, totalRecord: 0 };

      const { conn } = await db.getConnection();
      try {
        const data = await interfaceAppModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await interfaceAppModel.getById(conn, params, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, logoFile, faviconFile, bannerFiles) {
    try {
      const { conn } = await db.getConnection();
      let img = {};
      try {
        const { name, keyword, content, publish } = body;

        await validateModel.checkExitValue(
          conn,
          tableInterface,
          "keyword",
          keyword,
          "Từ khoá",
          "keyword"
        );

        await validateModel.checkExitValue(
          conn,
          tableInterface,
          "name",
          name,
          "Tên",
          "name"
        );

        // console.log("content", content);
        const contentParse = JSON.parse(content);
        // console.log("contentParse", contentParse);
        if (typeof contentParse !== "object")
          throw {
            msg: ERROR,
            errors: [{ msg: VALIDATE_DATA, value: content, param: "content" }],
          };

        img = await this.handleImg(logoFile, faviconFile, bannerFiles);

        const data = await interfaceAppModel.register(conn, {
          keyword,
          name,
          content: { ...contentParse, ...img },
          publish,
        });
        return data;
      } catch (error) {
        if (Object.keys(img).length) {
          const listPath = Object.values(img);
          await imageApi.delete({ path: JSON.stringify(listPath) });
        }
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //uploadImage
  async uploadImage(body, logoFile, faviconFile, bannerFiles) {
    try {
      const { conn, connPromise } = await db.getConnection();
      let img = {};
      try {
        const { property } = body;
        const contentProperty = JSON.parse(property || "[]");
        if (!Array.isArray(contentProperty) && property)
          throw {
            msg: ERROR,
            errors: [
              { msg: VALIDATE_DATA, value: property, param: "property" },
            ],
          };
        img = await this.handleImg(
          logoFile,
          faviconFile,
          bannerFiles,
          false,
          contentProperty
        );

        const data = await interfaceAppModel.uploadImage(
          conn,
          connPromise,
          body,
          img
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
        if (Object.keys(img).length) {
          const listPath = Object.values(img);
          await imageApi.delete({ path: JSON.stringify(listPath) });
        }
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;

        const { name, keyword } = body;

        await validateModel.checkExitValue(
          conn,
          tableInterface,
          "keyword",
          keyword,
          "Từ khoá",
          "keyword",
          id
        );

        await validateModel.checkExitValue(
          conn,
          tableInterface,
          "name",
          name,
          "Tên",
          "name",
          id
        );

        const data = await interfaceAppModel.updateById(
          conn,
          connPromise,
          body,
          params
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await interfaceAppModel.deleteById(conn, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //deleteImage
  async deleteImage(body) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { path } = body;
        await connPromise.beginTransaction();
        await interfaceAppModel.deleteImage(conn, body);
        await imageApi.delete({ path: JSON.stringify([path]) });
        await connPromise.commit();
        return [];
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await interfaceAppModel.updatePublish(conn, body, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new InterfaceService();

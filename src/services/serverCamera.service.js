const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const serverCameraModel = require("../models/serverCamera.model");
const { tableServerCamera } = require("../constants/tableName.constant");
const configureEnvironment = require("../config/dotenv.config");
const { SV_NOTIFY } = configureEnvironment();
const { fork } = require("child_process");

class ServerCameraService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await serverCameraModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      // console.log("error", error?.code);
      if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED") {
        const url = error?.config?.url;
        // console.log("url", url);

        if (url) {
          try {
            const arrUrl = url.split(":");
            const domain = `${arrUrl[0]}:${arrUrl[1]}`;
            if (SV_NOTIFY) {
              const process = fork(`./src/process/notify.process.js`);

              process.send({
                data: {
                  dataUsers: [{ user_id: 1 }],
                  keyword: "6_1_1",
                  replaces: { sv_cam: domain, error_code: error.code },
                  sv: SV_NOTIFY,
                },
              });
            }

            // console.log("domain", domain);
            const { data } = await serverCameraModel.getallrows(db.db, {
              limit: 1,
              keyword: domain,
              publish: 1,
            });
            // console.log("data", data);

            if (data?.length) {
              await serverCameraModel.updatePublish(
                db.db,
                { publish: 0 },
                { id: data[0]?.id }
              );
              const dataSvcam = await this.getallrows({
                limit: 9999,
                type: 1,
              });

              return dataSvcam;
            }
          } catch (error) {
            console.log("error", error);

            throw new BusinessLogicError(error.msg);
          }
        }
      }
      console.log(1111, error);

      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await serverCameraModel.getById(conn, params, query);
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
  async register(body) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { ip } = body;

        await validateModel.checkExitValue(
          conn,
          tableServerCamera,
          "ip",
          ip,
          "IP",
          "ip"
        );

        const data = await serverCameraModel.register(conn, connPromise, body);
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { ip } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableServerCamera,
          "ip",
          ip,
          "IP",
          "ip",
          id
        );

        const data = await serverCameraModel.updateById(
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
      const { conn, connPromise } = await db.getConnection();
      try {
        await serverCameraModel.deleteById(conn, connPromise, params);
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
        await serverCameraModel.updatePublish(conn, body, params);
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

module.exports = new ServerCameraService();

const DatabaseModel = require("./database.model");
const { tableServerCamera } = require("../constants/tableName.constant");
const ServerCameraSchema = require("./schema/serverCamera.schema");
const { login } = require("../api/camera.api");
const configureEnvironment = require("../config/dotenv.config");
const { REDIS_KEY_SV_CAM } = require("../constants/redis.constant");
const cacheModel = require("./cache.model");
const { ACCOUNT_CMS, PASSWORD_CMS } = configureEnvironment();

class ServerCameraModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const {
      offset = 0,
      limit = 10,
      is_deleted: isDeleted = 0,
      type,
      keyword,
      publish,
    } = query;

    let where = `is_deleted = ?`;
    const conditions = [isDeleted];
    // let where = `1 = ?`;
    // const conditions = [1];

    if (keyword) {
      where += ` AND (host LIKE ? OR ip LIKE ?)`;
      conditions.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (publish) {
      where += ` AND publish = ?`;
      conditions.push(publish);
    }

    if (type) {
      where += ` AND publish = ?`;
      conditions.push(1);
    }

    const select = "id,ip,host,port,publish,created_at,updated_at";
    const [rows, count] = await Promise.all([
      this.select(
        conn,
        tableServerCamera,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableServerCamera, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);
    // console.log("rows", rows);

    if (!type || !rows?.length)
      return { data: rows, totalPage, totalRecord: count?.[0]?.total };

    const loginPromises = rows.map(({ host, port }) => {
      const baseUrl = `${host}:${port}`;
      const token = global[baseUrl] || {};
      const { session, exp } = token;

      if (!session || Date.now() > exp) {
        return login({
          account: ACCOUNT_CMS,
          password: PASSWORD_CMS,
          baseUrl,
        });
      }

      return Promise.resolve({ jsession: session, exp });
    });

    const loginResults = await Promise.all(loginPromises);

    const dataRes = rows.map((item, index) => {
      const { jsession, exp } = loginResults[index];
      const baseUrl = `${item.host}:${item.port}`;

      if (jsession) {
        item.token = jsession;
        global[baseUrl] = {
          session: jsession,
          exp: exp || Date.now() + 2 * 3600000,
        };
      }
      return item;
    });

    return { data: dataRes, totalPage, totalRecord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,host,ip,port,publish`;

    const res_ = await this.select(
      conn,
      tableServerCamera,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, body) {
    const { ip, host, port, publish } = body;
    const serverCamera = new ServerCameraSchema({
      ip,
      host,
      port,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete serverCamera.updated_at;

    await connPromise.beginTransaction();

    const res_ = await this.insert(conn, tableServerCamera, serverCamera);
    await cacheModel.hsetRedis(
      REDIS_KEY_SV_CAM,
      res_,
      { ip, host, port },
      true
    );

    await connPromise.commit();

    serverCamera.id = res_;
    delete serverCamera.is_deleted;
    return serverCamera;
  }

  //update
  async updateById(conn, connPromise, body, params) {
    const { ip, host, port, publish } = body;
    const { id } = params;

    const serverCamera = new ServerCameraSchema({
      ip,
      host,
      port,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete serverCamera.created_at;
    delete serverCamera.is_deleted;

    await connPromise.beginTransaction();

    await this.update(conn, tableServerCamera, serverCamera, "id", id);
    await cacheModel.hsetRedis(REDIS_KEY_SV_CAM, id, { ip, host, port }, true);

    await connPromise.commit();
    serverCamera.id = id;
    return serverCamera;
  }

  //delete
  async deleteById(conn, connPromise, params) {
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(conn, tableServerCamera, { is_deleted: 1 }, "id", id);
    await cacheModel.hdelOneKeyRedis(REDIS_KEY_SV_CAM, id, true);

    await connPromise.commit();

    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableServerCamera, { publish }, "id", id);
    return [];
  }
}

module.exports = new ServerCameraModel();

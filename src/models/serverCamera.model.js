const DatabaseModel = require("./database.model");
const { tableServerCamera } = require("../constants/tableName.constant");
const ServerCameraSchema = require("./schema/serverCamera.schema");
const { login } = require("../api/camera.api");
const configureEnvironment = require("../config/dotenv.config");
const { hSet } = require("./redis.model");
const { REDIS_KEY_SV_CAM } = require("../constants/redis.constant");
const { ACCOUNT_CMS, PASSWORD_CMS } = configureEnvironment();

class ServerCameraModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    const type = query.type;
    let where = `is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (host LIKE ? OR ip LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = "id,ip,host,port,publish,created_at,updated_at";
    const [res_, count] = await Promise.all([
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

    let dataRes = res_;

    if (type && res_?.length) {
      const dataToken = await Promise.all(
        res_.map((item) =>
          login({
            account: ACCOUNT_CMS,
            password: PASSWORD_CMS,
            baseUrl: `${item.host}:${item.port}`,
          })
        )
      );
      dataRes = res_.map((item, i) => {
        const { jsession } = dataToken[i];
        if (jsession) {
          item.token = jsession;
        }
        return item;
      });
    }

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
  async register(conn, body) {
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

    const res_ = await this.insert(conn, tableServerCamera, serverCamera);
    await hSet(
      REDIS_KEY_SV_CAM,
      res_.toString(),
      JSON.stringify({ ip, host, port })
    );
    serverCamera.id = res_;
    delete serverCamera.is_deleted;
    return serverCamera;
  }

  //update
  async updateById(conn, body, params) {
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

    await this.update(conn, tableServerCamera, serverCamera, "id", id);
    await hSet(
      REDIS_KEY_SV_CAM,
      id.toString(),
      JSON.stringify({ ip, host, port })
    );
    serverCamera.id = id;
    return serverCamera;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableServerCamera, { is_deleted: 1 }, "id", id);
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

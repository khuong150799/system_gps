const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const vehicleModel = require("../models/vehicle.model");
const {
  tableVehicle,
  tableDevice,
  tableDeviceVehicle,
  tableServicePackage,
  tableUserDevice,
  tableOrders,
  tableOrdersDevice,
} = require("../constants/tableName.constant");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const { NOT_OWN, NOT_EXITS } = require("../constants/msg.constant");

const dataBaseModel = new DatabaseModel();

class vehicleService {
  async updateName(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableVehicle,
          "name",
          name,
          "ID",
          "name",
          id
        );

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
          INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,v.name,d.id as device_id",
          "v.id = ? AND d.device_status_id = 3",
          id,
          "d.id"
        );

        console.log("body", body);

        const data = await vehicleModel.updateName(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  async updatePackage(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await vehicleModel.updatePackage(conn, body, params);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }

  async updateById(body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei",
          "v.id = ?",
          id,
          "d.id"
        );
        const data = await vehicleModel.updateById(
          conn,
          connPromise,
          body,
          params,
          dataInfo
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
      throw new BusinessLogicError(error.msg);
    }
  }

  async updateExpiredOn(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        // console.log(id, device_id);

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,dv.expired_on",
          "v.id = ? AND d.id = ?",
          [id, device_id],
          "d.id"
        );
        const data = await vehicleModel.updateExpiredOn(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //updateActivationDate
  async updateActivationDate(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,dv.activation_date",
          "v.id = ? AND d.id = ?",
          [id, device_id],
          "d.id"
        );
        const data = await vehicleModel.updateActivationDate(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //updateWarrantyExpiredOn
  async updateWarrantyExpiredOn(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,dv.warranty_expired_on",
          "v.id = ? AND d.id = ?",
          [id, device_id],
          "d.id"
        );
        const data = await vehicleModel.updateWarrantyExpiredOn(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  async delete(query, params, userId, customerId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { device_id } = query;
        const { id } = params;

        const joinTableVehicle = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
          INNER JOIN ${tableUserDevice} ud ON dv.device_id = ud.device_id`;

        const seletInfoVehicle = `v.name as vehicle_name,ud.id as user_device_id`;

        const [idUd, countDevice] = await Promise.all([
          dataBaseModel.select(
            conn,
            joinTableVehicle,
            seletInfoVehicle,
            "v.is_deleted = 0 AND dv.is_deleted = 0 AND ud.user_id = ? AND ud.device_id = ? AND ud.is_main = ?",
            [userId, device_id, 1],
            "ud.id"
          ),
          dataBaseModel.count(
            conn,
            tableDeviceVehicle,
            "*",
            "vehicle_id = ? AND is_deleted = ?",
            [id, 0]
          ),
        ]);

        if (!idUd?.length) throw { msg: `Phương tiện ${NOT_OWN}` };

        const quantityDevice = countDevice?.[0]?.total;

        const joinTableCustomerOrders = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;

        const selectInfoOrders = `o.id as orders_id, od.id as od_id`;

        const whereOrders = `o.creator_customer_id = ? AND od.device_id = ?`;

        const inforOrder = await dataBaseModel.select(
          conn,
          joinTableCustomerOrders,
          selectInfoOrders,
          whereOrders,
          [customerId, device_id],
          "o.id"
        );

        console.log("inforOrder", inforOrder);
        let listOrdersId = [];
        if (inforOrder?.length) {
          const { od_id } = inforOrder[0];
          const joinTableOrder = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;
          const select = "o.id";
          const where = "od.id >= ? AND device_id = ?";
          const allOrders = await dataBaseModel.select(
            conn,
            joinTableOrder,
            select,
            where,
            [od_id, device_id],
            "od.id",
            "ASC"
          );

          listOrdersId = allOrders?.map((item) => item.id);

          console.log("listOrdersId", listOrdersId);
        }

        const data = await vehicleModel.delete(
          conn,
          connPromise,
          params,
          query,
          quantityDevice,
          inforOrder,
          listOrdersId,
          idUd,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //guarantee
  async guarantee(body, params, userId, customerId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id: vehicle_id } = params;
        const { device_id_old, device_id_new } = body;

        console.log(device_id_old, device_id_new);

        const dataCheckSameUser = await dataBaseModel.select(
          conn,
          tableUserDevice,
          "user_id,is_moved,device_id",
          `device_id IN (?) AND is_deleted = 0`,
          [[device_id_old, device_id_new]]
        );
        console.log("dataCheckSameUser", dataCheckSameUser);

        if (dataCheckSameUser?.length <= 1)
          throw { msg: `Thiết bị ${NOT_OWN}` };

        let owner = false;

        for (let i = 0; i < dataCheckSameUser.length; i++) {
          const item = dataCheckSameUser[i];
          // console.log(
          //   "owner && item.is_moved == 0 && item.user_id == owner",
          //   owner && item.is_moved == 0 && item.user_id == owner
          // );

          if (owner && item.is_moved == 0 && item.user_id == owner) {
            owner = true;
            break;
          }
          if (item.is_moved == 0) {
            owner = item.user_id;
          }
        }

        if (
          typeof owner !== "boolean" ||
          (typeof owner === "boolean" && !owner)
        )
          throw { msg: `Thiết bị ${NOT_OWN}` };

        const jointableUsersDevicesWithDeviceVehicle = `${tableDevice} d LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id`;
        const whereJointableUsersDevicesWithDeviceVehicle = `d.id IN (?)`;
        const conditionJointableUsersDevicesWithDeviceVehicle = [
          [device_id_old, device_id_new],
        ];
        const selectJointableUsersDevicesWithDeviceVehicle = `d.imei,dv.id as dv_id,dv.vehicle_id,dv.service_package_id,dv.expired_on,dv.activation_date,dv.warranty_expired_on,dv.is_use_gps,dv.type,
    dv.quantity_channel,dv.quantity_channel_lock,dv.is_transmission_gps,dv.is_transmission_image,dv.is_deleted`;

        const infoDevice = await dataBaseModel.select(
          conn,
          jointableUsersDevicesWithDeviceVehicle,
          selectJointableUsersDevicesWithDeviceVehicle,
          whereJointableUsersDevicesWithDeviceVehicle,
          conditionJointableUsersDevicesWithDeviceVehicle,
          "dv.id",
          "ASC",
          0,
          9999
        );
        console.log("infoDevice", infoDevice);

        if (!infoDevice?.length || infoDevice?.length <= 1)
          throw { msg: `Thiết bị ${NOT_OWN}` };

        let minExpiredOn = 0;
        const {
          infoVehicleInsert,
          deviceActived,
          infoDeviceNew,
          infoDeviceOld,
        } = infoDevice.reduce(
          (result, item, i, arr) => {
            if (item.vehicle_id == vehicle_id) {
              result.infoVehicle = {
                expired_on: item.expired_on,
                activation_date: item.activation_date,
                warranty_expired_on: item.warranty_expired_on,
                service_package_id: item.service_package_id,
                type: item.type,
                is_use_gps: item.is_use_gps,
                quantity_channel: item.quantity_channel,
                quantity_channel_lock: item.quantity_channel_lock,
                is_transmission_gps: item.is_transmission_gps,
                is_transmission_image: item.is_transmission_image,
              };

              result.infoDeviceOld = { imei: item.imei };
            } else {
              result.infoDeviceNew = { imei: item.imei };
            }
            if (i == 0) {
              minExpiredOn = item.expired_on;
              result.infoVehicleInsert = {
                expired_on: item.expired_on,
                activation_date: item.activation_date,
                warranty_expired_on: item.warranty_expired_on,
              };
            }
            if (i > 0) {
              if (!minExpiredOn?.expired_on || minExpiredOn > item.expired_on) {
                minExpiredOn = item.expired_on;
                result.infoVehicleInsert = {
                  expired_on: item.expired_on,
                  activation_date: item.activation_date,
                  warranty_expired_on: item.warranty_expired_on,
                };
              }
            }

            if (item.is_deleted == 0) {
              result.deviceActived += 1;
            }

            if (i == arr.length - 1) {
              result.infoVehicleInsert = {
                device_id: device_id_new,
                vehicle_id,
                ...result.infoVehicle,
                ...result.infoVehicleInsert,
                is_deleted: 0,
                created_at: Date.now(),
              };
            }

            return result;
          },
          {
            infoVehicleInsert: {},
            infoVehicle: {},
            deviceActived: 0,
            infoDeviceOld: {},
            infoDeviceNew: {},
          }
        );

        console.log({
          infoVehicleInsert,
          deviceActived,
          infoDeviceNew,
          infoDeviceOld,
        });

        if (deviceActived > 1)
          throw { msg: `Thiết bị mới không thể sử dụng để đổi bảo hành` };

        const joinTableVehicle = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
          INNER JOIN ${tableUserDevice} ud ON dv.device_id = ud.device_id`;

        const seletInfoVehicle = `v.name as vehicle_name,ud.id as user_device_id`;

        const idUd = await dataBaseModel.select(
          conn,
          joinTableVehicle,
          seletInfoVehicle,
          "v.is_deleted = 0 AND dv.is_deleted = 0 AND ud.user_id = ? AND ud.device_id = ? AND ud.is_main = ?",
          [userId, device_id_old, 1],
          "ud.id"
        );

        if (!idUd?.length) throw { msg: `Phương tiện ${NOT_OWN}` };

        const joinTableCustomerOrders = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;

        const selectInfoOrders = `o.id as orders_id, od.id as od_id`;

        const whereOrders = `o.creator_customer_id = ? AND od.device_id = ?`;

        const inforOrder = await dataBaseModel.select(
          conn,
          joinTableCustomerOrders,
          selectInfoOrders,
          whereOrders,
          [customerId, device_id_old],
          "o.id"
        );

        // console.log("inforOrder", inforOrder);

        let listOrdersId = [];
        if (inforOrder?.length) {
          const { od_id } = inforOrder[0];
          const joinTableOrder = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;
          const select = "o.id";
          const where = "od.id >= ? AND device_id = ?";
          const allOrders = await dataBaseModel.select(
            conn,
            joinTableOrder,
            select,
            where,
            [od_id, device_id_old],
            "od.id",
            "ASC"
          );

          listOrdersId = allOrders?.map((item) => item.id);

          // console.log("listOrdersId", listOrdersId);
        }

        const data = await vehicleModel.guarantee(
          conn,
          connPromise,
          params,
          body,
          idUd,
          inforOrder,
          infoVehicleInsert,
          infoDeviceNew,
          infoDeviceOld,
          listOrdersId,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  async move(body, userId, customerId, parentId, infoUser) {
    try {
      const { reciver, device_id, vehicle_id } = body;

      const { conn, connPromise } = await db.getConnection();
      try {
        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id 
          INNER JOIN ${tableUserDevice} ud ON dv.device_id = ud.device_id`;

        const infoVehicle = await dataBaseModel.select(
          conn,
          joinTable,
          "v.name as vehicle_name,ud.user_id",
          "dv.vehicle_id = ? AND dv.device_id = ? AND dv.is_deleted = ? AND ud.is_deleted = ? AND ud.is_moved = ?",
          [vehicle_id, device_id, 0, 0, 0],
          "v.id",
          "ASC",
          0,
          1
        );
        // console.log("infoVehicle", infoVehicle);

        if (!infoVehicle?.length) throw { msg: `Phương tiện ${NOT_EXITS}` };

        const { user_id, vehicle_name } = infoVehicle[0];

        const [treeReciver, treeUserIsMoved] = await Promise.all([
          validateModel.CheckIsChild(
            connPromise,
            userId,
            customerId,
            parentId,
            reciver,
            "reciver"
          ),
          validateModel.CheckIsChild(
            connPromise,
            userId,
            customerId,
            parentId,
            user_id,
            "user_id"
          ),
        ]);

        // const customerIdUserIsMove =
        //   treeUserIsMoved?.[treeUserIsMoved?.length - 1]?.customer_id;

        // console.log({
        //   treeReciver,
        //   treeUserIsMoved,
        //   customerIdUserIsMove,
        // });

        const dataInfoParent = [];

        for (let i = 0; i < treeReciver.length; i++) {
          const { id } = treeReciver[i];

          if (id != treeUserIsMoved[i].id) {
            dataInfoParent.push({ index: i - 1, ...treeReciver[i - 1] });
          } else if (!dataInfoParent.length && i === treeReciver.length - 1) {
            dataInfoParent.push({ index: i, ...treeReciver[i] });
          }

          if (i == treeUserIsMoved.length - 1) break;
        }

        const dataRemoveOrders = treeUserIsMoved.slice(
          dataInfoParent[0].index + 1,
          treeUserIsMoved.length
        );
        const dataAddOrders = treeReciver.slice(
          dataInfoParent[0].index + 1,
          treeReciver.length
        );

        // return {
        //   indexUserMove,
        //   dataInfoParent,
        //   dataRemoveOrders,
        //   dataAddOrders,
        //   treeUserIsMoved,
        //   treeReciver,
        // };

        const data = await vehicleModel.move(
          conn,
          connPromise,
          vehicle_name,
          userId,
          {
            id: treeUserIsMoved[treeUserIsMoved?.length - 1]?.id,
            username: treeUserIsMoved[treeUserIsMoved?.length - 1]?.username,
          },
          {
            id: treeReciver[treeReciver?.length - 1]?.id,
            username: treeReciver[treeReciver?.length - 1]?.username,
          },
          dataRemoveOrders,
          dataAddOrders,
          [device_id],
          infoUser
        );
        return data;
      } catch (error) {
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
}

module.exports = new vehicleService();

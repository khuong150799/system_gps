const db = require("../dbs/init.mysql");
const {
  BusinessLogicError,
  SendMissingDataError,
} = require("../core/error.response");
const vehicleModel = require("../models/vehicle.model");
const {
  tableVehicle,
  tableDevice,
  tableDeviceVehicle,
  tableServicePackage,
  tableUserDevice,
  tableOrders,
  tableOrdersDevice,
  tableRenewalCode,
  tableKeyTime,
  tableRenewalCodeDevice,
} = require("../constants/tableName.constant");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const {
  NOT_OWN,
  NOT_EXITS,
  VEHICLE_NOT_PERMISSION,
  LOCK_PERMISSION_ACC,
  VALIDATE_DATA,
  NOT_CONFIG_SLEEP_TIME_DEVICE,
} = require("../constants/msg.constant");
const { hGet, hSet } = require("../models/redis.model");
const {
  REDIS_KEY_LOCK_ACC_WITH_EXTEND,
  REDIS_KEY_ANTI_THEFT_LINK_GPS,
} = require("../constants/redis.constant");

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
          "Biển số",
          "name",
          id
        );

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
          INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,v.name,d.id as device_id",
          "v.id = ? AND dv.is_deleted = 0 AND d.device_status_id = 3  AND v.is_deleted = 0 AND d.is_deleted = 0",
          id,
          "d.id"
        );

        // console.log("body", body);

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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  async remote(body, chosseUserId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { device_id } = body;

        const joinTable = `${tableDevice} d INNER JOIN ${tableUserDevice} ud ON d.id = ud.device_id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei",
          "d.id = ? AND d.is_deleted = 0 AND d.device_status_id = 3  AND ud.user_id = ? AND ud.is_deleted = 0",
          [device_id, chosseUserId],
          "d.id"
        );

        // console.log("dataInfo", dataInfo);
        if (!dataInfo?.length) throw { msg: VEHICLE_NOT_PERMISSION };

        const imei = dataInfo[0]?.imei;

        const data = await vehicleModel.remote(
          conn,
          connPromise,
          body,
          imei,
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
      const { msg, errors, message } = error;
      throw new BusinessLogicError(msg || message, errors);
    }
  }

  async updateLock(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { device_id } = body;
        const { id } = params;

        const joinTable = `${tableDeviceVehicle} dv INNER JOIN ${tableDevice} d ON dv.device_id = d.id 
          INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,d.id as device_id,v.name",
          "dv.device_id = ? AND dv.vehicle_id = ? AND dv.is_deleted = 0 AND d.device_status_id = 3 AND d.is_deleted = 0",
          [device_id, id],
          "d.id"
        );

        // console.log("body", body);

        const data = await vehicleModel.updateLock(
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  async updatePackage(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const data = await vehicleModel.updatePackage(
          conn,
          connPromise,
          body,
          params,
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
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
          "v.id = ? AND v.is_deleted = ? AND dv.is_deleted = ?",
          [id, 0, 0],
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  async updateSleepTime(body, params, infoUser) {
    // console.log("body", body);

    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { device_id, minute } = body;
        const { id: vehicle_id } = params;
        const { user_id } = infoUser;

        if (Number(minute) <= 0)
          throw new SendMissingDataError(VALIDATE_DATA, [
            { value: minute, param: "minute", msg: VALIDATE_DATA },
          ]);

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id 
        INNER JOIN ${tableUserDevice} ud ON dv.device_id = ud.device_id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.id,d.imei,dv.sleep_time",
          "v.id = ? AND dv.device_id = ? AND v.is_deleted = 0 AND d.is_deleted = 0 AND dv.is_deleted = 0 AND ud.user_id = ? AND ud.is_deleted = 0",
          [vehicle_id, device_id, user_id],
          "d.id",
          "ASC"
        );

        if (!dataInfo?.length)
          throw new SendMissingDataError(VALIDATE_DATA, [
            {
              value: vehicle_id,
              param: "id",
              msg: `Phương tiện ${NOT_EXITS}`,
            },
          ]);
        const { imei } = dataInfo[0];
        const { data: dataRedis } = await hGet(
          REDIS_KEY_ANTI_THEFT_LINK_GPS,
          imei.toString()
        );

        // console.log("dataRedis", dataRedis);

        if (!dataRedis)
          throw new SendMissingDataError(VALIDATE_DATA, [
            {
              value: device_id,
              param: "device_id",
              msg: NOT_CONFIG_SLEEP_TIME_DEVICE,
            },
          ]);

        const data = await vehicleModel.updateSleepTime(
          conn,
          connPromise,
          dataInfo,
          body,
          params,
          infoUser
        );
        return data;
      } catch (error) {
        console.log("error", error);

        await connPromise.rollback();

        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors, message } = error;
      // console.log({ msg, errors });

      if (!msg) throw new SendMissingDataError(message, errors);
      throw new BusinessLogicError(msg, errors);
    }
  }

  async updateExpiredOn(body, infoUser) {
    // console.log("body", body);

    const { user_id } = infoUser;
    try {
      const { conn, connPromise } = await db.getConnection();
      const { data: dataRedis } = await hGet(
        REDIS_KEY_LOCK_ACC_WITH_EXTEND,
        user_id.toString()
      );

      let idx = 0;
      // console.log("dataRedis", dataRedis);

      if (dataRedis) {
        const dataParse = JSON.parse(dataRedis);
        const { index, time } = dataParse;
        if (index >= 3) throw new SendMissingDataError(LOCK_PERMISSION_ACC);
        if (Date.now() - Number(time) <= 60 * 1000) {
          idx = index;
        }
      }
      try {
        // const { vehicle_id, device_id, code, key_time } = body;

        const { djson, promo } = body;

        // console.log("djson", djson);

        const dataParse = JSON.parse(djson || "[]");

        // console.log("dataParse", dataParse);
        // console.log("dataParse?.length", !dataParse?.length);
        if (!dataParse?.length) throw new SendMissingDataError();

        let checkDataError = false;
        const listCode = [];

        let dataFormat = {};

        const listVehicleId = [];

        const listDeviceId = [];

        for (let i = 0; i < dataParse.length; i++) {
          const { vehicle_id, device_id, code, value_time } = dataParse[i];
          // console.log("dataParse[i]", dataParse[i]);

          if (!vehicle_id || !device_id || !code || (!value_time && !promo)) {
            checkDataError = true;
            break;
          }

          // console.log('code.split(";")', code.split(";"));

          listCode.push(...code.split(";"));
          listVehicleId.push(vehicle_id);
          listDeviceId.push(device_id);
          dataFormat[device_id] = {
            vehicle_id,
            device_id,
            code,
            value_time: promo ? 1 : value_time,
          };
        }
        // console.log("checkDataError", checkDataError);

        if (checkDataError) throw new SendMissingDataError();

        // console.log("listCode", listCode);

        const dataCheck = await validateModel.checkExitMultiValue(
          conn,
          tableRenewalCode,
          "code",
          [listCode],
          !promo ? "Mã gia hạn" : "Mã khuyến mãi",
          "code",
          null,
          false,
          "id,code,is_used",
          true,
          "",
          promo
        );

        const dataCodeFormat = dataCheck.reduce((result, { id, code }) => {
          result[code] = id;
          return result;
        }, {});

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.id,d.imei,dv.expired_on",
          "v.id IN (?) AND dv.device_id IN (?) AND v.is_deleted = 0 AND d.is_deleted = 0 AND dv.is_deleted = 0",
          [listVehicleId, listDeviceId],
          "d.id",
          "ASC",
          0,
          9999999
        );

        const dataKeyTime = await dataBaseModel.select(
          conn,
          tableKeyTime,
          "id,value",
          "1 = ?",
          1,
          "id",
          "ASC",
          0,
          9999
        );

        const dataKeyTimeFormat = dataKeyTime.reduce(
          (result, { id, value }) => {
            result[value] = id;
            return result;
          },
          {}
        );

        const data = await vehicleModel.updateExpiredOn(
          conn,
          connPromise,
          dataInfo,
          dataFormat,
          listCode,
          dataCodeFormat,
          dataKeyTimeFormat,
          infoUser
        );
        return data;
      } catch (error) {
        console.log("error", error);

        await connPromise.rollback();
        const { isLockAcc } = error;
        // console.log("isLockAcc", isLockAcc);

        if (isLockAcc) {
          try {
            await hSet(
              REDIS_KEY_LOCK_ACC_WITH_EXTEND,
              user_id.toString(),
              JSON.stringify({ index: idx + 1, time: Date.now() })
            );

            if (idx + 1 >= 3)
              throw new SendMissingDataError(LOCK_PERMISSION_ACC);
          } catch (error) {
            throw error;
          }
        }
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors, message } = error;
      // console.log({ msg, errors });

      if (!msg) throw new SendMissingDataError(message);
      throw new BusinessLogicError(msg, errors);
    }
  }

  async recallExtend(body, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { vehicle_id: id, device_id, code } = body;

        // console.log(id, device_id);
        const joinTableRenewalCode = `${tableRenewalCode} rn LEFT JOIN ${tableRenewalCodeDevice} rnd ON rn.id = rnd.renewal_code_id 
           LEFT JOIN ${tableKeyTime} kt ON rnd.key_time_id = kt.id`;
        const dataCode = await validateModel.checkExitValue(
          conn,
          joinTableRenewalCode,
          "code",
          code,
          "Mã gia hạn",
          "code",
          null,
          false,
          "rn.id,rn.is_used,kt.value",
          false,
          true,
          true
        );

        const { id: codeId, value: valueTime } = dataCode[0];

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
        const data = await vehicleModel.recallExtend(
          conn,
          connPromise,
          body,
          dataInfo,
          { codeId, valueTime },
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //updateWarrantyExpiredOn
  async updateWarrantyExpiredOn(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        // const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        // INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        // const dataInfo = await dataBaseModel.select(
        //   conn,
        //   joinTable,
        //   "d.imei,dv.warranty_expired_on",
        //   "v.id = ? AND d.id = ?",
        //   [id, device_id],
        //   "d.id"
        // );

        const dataInfo = await dataBaseModel.select(
          conn,
          `${tableDevice} d`,
          "d.imei,d.warranty_expired_on",
          "d.id = ?",
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  async deleteById(query, params, userId, customerId, infoUser) {
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

        const data = await vehicleModel.deleteById(
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //guarantee
  async guarantee(body, params, userId, customerId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id: vehicle_id } = params;
        const { device_id_old, device_id_new } = body;

        // console.log(device_id_old, device_id_new);

        const dataCheckSameUser = await dataBaseModel.select(
          conn,
          tableUserDevice,
          "user_id,is_moved,device_id",
          `device_id IN (?) AND is_deleted = 0 AND is_moved = 0`,
          [[device_id_old, device_id_new]]
        );
        // console.log("dataCheckSameUser", dataCheckSameUser);

        if (
          dataCheckSameUser?.length <= 1 ||
          dataCheckSameUser[0]?.user_id != dataCheckSameUser[1]?.user_id
        )
          throw { msg: `Thiết bị ${NOT_OWN}` };

        const jointableUsersDevicesWithDeviceVehicle = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id`;
        const whereJointableUsersDevicesWithDeviceVehicle = `d.id = ? AND d.is_deleted = 0 AND dv.is_deleted = 0`;

        const selectJointableUsersDevicesWithDeviceVehicle = `d.id,d.imei,dv.id as dv_id,dv.vehicle_id,dv.service_package_id,dv.expired_on,
        dv.activation_date,dv.is_use_gps,dv.type,dv.quantity_channel,dv.quantity_channel_lock,dv.is_transmission_gps,dv.is_transmission_image,dv.is_deleted`;

        const [infoDeviceOld, infoDeviceNew] = await Promise.all([
          dataBaseModel.select(
            conn,
            jointableUsersDevicesWithDeviceVehicle,
            selectJointableUsersDevicesWithDeviceVehicle,
            whereJointableUsersDevicesWithDeviceVehicle,
            device_id_old,
            "dv.id",
            "ASC",
            0,
            1
          ),
          dataBaseModel.select(
            conn,
            `${tableDevice} d`,
            "id,imei,activation_date,warranty_expired_on",
            "id = ?",
            device_id_new,
            "id",
            "ASC",
            0,
            1
          ),
        ]);

        if (!infoDeviceNew?.length || !infoDeviceOld?.length)
          throw { msg: `Thiết bị ${NOT_OWN}` };

        const {
          expired_on,
          activation_date,
          service_package_id,
          type,
          is_use_gps,
          quantity_channel,
          quantity_channel_lock,
          is_transmission_gps,
          is_transmission_image,
        } = infoDeviceOld[0];

        const infoVehicleInsert = {
          device_id: device_id_new,
          vehicle_id,
          expired_on,
          activation_date,
          service_package_id,
          type,
          is_use_gps,
          quantity_channel,
          quantity_channel_lock,
          is_transmission_gps,
          is_transmission_image,
          is_deleted: 0,
          created_at: Date.now(),
        };

        const {
          activation_date: activation_date_device,
          warranty_expired_on: warranty_expired_on_device,
        } = infoDeviceNew[0];

        let dataUpdateDevice = {
          activation_date: null,
          warranty_expired_on: null,
        };
        if (!warranty_expired_on_device) {
          const createdAt = Date.now();
          const date = new Date(createdAt);
          date.setFullYear(date.getFullYear() + 1);

          dataUpdateDevice = {
            activation_date: createdAt,
            warranty_expired_on: date.getTime(),
          };
        } else {
          dataUpdateDevice = {
            activation_date: activation_date_device,
            warranty_expired_on: warranty_expired_on_device,
          };
        }

        console.log({ infoDeviceOld, infoDeviceNew });

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
        // console.log("idUd", idUd);

        const data = await vehicleModel.guarantee(
          conn,
          connPromise,
          params,
          body,
          idUd,
          inforOrder,
          infoVehicleInsert,
          infoDeviceNew[0],
          infoDeviceOld[0],
          dataUpdateDevice,
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  async move(body, userId, customerId, parentId, infoUser) {
    try {
      const { reciver, device_id, vehicle_id } = body;

      const { conn, connPromise } = await db.getConnection();
      try {
        const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id 
          INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
          INNER JOIN ${tableUserDevice} ud ON dv.device_id = ud.device_id`;

        const infoVehicle = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,v.name as vehicle_name,ud.user_id",
          "dv.vehicle_id = ? AND dv.device_id = ? AND dv.is_deleted = ? AND ud.is_deleted = ? AND ud.is_moved = ?",
          [vehicle_id, device_id, 0, 0, 0],
          "v.id",
          "ASC",
          0,
          1
        );
        // console.log("infoVehicle", infoVehicle);

        if (!infoVehicle?.length) throw { msg: `Phương tiện ${NOT_EXITS}` };

        const { user_id, vehicle_name, imei } = infoVehicle[0];

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
        //   // customerIdUserIsMove,
        // });

        const dataInfoParent = [];

        for (let i = 0; i < treeReciver.length; i++) {
          const { id } = treeReciver[i];

          if (id != treeUserIsMoved[i].id) {
            dataInfoParent.push({ index: i - 1, ...treeReciver[i - 1] });
            break;
          } else if (!dataInfoParent.length && i === treeReciver.length - 1) {
            dataInfoParent.push({ index: i, ...treeReciver[i] });
            break;
          } else if (i == treeUserIsMoved.length - 1) {
            dataInfoParent.push({ index: i, ...treeReciver[i] });
            break;
          }
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
          imei,
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

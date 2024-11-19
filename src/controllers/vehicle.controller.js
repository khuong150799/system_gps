const { UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const vehicleService = require("../services/vehicle.service");

class VehicleController {
  updateById = catchAsync(async (req, res) => {
    const { body, params } = req;
    const data = await vehicleService.updateById(body, params);
    UPDATE(res, [data]);
  });

  remote = catchAsync(async (req, res) => {
    const { body, userId, isMain, parentId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const chosseUserId = isMain == 1 ? userId : parentId;
    const data = await vehicleService.remote(body, chosseUserId, infoUser);
    UPDATE(res, [data]);
  });

  updateName = catchAsync(async (req, res) => {
    const { body, params, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.updateName(body, params, infoUser);
    UPDATE(res, [data]);
  });

  updateLock = catchAsync(async (req, res) => {
    const { body, params, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.updateLock(body, params, infoUser);
    UPDATE(res, [data]);
  });
  //systemUpdateLock
  systemUpdateLock = catchAsync(async (req, res) => {
    const { body, params } = req;
    const infoUser = { user_id: 1, ip: null, os: null, gps: null };
    const data = await vehicleService.updateLock(body, params, infoUser);
    UPDATE(res, [data]);
  });

  updatePackage = catchAsync(async (req, res) => {
    const { body, params, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.updatePackage(body, params, infoUser);
    UPDATE(res, [data]);
  });

  // updateExpiredOn = catchAsync(async (req, res) => {
  //   const { body, params, userId } = req;
  //   const infoUser = { user_id: userId, ip: null, os: null, gps: null };
  //   const data = await vehicleService.updateExpiredOn(body, params, infoUser);
  //   UPDATE(res, [data]);
  // });

  updateExpiredOn = catchAsync(async (req, res) => {
    const { body, userId } = req;
    const infoUser = {
      user_id: userId,
      ip: null,
      os: null,
      gps: null,
      action: "Gia hạn",
    };
    const data = await vehicleService.updateExpiredOn(
      { ...body, promo: false },
      infoUser
    );
    UPDATE(res, [data]);
  });

  promo = catchAsync(async (req, res) => {
    const { body, userId } = req;
    const infoUser = {
      user_id: userId,
      ip: null,
      os: null,
      gps: null,
      action: "Nhập mã kuyến mãi",
    };
    const data = await vehicleService.updateExpiredOn(
      { ...body, promo: true },
      infoUser
    );
    UPDATE(res, [data]);
  });

  recallExtend = catchAsync(async (req, res) => {
    const { body, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.recallExtend(body, infoUser);
    UPDATE(res, [data]);
  });

  //updateActivationDate
  updateActivationDate = catchAsync(async (req, res) => {
    const { body, params, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.updateActivationDate(
      body,
      params,
      infoUser
    );
    UPDATE(res, [data]);
  });

  //updateWarrantyExpiredOn
  updateWarrantyExpiredOn = catchAsync(async (req, res) => {
    const { body, params, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.updateWarrantyExpiredOn(
      body,
      params,
      infoUser
    );
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const { query, params, userId, customerId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.deleteById(
      query,
      params,
      userId,
      customerId,
      infoUser
    );
    DELETE(res, data);
  });

  guarantee = catchAsync(async (req, res) => {
    const { body, params, userId, customerId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.guarantee(
      body,
      params,
      userId,
      customerId,
      infoUser
    );
    UPDATE(res, [data]);
  });

  move = catchAsync(async (req, res) => {
    const { body, userId, customerId, parentId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.move(
      body,
      userId,
      customerId,
      parentId,
      infoUser
    );
    UPDATE(res, [data]);
  });
}

module.exports = new VehicleController();

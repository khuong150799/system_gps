const {
  REFRESH_TOKEN_SUCCESS,
  LOGOUT_SUCCESS,
  MOVE_SUCCESS,
} = require("../constants/msg.constant");
const { Api400Error } = require("../core/error.response");
const {
  GET,
  CREATED,
  UPDATE,
  DELETE,
  OK,
} = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const usersSrevice = require("../services/users.service");

class CustomersController {
  getLockExtend = catchAsync(async (req, res) => {
    const { userId } = req;
    if (userId != -10) throw new Api400Error();
    const { data, totalPage, totalRecord } = await usersSrevice.getLockExtend();

    GET(res, data, totalPage, totalRecord);
  });

  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecaord } = await usersSrevice.getallrows(
      query
    );
    GET(res, data, totalPage, totalRecaord);
  });

  getallrowsSiteCustomerService = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecaord } =
      await usersSrevice.getallrowsSiteCustomerService(query);
    GET(res, data, totalPage, totalRecaord);
  });

  getallChild = catchAsync(async (req, res) => {
    const query = req.query;
    const customerId = req.customerId;
    const { data, totalPage, totalRecaord } = await usersSrevice.getallChild(
      query,
      customerId
    );
    GET(res, data, totalPage, totalRecaord);
  });

  getListWithUser = catchAsync(async (req, res) => {
    const { isMain, parentId, userId, query } = req;
    // const chosseUser = isMain == 1 ? userId : parentId;
    const data = await usersSrevice.getListWithUser(
      query,
      parentId,
      isMain,
      userId
    );
    GET(res, data);
  });

  getTeamsWithUser = catchAsync(async (req, res) => {
    const userId = req.userId;
    const query = req.query;
    const { data, totalPage, totalRecaord } =
      await usersSrevice.getTeamsWithUser(query, userId);
    GET(res, data, totalPage, totalRecaord);
  });

  // getById = catchAsync(async (req, res) => {
  //   const params = req.params;
  //   const query = req.query;
  //   const data = await usersSrevice.getById(params, query);
  //   GET(res, data);
  // });
  getDeviceAdd = catchAsync(async (req, res) => {
    const userId = req.userId;
    const query = req.query;

    const data = await usersSrevice.getDeviceAdd(query, userId);
    GET(res, data);
  });

  getInfo = catchAsync(async (req, res) => {
    const userId = req.userId;
    const { user_id } = req.query;
    const { id } = req.params;

    const chooseUserId = id || user_id || userId;

    const data = await usersSrevice.getInfo(chooseUserId);
    GET(res, data);
  });

  //getbyid
  getbyid = catchAsync(async (req, res) => {
    const { id } = req.params;

    const chooseUserId = id;

    const data = await usersSrevice.getbyid(chooseUserId);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const { customerId, parentId, userId, role, body } = req;

    const data = await usersSrevice.register(
      body,
      userId,
      customerId,
      parentId,
      role
    );
    CREATED(res, [data]);
  });

  move = catchAsync(async (req, res) => {
    const { userId, body, customerId, parentId } = req;
    const data = await usersSrevice.move(body, userId, customerId, parentId);
    OK(res, [data], {}, MOVE_SUCCESS);
  });

  registerTeam = catchAsync(async (req, res) => {
    const { body, customerId, parentId, userId } = req;

    const data = await usersSrevice.registerTeam(
      body,
      userId,
      customerId,
      parentId
    );
    CREATED(res, [data]);
  });

  registerDevices = catchAsync(async (req, res) => {
    const { body, params, userId } = req;

    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await usersSrevice.registerDevices(
      body,
      params,
      userId,
      infoUser
    );
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const { body, params, customerId, parentId, userId } = req;

    const data = await usersSrevice.updateById(
      body,
      params,
      userId,
      customerId,
      parentId
    );
    UPDATE(res, [data]);
  });

  deleteDevice = catchAsync(async (req, res) => {
    const { body, params, userId, customerId, parentId } = req;

    const infoUser = { user_id: userId, ip: null, os: null, gps: null };

    const data = await usersSrevice.deleteDevice(
      params,
      body,
      userId,
      customerId,
      parentId,
      infoUser
    );
    DELETE(res, data);
  });

  deleteById = catchAsync(async (req, res) => {
    const { params, userId, customerId, parentId } = req;

    const data = await usersSrevice.deleteById(
      params,
      userId,
      customerId,
      parentId
    );
    DELETE(res, data);
  });

  resetPass = catchAsync(async (req, res) => {
    const { params, userId, customerId, parentId } = req;

    const data = await usersSrevice.resetPass(
      params,
      userId,
      customerId,
      parentId
    );
    UPDATE(res, data);
  });

  changePass = catchAsync(async (req, res) => {
    const { body, userId } = req;
    const data = await usersSrevice.changePass(body, userId);
    UPDATE(res, data);
  });

  loginCustomer = catchAsync(async (req, res) => {
    const { params, body, left, right } = req;
    const data = await usersSrevice.loginCustomer(params, body, left, right);
    OK(res, data);
  });
  login = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await usersSrevice.login(body);
    OK(res, data);
  });

  refreshToken = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await usersSrevice.refreshToken(body);
    OK(res, data, {}, REFRESH_TOKEN_SUCCESS);
  });
  logout = catchAsync(async (req, res) => {
    const { clientId, userId } = req;
    const data = await usersSrevice.logout(clientId, userId);
    OK(res, data, {}, LOGOUT_SUCCESS);
  });

  updateActive = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await usersSrevice.updateActive(body, params);
    UPDATE(res, data);
  });

  updateUsername = catchAsync(async (req, res) => {
    const { body, userId, query } = req;

    const chooseUserId = query?.user_id || userId;

    const data = await usersSrevice.updateUsername(body, chooseUserId);
    UPDATE(res, data);
  });

  unlockExtend = catchAsync(async (req, res) => {
    const { params, userId } = req;
    if (userId != -10) throw new Api400Error();
    await usersSrevice.unlockExtend(params);
    DELETE(res);
  });
}

module.exports = new CustomersController();

const {
  REFRESH_TOKEN_SUCCESS,
  LOGOUT_SUCCESS,
  MOVE_SUCCESS,
} = require("../constants/msg.contant");
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
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecaord } = await usersSrevice.getallrows(
      query
    );
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
    const userId = req.userId;
    const query = req.query;
    const data = await usersSrevice.getListWithUser(query, userId);
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

  register = catchAsync(async (req, res) => {
    const customerId = req.customerId;
    const userId = req.userId;
    const role = req.role;
    const body = req.body;
    const data = await usersSrevice.register(body, userId, customerId, role);
    CREATED(res, [data]);
  });

  move = catchAsync(async (req, res) => {
    const userId = req.userId;
    const body = req.body;
    const data = await usersSrevice.move(body, userId);
    OK(res, [data], {}, MOVE_SUCCESS);
  });

  registerTeam = catchAsync(async (req, res) => {
    const body = req.body;
    const userId = req.userId;
    const data = await usersSrevice.registerTeam(body, userId);
    CREATED(res, [data]);
  });

  registerDevices = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const userId = req.userId;
    const data = await usersSrevice.registerDevices(body, params, userId);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const userId = req.userId;
    const data = await usersSrevice.updateById(body, params, userId);
    UPDATE(res, [data]);
  });

  deleteDevice = catchAsync(async (req, res) => {
    const params = req.params;
    const body = req.body;
    const userId = req.userId;
    const data = await usersSrevice.deleteDevice(params, body, userId);
    DELETE(res, data);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const userId = req.userId;
    const data = await usersSrevice.deleteById(params, userId);
    DELETE(res, data);
  });

  resetPass = catchAsync(async (req, res) => {
    const params = req.params;
    const userId = req.userId;
    const data = await usersSrevice.resetPass(params, userId);
    UPDATE(res, data);
  });

  changePass = catchAsync(async (req, res) => {
    const body = req.body;
    const userId = req.userId;
    const data = await usersSrevice.changePass(body, userId);
    UPDATE(res, data);
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
    const clientId = req.clientId;
    const data = await usersSrevice.logout(clientId);
    OK(res, data, {}, LOGOUT_SUCCESS);
  });

  updateActive = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await usersSrevice.updateActive(body, params);
    UPDATE(res, data);
  });
}

module.exports = new CustomersController();

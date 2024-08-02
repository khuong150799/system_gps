const {
  DELETE_DATA_SUCCESS,
  ADD_DATA_SUCCESS,
  GET_DATA_SUCCESS,
  UPDATE_DATA_SUCCESS,
  LOGIN_SUCCESS,
} = require("../constants/msg.constant");
const { StatusCodes } = require("./httpStatusCode");

class SuccessResponse {
  constructor({
    message,
    status = StatusCodes.OK,
    data = {},
    options = {},
    totalPage = -1,
    totalRecord = -1,
  }) {
    this.result = true;
    this.message = message;
    this.status = status;
    if (totalPage >= 0) {
      this.totalPage = totalPage;
      this.totalRecord = totalRecord;
    }
    this.data = data;
    this.options = options;
  }

  send(res, headers = {}) {
    return res.status(this.status).json(this);
  }
}

class Create extends SuccessResponse {
  constructor({ data = {}, options = {}, message }) {
    super({ message, status: StatusCodes.CREATED, data, options });
  }
}

class Update extends SuccessResponse {
  constructor({ data = {}, options = {}, message }) {
    super({ message, data, options });
  }
}

class Get extends SuccessResponse {
  constructor({
    data = {},
    totalPage = 0,
    totalRecord = 0,
    options = {},
    message,
  }) {
    super({
      message,
      status: StatusCodes.OK,
      data,
      options,
      totalPage,
      totalRecord,
    });
  }
}

class Delete extends SuccessResponse {
  constructor({ data = {}, options = {}, message }) {
    super({ message, status: StatusCodes.OK, data, options });
  }
}

class Ok extends SuccessResponse {
  constructor({ data = {}, options = {}, message }) {
    super({ message, status: StatusCodes.OK, data, options });
  }
}

const CREATED = (res, data, options = {}, message = ADD_DATA_SUCCESS) => {
  new Create({
    message,
    data,
    options,
  }).send(res);
};

const UPDATE = (res, data, options = {}, message = UPDATE_DATA_SUCCESS) => {
  new Update({
    message,
    data,
    options,
  }).send(res);
};

const GET = (
  res,
  data,
  totalPage = 0,
  totalRecord = 0,
  options = {},
  message = GET_DATA_SUCCESS
) => {
  new Get({
    message,
    data,
    totalPage,
    totalRecord,
    options,
  }).send(res);
};

const DELETE = (res, data, options = {}, message = DELETE_DATA_SUCCESS) => {
  new Delete({
    message,
    data,
    options,
  }).send(res);
};

const OK = (res, data, options = {}, message = LOGIN_SUCCESS) => {
  new Ok({
    message,
    data,
    options,
  }).send(res);
};

module.exports = {
  GET,
  UPDATE,
  CREATED,
  DELETE,
  OK,
};

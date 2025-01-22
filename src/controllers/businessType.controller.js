const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const businessTypeService = require("../services/businessType.service");

class BusinessTypeController {
  getAllRows = catchAsync(async (req, res) => {
    const data = await businessTypeService.getAllRows();
    GET(res, data);
  });
}

module.exports = new BusinessTypeController();

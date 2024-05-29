const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const licenseTypeService = require("../services/licenseType.service");

class LicenseTypeController {
  getAllRows = catchAsync(async (req, res) => {
    const data = await licenseTypeService.getAllRows();
    GET(res, data);
  });
}

module.exports = new LicenseTypeController();

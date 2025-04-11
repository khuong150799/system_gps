"use strict";

const { tableDeviceInfo } = require("../../constants/tableName.constant");

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
const tableName = tableDeviceInfo;
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.addIndex(tableName, "idx_sid_tbl_device_info", ["sid"]);
};

exports.down = function (db) {
  return db.removeIndex(tableName, "idx_sid_tbl_device_info");
};

exports._meta = {
  version: 1,
};

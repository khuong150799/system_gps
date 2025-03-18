"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

// Thêm cột vào bảng users
exports.up = function (db) {
  return db.addColumn("tbl_vehicle", "business_type_id", {
    type: "int",
    length: 5,
    notNull: false,
  });
};

// Rollback (gỡ cột)
exports.down = function (db) {
  return db.removeColumn("tbl_vehicle", "business_type_id");
};

exports._meta = {
  version: 1,
};

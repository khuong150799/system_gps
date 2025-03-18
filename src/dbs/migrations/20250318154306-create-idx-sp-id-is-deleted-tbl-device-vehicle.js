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

exports.up = function (db) {
  return db.addIndex("tbl_device_vehicle", "idx_sp_id_is_deleted", [
    "service_package_id",
    "is_deleted",
  ]);
};

exports.down = function (db) {
  return db.removeIndex("tbl_device_vehicle", "idx_sp_id_is_deleted");
};

exports._meta = {
  version: 1,
};

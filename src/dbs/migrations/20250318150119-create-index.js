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
  return db.addIndex("tbl_model", "idx_model_is_deleted_model_type_id", [
    "is_deleted",
    "model_type_id",
  ]);
};

exports.down = function (db) {
  return db.removeIndex("tbl_model", "idx_model_is_deleted_model_type_id");
};

exports._meta = {
  version: 1,
};

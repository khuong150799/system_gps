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

const tableName = "tbl_command_configurations";
exports.up = async function (db) {
  try {
    await db.createTable(tableName, {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      device_id: { type: "int" },
      config_name: { type: "string", length: 100 },
      value: { type: "longtext" },
      is_deleted: { type: "tinyint", defaultValue: 0, length: 1 },
      created_at: { type: "bigint", defaultValue: Date.now() },
      updated_at: { type: "bigint" },
    });
    await db.runSql(
      `ALTER TABLE ${tableName} ADD CONSTRAINT idx_uni_device_id_config_name UNIQUE (device_id, config_name);`
    );
    console.log(`Table ${tableName} created successfully.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
};

exports.down = async function (db) {
  try {
    await db.dropTable(tableName);
    console.log(`Table ${tableName} dropped successfully.`);
  } catch (error) {
    console.error(`Error dropping table ${tableName}:`, error);
    throw error;
  }
};

exports._meta = {
  version: 1,
};

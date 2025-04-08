"use strict";

const { tableSim } = require("../../constants/tableName.constant");

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

const tableName = tableSim;
exports.up = async function (db) {
  try {
    await db.createTable(tableName, {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      seri_display: { type: "string", length: 100 },
      seri_sim: { type: "string", length: 255 },
      phone: { type: "string", length: 255 },
      price: { type: "double" },
      status_id: { type: "int" },
      activation_date: { type: "bigint" },
      expired_date: { type: "bigint" },
      type_id: { type: "int" },
      note: { type: "string", length: 255 },
      is_deleted: {
        type: "tinyint",
        defaultValue: 0,
      },
      created_at: { type: "bigint", defaultValue: Date.now() },
      updated_at: { type: "bigint" },
    });
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

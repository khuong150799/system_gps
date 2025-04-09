"use strict";

const { tableTokenFirebase } = require("../../constants/tableName.constant");

const tableName = tableTokenFirebase;

exports.up = async function (db) {
  try {
    await db.createTable(tableName, {
      user_id: { type: "int", notNull: true },
      client_id: { type: "string", length: 255, notNull: true },
      token: { type: "string", length: 255 },
      created_at: { type: "bigint" },
    });

    await db.addPrimaryKey(tableName, ["token"], "pk_token");
    await db.addIndex(tableName, "user_id", false, "idx_user_id");

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

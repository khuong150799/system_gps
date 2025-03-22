const { ERROR, NOT_EXITS } = require("../constants/msg.constant");

class DatabaseModel {
  async select_(db, tableName, fields = "*", where = "", conditions = []) {
    return await new Promise((resolve, reject) => {
      const query = `SELECT ${fields} FROM ${tableName} WHERE ${where}`;
      db.query(query, conditions, (err, dataRes) => {
        // console.log(query);
        // console.log(conditions);
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log(dataRes);
        return resolve(dataRes);
      });
    });
  }

  //get all + get by id + get where in
  async select(
    db,
    tableName,
    fields = "*",
    where = "",
    conditions = [],
    orderByField = "id",
    orderBySort = "DESC",
    offset = 0,
    limit = 10
  ) {
    return await new Promise((resolve, reject) => {
      const query = `SELECT ${fields} FROM ${tableName} WHERE ${where} ORDER BY ${orderByField} ${orderBySort} LIMIT ${offset},${limit}`;
      // console.log(query);
      // console.log(conditions);
      db.query(query, conditions, (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log(dataRes);
        return resolve(dataRes);
      });
    });
  }

  async selectUnion(
    db,
    tableNames = [],
    fields = "*",
    where = "",
    conditions = [],
    orderByField = "id",
    orderBySort = "DESC",
    offset = 0,
    limit = 10
  ) {
    return await new Promise((resolve, reject) => {
      const { query: arrQuery, conditions: conditionsConvert } =
        tableNames.reduce(
          (result, item) => {
            result.query = [
              ...result.query,
              `SELECT ${fields} FROM ${item} WHERE ${where}`,
            ];
            result.conditions = [...result.conditions, ...conditions];

            return result;
          },
          { query: [], conditions: [] }
        );

      const query =
        arrQuery?.length > 1
          ? arrQuery.join(" UNION ")
          : arrQuery.join("") +
            `  ORDER BY ${orderByField} ${orderBySort} LIMIT ${offset},${limit}`;

      db.query(query, conditionsConvert, (err, dataRes) => {
        // console.log(query);
        // console.log(conditions);
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log(dataRes);
        return resolve(dataRes);
      });
    });
  }

  // insert
  async insert(db, tableName, data) {
    return await new Promise((resolve, reject) => {
      const query = `INSERT INTO ${tableName} SET ?`;
      db.query(query, data, (err, dataRes) => {
        // console.log("query", query);
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log("dataRes.insertId", dataRes.insertId);
        return resolve(dataRes.insertId);
      });
    });
  }

  // insertIgnore
  async insertIgnore(db, tableName, fields, data) {
    return await new Promise((resolve, reject) => {
      const query = `INSERT IGNORE INTO ${tableName} (${fields}) VALUES ?`;
      db.query(query, [data], (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log('dataRes.insertId', dataRes.insertId);
        return resolve(dataRes.insertId);
      });
    });
  }

  // insertDuplicate
  async insertDuplicate(
    db,
    tableName,
    field,
    dataInsert,
    dataUpdate,
    isCheck = false
  ) {
    return await new Promise((resolve, reject) => {
      const query = `INSERT INTO ${tableName} (${field}) VALUES ? ON DUPLICATE KEY UPDATE ${dataUpdate}`;
      // console.log(query);
      // console.log(JSON.stringify(dataInsert, null, 2));

      db.query(query, [dataInsert], (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log("dataRes", JSON.stringify(dataRes, null, 2));

        // console.log('dataRes.insertId', dataRes.insertId);
        if (isCheck) {
          return resolve(dataRes);
        }
        return resolve(dataRes.insertId);
      });
    });
  }

  // insertMulti
  async insertMulti(db, tableName, fields, data) {
    return await new Promise((resolve, reject) => {
      const query = `INSERT INTO ${tableName} (${fields}) VALUES ?`;
      db.query(query, [data], (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log('dataRes.insertId', dataRes.insertId);
        return resolve(dataRes.insertId);
      });
    });
  }

  //update
  async update(
    db,
    tableName,
    data,
    field,
    condition,
    fieldNameError = "ID",
    checkExit = true,
    where = ""
  ) {
    return await new Promise((resolve, reject) => {
      const query =
        typeof data === "string" && where
          ? `UPDATE ${tableName} SET ${data} WHERE ${where}`
          : typeof data === "string"
          ? `UPDATE ${tableName} SET ${data} WHERE ${field} IN (?)`
          : where
          ? `UPDATE ${tableName} SET ? WHERE ${where}`
          : `UPDATE ${tableName} SET ? WHERE ${field} IN (?)`;

      const conditions =
        typeof data === "string"
          ? condition
          : typeof data === "object" && !where
          ? [data, condition]
          : [data, ...condition];
      db.query(query, conditions, (err, dataRes) => {
        // console.log("query", query, data, conditions);

        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        if (dataRes.affectedRows === 0 && checkExit) {
          return reject({ msg: `${fieldNameError} ${NOT_EXITS}` });
        }
        // console.log('dataRes.insertId', dataRes.insertId);
        return resolve(dataRes);
      });
    });
  }

  //updata multi rows with multi conditions
  async updatMultiRowsWithMultiConditions(
    db,
    tableName,
    updates = [],
    dataSendNextPromise = "",
    fieldNameError = "ID",
    operator = "AND"
  ) {
    return await new Promise((resolve, reject) => {
      if (updates.length === 0) {
        return reject("Giá trị truyền vào không hợp lệ");
      }
      const updateStatements = updates.map((update) => {
        const { field, conditions } = update;

        const caseStatements = conditions.map((condition) => {
          const { conditionField, conditionValue, updateValue } = condition;
          if (Array.isArray(conditionField) && Array.isArray(conditionValue)) {
            const resultConditon = conditionField.map(
              (item, i) => `${item} = ${conditionValue[i]}`
            );
            return `WHEN ${resultConditon.join(
              ` ${operator} `
            )} THEN ${updateValue}`;
          } else {
            return `WHEN ${conditionField} = ${conditionValue} THEN ${updateValue}`;
          }
        });

        return `
                ${field} = CASE 
                    ${caseStatements.join(" ")}
                    ELSE ${field} 
                END
            `;
      });
      const updateQuery = `UPDATE ${tableName} SET ${updateStatements.join(
        ", "
      )}`;

      // console.log("updateQuery", updateQuery);

      db.query(updateQuery, (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        if (dataRes.affectedRows === 0) {
          return reject({ msg: `${fieldNameError} ${NOT_EXITS}` }, null);
        }
        return resolve(dataSendNextPromise);
      });
    });
  }

  // Delete
  async delete(
    db,
    tableName,
    where,
    conditions = [],
    fieldNameError = "ID",
    checkExit = true
  ) {
    return await new Promise((resolve, reject) => {
      const query = `DELETE FROM ${tableName} WHERE ${where}`;

      db.query(query, conditions, (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        if (dataRes.affectedRows === 0 && checkExit) {
          return reject({ msg: `${fieldNameError} ${NOT_EXITS}` });
        }
        resolve(dataRes);
      });
    });
  }

  //sum
  async sum(db, tableName, field, where, condition) {
    return await new Promise((resolve, reject) => {
      const query = `SELECT SUM(${field}) as total_sum FROM ${tableName} WHERE ${where}`;
      db.query(query, condition, (err, dataRes) => {
        // console.log(query);
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        return resolve(dataRes);
      });
    });
  }

  //count
  async count(db, tableName, field = "*", where = "", conditions = []) {
    return await new Promise((resolve, reject) => {
      const query = `SELECT COUNT(${field}) as total FROM ${tableName} WHERE ${where}`;
      db.query(query, conditions, (err, dataRes) => {
        // console.log(query);
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        return resolve(dataRes);
      });
    });
  }

  //tree menu
  async createTreeMenu(
    dbPromise,
    db,
    tableName,
    select,
    where,
    conditions,
    orderByField,
    orderBySort,
    offset,
    limit,
    selectDequy,
    whereDequy,
    conditionsDequy = [],
    orderByFieldDequy,
    orderBySortDequy
  ) {
    return await new Promise(async (resolve, reject) => {
      try {
        const dataRes = await this.select(
          db,
          tableName,
          select,
          where,
          conditions,
          orderByField,
          orderBySort,
          offset,
          limit
        );

        async function dequy(dataRes, level = 0) {
          for (let i = 0; i < dataRes.length; i++) {
            const parentId = dataRes[i].id;
            const query = `SELECT ${selectDequy} FROM ${tableName} WHERE parent_id = ? ${whereDequy} ORDER BY ${orderByFieldDequy} ${orderBySortDequy}`;
            const [rows] = await dbPromise.query(query, [
              parentId,
              ...conditionsDequy,
            ]);

            if (rows.length > 0) {
              dataRes[i]["child"] = rows;
              dataRes[i]["lv"] = level;
              await dequy(rows, level + 1);
            } else {
              dataRes[i]["child"] = [];
              dataRes[i]["lv"] = level;
            }
          }
          return dataRes;
        }

        dequy(dataRes)
          .then((data) => {
            return resolve(data);
          })
          .catch((err) => {
            return reject({ msg: err });
          });
      } catch (error) {
        return reject(error);
      }
    });
  }

  //all rows menu
  async getAllRowsMenu(
    db,
    tableName,
    select,
    where,
    conditions,
    orderByField,
    orderBySort,
    selectDequy,
    whereDequy,
    orderByFieldDequy,
    orderBySortDequy
  ) {
    return await new Promise(async (resolve, reject) => {
      try {
        const dataRes = await this.select(
          db,
          tableName,
          select,
          where,
          conditions,
          orderByField,
          orderBySort,
          0,
          1000000000
        );
        // console.log("dataRes", dataRes);
        // return dataRes;
        const newArr = [];
        const dequy = async (data) => {
          for (let i = 0; i < data.length; i++) {
            newArr.push(data[i]);
            const id = data[i].id;

            const childQuery = `SELECT ${selectDequy} FROM ${tableName} WHERE parent_id = ${id} ${whereDequy} ORDER BY ${orderByFieldDequy} ${orderBySortDequy}`;
            const dataRess = await db.promise().query(childQuery);

            if (dataRess[0].length > 0) {
              // newArr.push(...dataRess[0]);
              await dequy(dataRess[0]);
            }
          }
        };
        await dequy(dataRes);
        return resolve(newArr);
      } catch (error) {
        // console.log(error);
        return reject(error);
      }
    });
  }

  async getAllRowsDriver(
    db,
    userId,
    tableName,
    select,
    where,
    conditions,
    orderByField,
    orderBySort,
    selectDequy,
    whereDequy,
    orderByFieldDequy,
    orderBySortDequy
  ) {
    return await new Promise(async (resolve, reject) => {
      try {
        const dataRes = await this.select(
          db,
          tableName,
          select,
          where,
          conditions,
          orderByField,
          orderBySort,
          0,
          1000000000
        );
        // console.log("dataRes", JSON.stringify(dataRes, null, 2));
        // return dataRes;
        const newArr = [];
        const dequy = async (data) => {
          for (let i = 0; i < data.length; i++) {
            newArr.push(...data[i].driver);
            const id = data[i].id;

            const childQuery = `SELECT ${selectDequy} FROM ${tableName} WHERE parent_id = ${id} ${whereDequy} ORDER BY ${orderByFieldDequy} ${orderBySortDequy}`;
            const dataRess = await db.promise().query(childQuery);

            if (dataRess[0].length > 0) {
              // console.log("dataRess", JSON.stringify(dataRess[0], null, 2));
              // newArr.push(...dataRess[0]);
              await dequy(dataRess[0]);
            }
          }
        };
        const dataQuery = dataRes?.length
          ? dataRes
          : [{ id: userId, driver: [] }];
        await dequy(dataQuery);
        return resolve(newArr);
      } catch (error) {
        // console.log(error);
        return reject(error);
      }
    });
  }

  async getAllIDChild(
    db,
    tableName,
    select,
    conditions,
    orderByField,
    orderBySort
  ) {
    return await new Promise(async (resolve, reject) => {
      try {
        const newArr = [];
        const dequy = async (data) => {
          for (let i = 0; i < data.length; i++) {
            newArr.push(data[i]);

            const id = data[i].id;
            // console.log("id", id);

            const childQuery = `SELECT ${select} FROM ${tableName} WHERE parent_id = ${id} AND is_main = 1 ORDER BY ${orderByField} ${orderBySort}`;
            const dataRess = await db.promise().query(childQuery);

            // console.log("dataRess", dataRess);

            if (dataRess[0].length > 0) {
              // console.log("dataRess", JSON.stringify(dataRess[0], null, 2));
              // newArr.push(...dataRess[0]);
              await dequy(dataRess[0]);
            }
          }
        };
        await dequy(conditions);
        return resolve(newArr);
      } catch (error) {
        console.log(error);
        return reject(error);
      }
    });
  }

  async createTableLike(db, tableName, tableNameSample) {
    return await new Promise((resolve, reject) => {
      const query = `CREATE TABLE IF NOT EXISTS ${tableName} LIKE ${tableNameSample};`;
      db.query(query, (err, dataRes) => {
        // console.log(query);
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        if (dataRes?.length) return resolve(null);

        return resolve(tableName);
      });
    });
  }
}

module.exports = DatabaseModel;

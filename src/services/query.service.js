const { ERROR, NOT_EXITS } = require("../constants");

class DatabaseService {
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

  // insert
  async insert(db, tableName, data) {
    return await new Promise((resolve, reject) => {
      const query = `INSERT INTO ${tableName} SET ?`;
      db.query(query, data, (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log('dataRes.insertId', dataRes.insertId);
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
  async insertDuplicate(db, tableName, field, dataInsert, dataUpdate) {
    return await new Promise((resolve, reject) => {
      const query = `INSERT INTO ${tableName} (${field}) VALUES ? ON DUPLICATE KEY UPDATE ${dataUpdate}`;
      // console.log(query);
      db.query(query, [dataInsert], (err, dataRes) => {
        if (err) {
          console.log(err);
          return reject({ msg: ERROR });
        }
        // console.log('dataRes.insertId', dataRes.insertId);
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
    checkExit = true
  ) {
    return await new Promise((resolve, reject) => {
      const query =
        typeof data === "string"
          ? `UPDATE ${tableName} SET ${data} WHERE ${field} IN (?)`
          : `UPDATE ${tableName} SET ? WHERE ${field} IN (?)`;
      db.query(
        query,
        typeof data === "string"
          ? condition
          : Array.isArray(condition)
          ? [data, ...condition]
          : [data, condition],
        (err, dataRes) => {
          if (err) {
            console.log(err);
            return reject({ msg: ERROR });
          }
          if (dataRes.affectedRows === 0 && checkExit) {
            return reject({ msg: `${fieldNameError} ${NOT_EXITS}` });
          }
          // console.log('dataRes.insertId', dataRes.insertId);
          return resolve(dataRes);
        }
      );
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
  async sum(db, tableName, field, where) {
    return await new Promise((resolve, reject) => {
      const query = `SELECT SUM(${field}) as total_sum FROM ${tableName} WHERE ${where}`;
      db.query(query, (err, dataRes) => {
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
            const query = `SELECT ${selectDequy} FROM ${tableName} WHERE parent_id = ${parentId} ${whereDequy} ORDER BY ${orderByFieldDequy} ${orderBySortDequy}`;
            const [rows] = await db.promise().query(query);

            if (rows.length > 0) {
              dataRes[i]["child"] = rows;
              dataRes[i]["lv"] = level;
              await dequy(rows, level + 1); // Gọi đệ quy với cấp mới tăng lên
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
          100000
        );

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
}

module.exports = DatabaseService;

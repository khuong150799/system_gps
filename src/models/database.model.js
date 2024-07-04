const configureEnvironment = require("../config/dotenv.config");
const { ERROR, NOT_EXITS } = require("../constants/msg.contant");

const { DB_NAME } = configureEnvironment();

class DatabaseModel {
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
          : typeof data === "object"
          ? [data, condition]
          : [data, ...condition],
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
          1000000000
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

  async createTableDeviceGps(db, tableName) {
    return await new Promise((resolve, reject) => {
      const query = `
        SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
        START TRANSACTION;
        SET time_zone = "+00:00";
        CREATE TABLE ${tableName} (
          id bigint UNSIGNED NOT NULL,
          idx int NOT NULL,
          imei varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          license_number varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          latitude double NOT NULL,
          longitude double NOT NULL,
          speed double NOT NULL,
          signal_quality int NOT NULL,
          rotation double NOT NULL,
          status int NOT NULL,
          status_device int DEFAULT NULL,
          distance double DEFAULT NULL,
          acc int NOT NULL,
          syn int NOT NULL,
          time bigint NOT NULL,
          is_error_insert tinyint(1) NOT NULL,
          is_error_address tinyint(1) NOT NULL,
          address text COLLATE utf8mb4_unicode_ci,
          created_at bigint NOT NULL,
          updated_at bigint DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        ALTER TABLE ${tableName}
          ADD PRIMARY KEY (id),
          ADD UNIQUE KEY imei (imei,time);

        ALTER TABLE ${tableName}
          MODIFY id bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

        COMMIT;
`;
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

  async createTableDeviceSpeed(db, tableName) {
    return await new Promise((resolve, reject) => {
      const query = `
        SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
        START TRANSACTION;
        SET time_zone = "+00:00";
          CREATE TABLE ${tableName} (
            id int UNSIGNED NOT NULL,
            idx int NOT NULL,
            device_id int NOT NULL,
            imei varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            speed varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            syn tinyint(1) NOT NULL,
            time bigint NOT NULL,
            created_at bigint NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        ALTER TABLE ${tableName}
          ADD PRIMARY KEY (id),
          ADD UNIQUE KEY imei (imei,time);
          

        ALTER TABLE ${tableName}
          MODIFY id bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

        COMMIT;
`;
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

  async createTableReportOneDay(db, tableName) {
    return await new Promise((resolve, reject) => {
      const query = `
        SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
        START TRANSACTION;
        SET time_zone = "+00:00";
          CREATE TABLE ${tableName} (
            id int UNSIGNED NOT NULL,
            imei varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            start_idx int NOT NULL,
            start_time bigint NOT NULL,
            end_idx int NOT NULL,
            end_time bigint NOT NULL,
            number_stop int DEFAULT NULL,
            total_stop_time_in_cycle int DEFAULT NULL,
            distance double DEFAULT NULL,
            default_speed double DEFAULT NULL,
            count varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            avg_speed double DEFAULT NULL,
            type tinyint NOT NULL COMMENT '0:offline,1:lost_gps,3:route,4:over speed',
            created_at bigint NOT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        ALTER TABLE ${tableName}
          ADD PRIMARY KEY (id),
          ADD UNIQUE KEY idx_start_time_end_time_start_idx_end_idx_imei (start_time,end_time,start_idx,end_idx,imei);
          

        ALTER TABLE ${tableName}
          MODIFY id bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

        COMMIT;
`;
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

  async createTableReportContinuous(db, tableName) {
    return await new Promise((resolve, reject) => {
      const query = `
        SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
        START TRANSACTION;
        SET time_zone = "+00:00";
          CREATE TABLE ${tableName} (
            id bigint UNSIGNED NOT NULL,
            idx int NOT NULL,
            imei varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            device_id int NOT NULL,
            license_number varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            start_location varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            end_location varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            start_time bigint NOT NULL,
            end_time bigint NOT NULL,
            start_address text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            end_address text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            syn int NOT NULL,
            type tinyint(1) NOT NULL,
            created_at bigint NOT NULL,
            updated_at bigint DEFAULT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        ALTER TABLE ${tableName}
          ADD PRIMARY KEY (id),
          ADD UNIQUE KEY imei (imei,start_time,end_time);
          

        ALTER TABLE ${tableName}
          MODIFY id bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

        COMMIT;
`;
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

  async checkTableExit(db, tableName) {
    return await new Promise((resolve, reject) => {
      const query = `
      SELECT TABLE_NAME 
      FROM information_schema.tables
      WHERE table_schema = "${DB_NAME}"
          AND table_name = "${tableName}"
      LIMIT 1;`;
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
}

module.exports = DatabaseModel;

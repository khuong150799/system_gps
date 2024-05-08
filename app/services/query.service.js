const imageApi = require("../api/imageApi");
const constantNotify = require("../config/constants");

require("dotenv").config();

//get all + get by id + get where in
exports.getData = async (
  db,
  tableName,
  fields = "*",
  where = "1 = 1",
  orderByField = "id",
  orderBySort = "DESC",
  offset = 0,
  limit = 10
) => {
  return await new Promise((resolve, reject) => {
    // const count = `SELECT COUNT(*) FROM ${tableName} WHERE ${where}`;
    const query = `SELECT ${fields} FROM ${tableName} WHERE ${where} ORDER BY ${orderByField} ${orderBySort} LIMIT ${offset},${limit}`;
    db.query(query, (err, dataRes) => {
      console.log(query);
      if (err) {
        console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      // console.log(dataRes);
      return resolve(dataRes);
    });
  });
};

//update
exports.update = async (db, tableName, data, where, checkExit = true) => {
  return await new Promise((resolve, reject) => {
    const query = `UPDATE ${tableName} SET ? WHERE ${where}`;
    db.query(query, data, (err, dataRes) => {
      console.log(err);
      if (err) {
        return reject({ msg: constantNotify.ERROR });
      }
      if (dataRes.affectedRows === 0 && checkExit) {
        return reject({ msg: `ID ${constantNotify.NOT_EXITS}` });
      }
      // console.log('dataRes.insertId', dataRes.insertId);
      return resolve(dataRes);
    });
  });
};

// register
exports.register = async (db, tableName, data) => {
  return await new Promise((resolve, reject) => {
    const query = `INSERT INTO ${tableName} SET ?`;
    db.query(query, data, (err, dataRes) => {
      if (err) {
        console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      // console.log('dataRes.insertId', dataRes.insertId);
      return resolve(dataRes.insertId);
    });
  });
};

// registerDuplicate
exports.registerDuplicate = async (
  db,
  tableName,
  field,
  dataInsert,
  dataUpdate
) => {
  return await new Promise((resolve, reject) => {
    const query = `INSERT INTO ${tableName} (${field}) VALUES ? ON DUPLICATE KEY UPDATE ${dataUpdate}`;
    console.log(query);
    db.query(query, [dataInsert], (err, dataRes) => {
      if (err) {
        console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      // console.log('dataRes.insertId', dataRes.insertId);
      return resolve(dataRes.insertId);
    });
  });
};

// registerMulti
exports.registerMulti = async (db, tableName, fields, data) => {
  return await new Promise((resolve, reject) => {
    const query = `INSERT INTO ${tableName} (${fields}) VALUES ?`;
    db.query(query, [data], (err, dataRes) => {
      if (err) {
        console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      // console.log('dataRes.insertId', dataRes.insertId);
      return resolve(dataRes.insertId);
    });
  });
};

// Delete
exports.delete = async (db, tableName, where, checkExit = true) => {
  return await new Promise((resolve, reject) => {
    const query = `DELETE FROM ${tableName} WHERE ${where}`;

    db.query(query, (err, dataRes) => {
      if (err) {
        return reject({ msg: constantNotify.ERROR });
      }
      if (dataRes.affectedRows === 0 && checkExit) {
        return reject({ msg: `id ${constantNotify.NOT_EXITS}` });
      }
      resolve(dataRes);
    });
  });
};

//updata multi rows with multi conditions
exports.updatMultiRowsWithMultiConditions = async (
  db,
  tableName,
  updates = [],
  dataSendNextPromise = ""
) => {
  return await new Promise((resolve, reject) => {
    if (updates.length === 0) {
      return reject("Giá trị truyền vào không hợp lệ");
    }
    const updateStatements = updates.map((update) => {
      const { field, conditions } = update;

      const caseStatements = conditions.map((condition) => {
        const { conditionField, conditionValue, updateValue } = condition;

        return `
                    WHEN ${conditionField} = ${conditionValue} THEN ${updateValue}
                `;
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
        // console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      if (dataRes.affectedRows === 0) {
        return reject({ msg: `id ${constantNotify.NOT_EXITS}` }, null);
      }
      return resolve(dataSendNextPromise);
    });
  });
};

//sum
exports.getSumData = async (db, tableName, field, where) => {
  return await new Promise((resolve, reject) => {
    const query = `SELECT SUM(${field}) as total_sum FROM ${tableName} WHERE ${where}`;
    db.query(query, (err, dataRes) => {
      // console.log(query);
      if (err) {
        console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      return resolve(dataRes);
    });
  });
};

//count
exports.getCountData = async (db, tableName, field = "*", where) => {
  return await new Promise((resolve, reject) => {
    const query = `SELECT COUNT(${field}) as total FROM ${tableName} WHERE ${where}`;
    db.query(query, (err, dataRes) => {
      // console.log(query);
      if (err) {
        console.log(err);
        return reject({ msg: constantNotify.ERROR });
      }
      return resolve(dataRes);
    });
  });
};

//tree menu
exports.getTreeMenu = async (
  db,
  tableName,
  select,
  where,
  orderByField,
  orderBySort,
  offset,
  limit,
  selectDequy,
  whereDequy,
  orderByFieldDequy,
  orderBySortDequy
) => {
  return await new Promise(async (resolve, reject) => {
    const dataRes = await this.getData(
      db,
      tableName,
      select,
      where,
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
  });
};

//all rows menu
exports.getAllRowsMenu = async (
  db,
  tableName,
  select,
  where,
  orderByField,
  orderBySort,
  selectDequy,
  whereDequy,
  orderByFieldDequy,
  orderBySortDequy
) => {
  return await new Promise(async (resolve, reject) => {
    db.getConnection(async (err, conn) => {
      try {
        if (err) {
          return reject({ msg: constantNotify.SERVER_ERROR });
        }
        const dataRes = await this.getData(
          conn,
          tableName,
          select,
          where,
          orderByField,
          orderBySort,
          0,
          100000
        );
        // console.log('dataRes', dataRes);

        const newArr = [];
        for (let i = 0; i < dataRes.length; i++) {
          newArr.push(dataRes[i]);
          const id = dataRes[i].id;

          const childQuery = `SELECT ${selectDequy} FROM ${tableName} WHERE parent_id = ${id} ${whereDequy} ORDER BY ${orderByFieldDequy} ${orderBySortDequy}`;
          const dataRess = await conn.promise().query(childQuery);

          if (dataRess[0].length > 0) {
            newArr.push(...dataRess[0]);
          }
        }
        conn.release();
        return resolve(newArr);
      } catch (error) {
        conn.release();
        return reject(error);
      }
    });
  });
};

exports.saveImage = async (
  imageFile = [],
  width_pc = 300,
  height_pc = 300,
  width_mobile = 150,
  height_mobile = 150,
  isMain = true,
  type = 1
) => {
  return new Promise(async (resolve, reject) => {
    const imageBuffer = [];

    if (imageFile?.length) {
      if (imageFile.length > 6) {
        return reject({
          msg: `${constantNotify.VALIDATE_FILE_COUNT} 6 hình`,
          param: "image",
        });
      }
      const arrBigFile = [];
      imageFile.forEach((item, i) => {
        if (item.size > 2 * 1024 * 1024) {
          arrBigFile.push(i + 1);
        }
        if (isMain) {
          if (i === 0) {
            imageBuffer.push({
              buffer: item?.buffer,
              originalname: `${Date.now()}_${item?.originalname}`,
              name: "image_main",
            });
          } else {
            imageBuffer.push({
              buffer: item?.buffer,
              originalname: `${Date.now()}_${item?.originalname}`,
              name: "image_detail",
            });
          }
        } else {
          imageBuffer.push({
            buffer: item?.buffer,
            originalname: `${Date.now()}_${item?.originalname}`,
            name: "image",
          });
        }
      });
      if (arrBigFile.length) {
        return reject({
          msg: `Hình ảnh thứ ${arrBigFile.join(",")} ${
            constantNotify.VALIDATE_FILE_SIZE_WITH_INDEX
          }`,
          param: "image",
        });
      }
    }
    const dataSend = {
      type,
      width_pc,
      height_pc,
      width_mobile,
      height_mobile,
      image: JSON.stringify(imageBuffer),
    };
    const response = await imageApi.upload(dataSend);
    if (!response.result) {
      return reject({ msg: constantNotify.ERROR });
    }
    // console.log('response', response);
    // return res.send({ ressult: true, data: response });
    if (response.data?.length > 0) {
      const resultImg = response.data.reduce((result, item) => {
        if (item.type !== 1) {
          const key = item.originalname;
          if (!result[key]) {
            result[key] = [];
          }

          result[key].push(`${item.url}`);
        }
        if (!result.allPath) {
          result.allPath = [];
        }
        result.allPath = [...result.allPath, `./uploads/${item.url}`];

        if (!result.name) {
          result.name = { main: false, detail: false };
        }
        if (item.name === "image_main" && !result.name.main) {
          result.name.main = true;
        }
        if (item.name === "image_detail" && !result.name.detail) {
          result.name.main = true;
        }

        return result;
      }, {});

      return resolve(resultImg);
    }
    return resolve({});
  });
};

exports.deleteImage = (paths) => {
  return new Promise(async (resolve, reject) => {
    const response = await imageApi.delete({ path: JSON.stringify(paths) });

    if (!response.result) {
      return reject({ msg: constantNotify.ERROR });
    }
    return resolve(true);
  });
};

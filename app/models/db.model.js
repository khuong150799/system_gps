var mysql = require("mysql2");
const sqlConfig = require("../config/db.config");
const log_ = require("../ultils/log_");

var pool = mysql.createPool({
  host: sqlConfig.HOST,
  user: sqlConfig.USER,
  password: sqlConfig.PASSWORD,
  database: sqlConfig.DATABASE,
  port: sqlConfig.PORT,
  charset: sqlConfig.CHARSET,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 500,
  queueLimit: 1000,
});
const promisePool = pool?.promise?.();

const db = {
  query: function (query, callback) {
    pool.getConnection(function (err, connection) {
      if (err) {
        log_(err);
        callback && callback(err);
        return;
      }
      //   connection.ping();
      connection.query(query, function (err, records, fields) {
        connection.release();
        try {
          if (err) {
            console.log(err);
            return callback && callback(err);
          }
          if (callback) {
            return callback?.(null, records, fields);
          } else {
            return console.log("No callback is provided");
          }
        } catch (err) {
          log_(err);
        }
      });
    });
  },

  transaction: function (query, callback) {
    pool.getConnection(function (err, connection) {
      if (err || !connection) {
        return log_("ERROR:: Error when connecting to Database", err);
      }

      connection.beginTransaction(function (err) {
        if (err) {
          return log_("ERROR:: BEGIN TRANSACTION ERROR", err);
        }

        connection.query(query, (err, records, fields) => {
          try {
            if (err) {
              connection.rollback();
              return callback && callback(err);
            }
            if (callback) {
              callback?.(null, records, fields);
            } else {
              console.log("No callback is provided");
            }

            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  return log_("ERROR:: COMMIT TRANSACTION ERROR", err);
                });
              }
            });
          } catch (err) {
            log_(err);
            connection.rollback();
          }
        });
      });

      pool.releaseConnection(connection);
    });
  },

  promiseQuery: async function (query) {
    const [records, fields] = await promisePool.query(query);
    return [records, fields];
  },

  connect: function () {
    pool.getConnection(function (err, conn) {
      if (err) {
        log_("error when connecting to Database", err, sqlConfig);
      } else {
        conn.release();
        log_(`SUCCESS:: CONNECTED TO DATABASE >> ${sqlConfig.HOST}`);
      }

      // return pool.releaseConnection(conn);
    });
  },
};
module.exports = db;

class WriteLogsSchema {
  constructor({ user_id, module, ip, os, des, is_deleted, created_at }) {
    this.user_id = user_id;
    this.module = module;
    this.ip = ip;
    this.os = os;
    this.des = des;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
  }
}
module.exports = WriteLogsSchema;

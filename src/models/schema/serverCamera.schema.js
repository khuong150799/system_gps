class ServerCameraSchema {
  constructor({ ip, host, port, publish, is_deleted, created_at, updated_at }) {
    this.ip = ip;
    this.host = host;
    this.port = port;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
module.exports = ServerCameraSchema;

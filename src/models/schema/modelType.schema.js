class ModelTypeSchema {
  constructor({ name, publish, des, is_deleted, created_at, updated_at }) {
    this.name = name;
    this.publish = publish;
    this.des = des;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = ModelTypeSchema;

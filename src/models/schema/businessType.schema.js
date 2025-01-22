class BusinessTypeSchema {
  constructor({ title, is_deleted, created_time, updated_time }) {
    this.title = title;
    this.is_deleted = is_deleted;
    this.created_time = created_time;
    this.updated_time = updated_time;
  }
}

module.exports = BusinessTypeSchema;

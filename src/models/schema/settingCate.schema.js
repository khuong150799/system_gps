class SettingCateSchema {
  constructor({ title, sort, is_deleted, publish, created_at, updated_at }) {
    this.title = title;
    this.sort = sort;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = SettingCateSchema;

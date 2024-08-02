class VerSionSchema {
  constructor({
    keyword,
    name,
    ios,
    android,
    publish,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.keyword = keyword;
    this.name = name;
    this.ios = ios;
    this.android = android;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = VerSionSchema;

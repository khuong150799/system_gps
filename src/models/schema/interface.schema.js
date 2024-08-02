class InterfaceSchema {
  constructor({
    keyword,
    name,
    content,
    publish,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.keyword = keyword;
    this.name = name;
    this.content = content;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = InterfaceSchema;

class RoleSchema {
  constructor({
    name,
    des,
    publish,
    sort,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.name = name;
    this.des = des;
    this.publish = publish;
    this.sort = sort;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = RoleSchema;

class PermissionSchema {
  constructor({
    name,
    method,
    router,
    publish,
    group_,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.name = name;
    this.method = method;
    this.router = router;
    this.publish = publish;
    this.group_ = group_;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = PermissionSchema;

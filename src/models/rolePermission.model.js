class RolePermission {
  constructor({ role_id, level_id, permission_id, created_at, updated_at }) {
    this.role_id = role_id;
    this.level_id = level_id;
    this.permission_id = permission_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = RolePermission;

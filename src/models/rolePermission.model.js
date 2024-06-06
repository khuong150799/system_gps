class RolePermission {
  constructor({ role_id, permission_id, is_deletd, created_at, updated_at }) {
    this.role_id = role_id;
    this.permission_id = permission_id;
    this.is_deletd = is_deletd;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = RolePermission;

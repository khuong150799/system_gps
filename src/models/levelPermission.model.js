class LevelPermission {
  constructor({ level_id, permission_id, is_deletd, created_at, updated_at }) {
    this.level_id = level_id;
    this.permission_id = permission_id;
    this.is_deletd = is_deletd;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = LevelPermission;

class LevelModuleSchema {
  constructor({ level_id, module_id, is_deleted, created_at, updated_at }) {
    this.level_id = level_id;
    this.module_id = module_id;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = LevelModuleSchema;

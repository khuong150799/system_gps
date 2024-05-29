class UsersRoleModel {
  constructor({ user_id, role_id, created_at, updated_at }) {
    this.user_id = user_id;
    this.role_id = role_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = UsersRoleModel;

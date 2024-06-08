class UsersSchema {
  constructor({
    parent_id,
    username,
    password,
    text_pass,
    expired_on,
    is_actived,
    is_deleted,
    is_main,
    is_team,
    created_at,
    updated_at,
  }) {
    this.parent_id = parent_id;
    this.username = username;
    this.password = password;
    this.text_pass = text_pass;
    this.expired_on = expired_on;
    this.is_actived = is_actived;
    this.is_deleted = is_deleted;
    this.is_main = is_main;
    this.is_team = is_team;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = UsersSchema;

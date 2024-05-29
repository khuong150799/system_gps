class KeyTokenModel {
  constructor({
    user_id,
    client_id,
    publish_key_token,
    publish_key_refresh_token,
    created_at,
    updated_at,
  }) {
    this.user_id = user_id;
    this.client_id = client_id;
    this.publish_key_token = publish_key_token;
    this.publish_key_refresh_token = publish_key_refresh_token;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
module.exports = KeyTokenModel;

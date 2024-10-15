class TokenFirebaseSchema {
  constructor({ user_id, client_id, token, created_at }) {
    this.user_id = user_id;
    this.client_id = client_id;
    this.token = token;
    this.created_at = created_at;
  }
}
module.exports = TokenFirebaseSchema;

class UsersCustomersModel {
  constructor({ user_id, customer_id, created_at, updated_at }) {
    this.user_id = user_id;
    this.customer_id = customer_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = UsersCustomersModel;

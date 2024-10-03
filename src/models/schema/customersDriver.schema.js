class CustomerDriverSchema {
  constructor({
    creator,
    customer_id,
    driver_id,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.creator = creator;
    this.customer_id = customer_id;
    this.driver_id = driver_id;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = CustomerDriverSchema;

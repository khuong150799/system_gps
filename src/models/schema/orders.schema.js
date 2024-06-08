class OrdersSchema {
  constructor({
    code,
    creator_user_id,
    creator_customer_id,
    reciver,
    quantity,
    orders_status_id,
    note,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.code = code;
    this.creator_user_id = creator_user_id;
    this.creator_customer_id = creator_customer_id;
    this.reciver = reciver;
    this.quantity = quantity;
    this.orders_status_id = orders_status_id;
    this.note = note;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = OrdersSchema;

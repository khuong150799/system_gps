class SimSchema {
  constructor({
    seri_display,
    seri_sim,
    phone,
    price,
    status_id,
    activation_date,
    expired_date,
    type_id,
    note,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.seri_display = seri_display;
    this.seri_sim = seri_sim;
    this.phone = phone;
    this.price = price;
    this.status_id = status_id;
    this.activation_date = activation_date;
    this.expired_date = expired_date;
    this.type_id = type_id;
    this.note = note;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = SimSchema;

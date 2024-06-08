class DriverSchema {
  constructor({
    creator,
    customer_id,
    name,
    license_number,
    birthday,
    citizen_identity_card,
    gender,
    phone,
    address,
    license_type_id,
    expired_on,
    activation_date,
    is_check,
    is_actived,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.creator = creator;
    this.customer_id = customer_id;
    this.name = name;
    this.license_number = license_number;
    this.birthday = birthday;
    this.citizen_identity_card = citizen_identity_card;
    this.gender = gender;
    this.phone = phone;
    this.address = address;
    this.license_type_id = license_type_id;
    this.expired_on = expired_on;
    this.activation_date = activation_date;
    this.is_check = is_check;
    this.is_actived = is_actived;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
module.exports = DriverSchema;

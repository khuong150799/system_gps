class CustomersSchema {
  constructor({
    level_id,
    code,
    name,
    company,
    email,
    phone,
    address,
    // business_type_id,
    tax_code,
    website,
    publish,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.level_id = level_id;
    this.code = code;
    this.name = name;
    this.company = company;
    this.email = email;
    this.phone = phone;
    this.address = address;
    this.tax_code = tax_code;
    // this.business_type_id = business_type_id;
    this.website = website;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = CustomersSchema;

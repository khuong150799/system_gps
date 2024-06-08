class ServicePackageSchema {
  constructor({
    name,
    fees_to_customer,
    fees_to_agency,
    fees_to_distributor,
    one_month_fee_to_customer,
    one_month_fee_to_agency,
    one_month_fee_to_distributor,
    times,
    publish,
    note,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.name = name;
    this.fees_to_customer = fees_to_customer;
    this.fees_to_agency = fees_to_agency;
    this.fees_to_distributor = fees_to_distributor;
    this.one_month_fee_to_customer = one_month_fee_to_customer;
    this.one_month_fee_to_agency = one_month_fee_to_agency;
    this.one_month_fee_to_distributor = one_month_fee_to_distributor;
    this.times = times;
    this.publish = publish;
    this.note = note;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = ServicePackageSchema;

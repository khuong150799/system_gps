class ModelSchema {
  constructor({
    name,
    made_in,
    model_type_id,
    disk_id,
    quantity_channel,
    note,
    publish,
    is_gps,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.name = name;
    this.made_in = made_in;
    this.model_type_id = model_type_id;
    this.disk_id = disk_id;
    this.quantity_channel = quantity_channel;
    this.note = note;
    this.publish = publish;
    this.is_gps = is_gps;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = ModelSchema;

class ModelConnectionTypeSchema {
  constructor({ model_id, connection_type_id, created_at, updated_at }) {
    this.model_id = model_id;
    this.connection_type_id = connection_type_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = ModelConnectionTypeSchema;

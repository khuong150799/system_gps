class RenewalCodeSchema {
  constructor({ code, type, is_used, created_at }) {
    this.code = code;
    this.type = type;
    this.is_used = is_used;
    this.created_at = created_at;
  }
}

module.exports = RenewalCodeSchema;

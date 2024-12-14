class RenewalCodeSchema {
  constructor({ code, type, platform_value, is_used, created_at }) {
    this.code = code;
    this.type = type;
    this.platform_value = platform_value;
    this.is_used = is_used;
    this.created_at = created_at;
  }
}

module.exports = RenewalCodeSchema;

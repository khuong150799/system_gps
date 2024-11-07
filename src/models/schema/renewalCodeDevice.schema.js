class RenewalCodeDeviceSchema {
  constructor({ user_id, renewal_code_id, device_id, created_at }) {
    this.user_id = user_id;
    this.renewal_code_id = renewal_code_id;
    this.device_id = device_id;
    this.created_at = created_at;
  }
}

module.exports = RenewalCodeDeviceSchema;

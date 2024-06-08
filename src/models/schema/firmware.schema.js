class FirmwareSchema {
  constructor({
    name,
    model_id,
    version_hardware,
    version_software,
    path_version,
    checksum,
    note,
    path_note,
    publish,
    is_deleted,
    created_at,
    updated_at,
  }) {
    this.name = name;
    this.model_id = model_id;
    this.version_hardware = version_hardware;
    this.version_software = version_software;
    this.path_version = path_version;
    this.checksum = checksum;
    this.note = note;
    this.path_note = path_note;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = FirmwareSchema;

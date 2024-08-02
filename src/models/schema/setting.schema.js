class SettingSchema {
  constructor({
    title,
    keyword,
    setting_cate_id,
    sort,
    on_default,
    is_disabled,
    is_deleted,
    publish,
    created_at,
    updated_at,
  }) {
    this.title = title;
    this.keyword = keyword;
    this.setting_cate_id = setting_cate_id;
    this.sort = sort;
    this.on_default = on_default;
    this.is_disabled = is_disabled;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = SettingSchema;

class ModuleModel {
  constructor({
    parent_id,
    name,
    link,
    component,
    icon,
    publish,
    is_deleted,
    sort,
    type,
    created_at,
    updated_at,
  }) {
    this.parent_id = parent_id;
    this.name = name;
    this.link = link;
    this.component = component;
    this.icon = icon;
    this.publish = publish;
    this.is_deleted = is_deleted;
    this.sort = sort;
    this.type = type;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = ModuleModel;

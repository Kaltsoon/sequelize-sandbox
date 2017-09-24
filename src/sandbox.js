const AFTER_SAVE_HOOK_NAME = '__sequelizeSandboxAfterSave__';
const AFTER_CREATE_HOOK_NAME = '__sequelizeSandboxAfterCreate__';

class Sandbox {
  constructor(sequelize) {
    this._sequelize = sequelize;
    this._dirtyModels = {};
  }

  static create(...args) {
    return new Sandbox(...args);
  }

  initialize() {
    this._addHooks();

    return this._sequelize.authenticate();
  }

  clear() {
    return this._clearDirtyModels();
  }

  destroy() {
    this._removeHooks();

    return this.clear()
      .then(() => this._sequelize.close());
  }

  _getModel(name) {
    return this._sequelize.models[name];
  }

  _addHooksToModel(modelName) {
    const model = this._getModel(modelName);

    model.addHook('afterSave', AFTER_SAVE_HOOK_NAME, () => {
      this._dirtyModels[modelName] = true;
    });

    model.addHook('afterCreate', AFTER_CREATE_HOOK_NAME, () => {
      this._dirtyModels[modelName] = true;
    });
  }

  _removeHooksFromModel(modelName) {
    const model = this._getModel(modelName);

    model.removeHook('afterSave', AFTER_SAVE_HOOK_NAME);
    model.removeHook('afterCreate', AFTER_CREATE_HOOK_NAME);
  }

  _getModelNames() {
    return Object.keys(this._sequelize.models);
  }

  _addHooks() {
    this._getModelNames().forEach((name) => {
      this._addHooksToModel(name);
    });
  }

  _removeHooks() {
    this._getModelNames().forEach((name) => {
      this._removeHooksFromModel(name);
    });
  }

  _clearDirtyModels() {
    const dirtyModelNames = Object.keys(this._dirtyModels);

    const promises = dirtyModelNames.map(name => this._getModel(name).destroy({ where: {} }));

    return Promise.all(promises)
      .then((result) => {
        this._dirtyModels = {};

        return result;
      });
  }
}

module.exports = Sandbox;

const test = require('ava');
const path = require('path');
const sinon = require('sinon');
const Sequelize = require('sequelize');
const Sandbox = require('../index');

const sequelize = new Sequelize('test', null, null, { dialect: 'sqlite', storage: path.join(__dirname, 'db.sqlite') });

const FirstModel = sequelize.define('FirstModel', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
});

const SecondModel = sequelize.define('SecondModel', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
});

test('Adds hooks to models', async (t) => {
  const firstModelAddHookSpy = sinon.spy();
  const secondModelAddHookSpy = sinon.spy();
  const authenticateStub = sinon.stub().returns(Promise.resolve());

  const sequelizeStub = {
    models: {
      FirstModel: {
        addHook: firstModelAddHookSpy,
      },
      SecondModel: {
        addHook: secondModelAddHookSpy,
      },
    },
    authenticate: authenticateStub,
  };

  const sandbox = Sandbox.create(sequelizeStub);

  await sandbox.initialize();

  t.is(authenticateStub.calledOnce, true);

  t.deepEqual(firstModelAddHookSpy.getCall(0).args.slice(0, 2), ['afterSave', '__sequelizeSandboxAfterSave__']);
  t.deepEqual(firstModelAddHookSpy.getCall(1).args.slice(0, 2), ['afterCreate', '__sequelizeSandboxAfterCreate__']);

  t.deepEqual(secondModelAddHookSpy.getCall(0).args.slice(0, 2), ['afterSave', '__sequelizeSandboxAfterSave__']);
  t.deepEqual(secondModelAddHookSpy.getCall(1).args.slice(0, 2), ['afterCreate', '__sequelizeSandboxAfterCreate__']);
});

test('Clears dirty models', async (t) => {
  const sandbox = Sandbox.create(sequelize);

  await sequelize.sync({ force: true });

  await sandbox.initialize();

  await Promise.all([
    FirstModel.create({}),
    FirstModel.create({}),
    SecondModel.create({}),
    SecondModel.create({}),
  ]);

  await sandbox.clear();

  t.is(await FirstModel.count(), 0);
  t.is(await SecondModel.count(), 0);
});

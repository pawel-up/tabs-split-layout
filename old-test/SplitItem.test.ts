import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ISplitItem, SplitItem } from '../src/SplitItem.js';
import { TabsLayout } from '../src/TabsLayout.js';
import { SplitPanel } from '../src/SplitPanel.js';
import { close as closeIcon } from '../src/lib/icons.js';

describe('layout', () => {
  describe('SplitItem', () => {
    describe('new()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('sets the kind', () => {
        const kind = 'test-kind';
        const instance = new SplitItem(manager, {
          key: '',
          kind,
          label: '',
        });
        assert.equal(instance.kind, kind);
      });

      it('sets the key', () => {
        const key = 'test-key';
        const instance = new SplitItem(manager, {
          key,
          kind: '',
          label: '',
        });
        assert.equal(instance.key, key);
      });

      it('sets the label', () => {
        const label = 'test-label';
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label,
        });
        assert.equal(instance.label, label);
      });

      it('sets the parent', () => {
        const parent = 'test-parent';
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          parent,
        });
        assert.equal(instance.parent, parent);
      });

      it('re-sets the parent', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          parent: 'test-parent',
        }
        const instance = new SplitItem(manager, schema);
        delete schema.parent;
        instance.new(schema);
        assert.isUndefined(instance.parent);
      });

      it('sets the icon', () => {
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          icon: closeIcon,
        });
        assert.equal(instance.icon, closeIcon);
      });

      it('re-sets the icon', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          icon: closeIcon,
        }
        const instance = new SplitItem(manager, schema);
        delete schema.icon;
        instance.new(schema);
        assert.isUndefined(instance.icon);
      });

      it('sets the pinned', () => {
        const pinned = true;
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          pinned,
        });
        assert.isTrue(instance.pinned);
      });

      it('re-sets the pinned', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          pinned: true,
        }
        const instance = new SplitItem(manager, schema);
        delete schema.pinned;
        instance.new(schema);
        assert.isUndefined(instance.pinned);
      });

      it('sets the persistent', () => {
        const persistent = true;
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          persistent,
        });
        assert.isTrue(instance.persistent);
      });

      it('re-sets the persistent', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          persistent: true,
        }
        const instance = new SplitItem(manager, schema);
        delete schema.persistent;
        instance.new(schema);
        assert.isUndefined(instance.persistent);
      });

      it('sets the loading', () => {
        const loading = true;
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          loading,
        });
        assert.isTrue(instance.loading);
      });

      it('re-sets the loading', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          loading: true,
        }
        const instance = new SplitItem(manager, schema);
        delete schema.loading;
        instance.new(schema);
        assert.isUndefined(instance.loading);
      });

      it('sets the isDirty', () => {
        const isDirty = true;
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          isDirty,
        });
        assert.isTrue(instance.isDirty);
      });

      it('re-sets the isDirty', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          isDirty: true,
        }
        const instance = new SplitItem(manager, schema);
        delete schema.isDirty;
        instance.new(schema);
        assert.isUndefined(instance.isDirty);
      });

      it('sets the index', () => {
        const index = 1;
        const instance = new SplitItem(manager, {
          key: '',
          kind: '',
          label: '',
          index,
        });
        assert.equal(instance.index, index);
      });

      it('re-sets the index', () => {
        const schema: ISplitItem = {
          key: '',
          kind: '',
          label: '',
          index: 1,
        }
        const instance = new SplitItem(manager, schema);
        delete schema.index;
        instance.new(schema);
        assert.equal(instance.index, 0);
      });
    });

    describe('toJSON()', () => {
      let manager: TabsLayout;
      let base: ISplitItem;

      beforeEach(() => {
        manager = new TabsLayout();
        base = {
          key: 'test-key',
          kind: 'test-kind',
          label: 'test-label',
        }
      });

      it('serializes the kind', () => {
        const instance = new SplitItem(manager, base);
        assert.equal(instance.toJSON().kind, 'test-kind');
      });

      it('serializes the key', () => {
        const instance = new SplitItem(manager, base);
        assert.equal(instance.toJSON().key, 'test-key');
      });

      it('serializes the label', () => {
        const instance = new SplitItem(manager, base);
        assert.equal(instance.toJSON().label, 'test-label');
      });

      it('serializes the label', () => {
        const instance = new SplitItem(manager, { ...base, parent: "test-parent" });
        assert.equal(instance.toJSON().parent, 'test-parent');
      });

      it('serializes the icon', () => {
        const instance = new SplitItem(manager, { ...base, icon: closeIcon });
        assert.equal(instance.toJSON().icon, closeIcon);
      });

      it('serializes the pinned', () => {
        const instance = new SplitItem(manager, { ...base, pinned: false });
        assert.isFalse(instance.toJSON().pinned);
      });

      it('serializes the persistent', () => {
        const instance = new SplitItem(manager, { ...base, persistent: false });
        assert.isFalse(instance.toJSON().persistent);
      });

      it('serializes the loading', () => {
        const instance = new SplitItem(manager, { ...base, loading: false });
        assert.isFalse(instance.toJSON().loading);
      });

      it('serializes the isDirty', () => {
        const instance = new SplitItem(manager, { ...base, isDirty: false });
        assert.isFalse(instance.toJSON().isDirty);
      });

      it('serializes the index', () => {
        const instance = new SplitItem(manager, { ...base, index: 0 });
        assert.equal(instance.toJSON().index, 0);
      });

      it('serializes the value', () => {
        const instance = new SplitItem(manager, { ...base, value: 'something' });
        assert.equal(instance.toJSON().value, 'something');
      });

      it('serializes the value with the toJSON() function', () => {
        const value = {
          a: 'a',
          toJSON: (): unknown => {
            const serialized = {
              a: 'b',
            };
            return serialized;
          }
        };
        const instance = new SplitItem(manager, { ...base, value });
        assert.deepEqual(instance.toJSON().value, { a: 'b' });
      });
    });

    describe('getParents()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns undefined when no parent', () => {
        const instance = new SplitItem(manager, {
          key: 'test-key',
          kind: 'test-kind',
          label: 'test-label',
        });
        const result = instance.getParents();
        assert.deepEqual(result, []);
      });

      it('returns the parent panel', () => {
        const panel = manager.addPanel();
        const instance = panel.addItem({
          key: 'test-key',
          kind: 'test-kind',
          label: 'test-label',
        });
        const result = instance.getParents();
        assert.deepEqual(result, [panel]);
      });
    });

    // describe('remove()', () => {
    //   let manager: TabsLayout;
    //   let panel: SplitPanel;
    //   let item: SplitItem;

    //   beforeEach(() => {
    //     manager = new TabsLayout();
    //     panel = manager.addPanel();
    //     item = panel.addItem({
    //       key: 'test-key',
    //       kind: 'test-kind',
    //       label: 'test-label',
    //     });
    //   });

    //   it('removes the item from definitions', () => {
    //     item.remove();
    //     const result = manager.definitions.get(item.key);
    //     assert.notOk(result);
    //   });

    //   it('removes the item from the parent items', () => {
    //     item.remove();
    //     assert.deepEqual(panel.items, []);
    //   });

    //   it('informs the panel listeners about item removed', () => {
    //     const spy = sinon.spy();
    //     manager.addEventListener('closetab', spy);
    //     item.remove();
    //     assert.isTrue(spy.calledOnce, 'the event is dispatched');
    //     const e = spy.args[0][0] as CustomEvent<ITabCloseDetail>;
    //     assert.equal(e.detail.tab, item.key, 'has the item key on the detail')
    //     assert.equal(e.detail.panel, panel.key, 'has the panel key on the detail')
    //   });

    //   it('informs the panel listeners about layout change', () => {
    //     const spy = sinon.spy();
    //     manager.addEventListener('change', spy);
    //     item.remove();
    //     assert.isTrue(spy.calledOnce, 'the event is dispatched');
    //   });
    // });

    // describe('setSelected()', () => {
    //   let manager: TabsLayout;
    //   let panel: SplitPanel;
    //   let item: SplitItem;

    //   beforeEach(() => {
    //     manager = new TabsLayout();
    //     panel = manager.addPanel();
    //     item = panel.addItem({
    //       key: 'test-key',
    //       kind: 'test-kind',
    //       label: 'test-label',
    //     });
    //   });

    //   it('sets item selected with the panel', () => {
    //     item.setSelected();
    //     assert.equal(panel.selected, item.key);
    //   });

    //   it('informs the panel listeners about layout change', () => {
    //     const spy = sinon.spy();
    //     manager.addEventListener('change', spy);
    //     item.setSelected();
    //     assert.isTrue(spy.calledOnce, 'the event is dispatched');
    //   });
    // });

    describe('setLabel()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;
      let item: SplitItem;

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
        item = panel.addItem({
          key: 'test-key',
          kind: 'test-kind',
          label: 'test-label',
        });
      });

      it('sets the label when changed', () => {
        item.setLabel('other');
        assert.equal(item.label, 'other');
      });

      it('calls updateView on the panel', () => {
        const spy = sinon.spy(panel, 'updateView');
        item.setLabel('other');
        assert.isTrue(spy.calledOnce, 'the method is called');
      });

      it('informs the panel listeners about layout change', () => {
        const spy = sinon.spy();
        manager.addEventListener('change', spy);
        item.setLabel('other');
        assert.isTrue(spy.calledOnce, 'the event is dispatched');
      });

      it('ignores side effects when value is the same', () => {
        const spy = sinon.spy();
        manager.addEventListener('change', spy);
        item.setLabel('test-label');
        assert.isFalse(spy.called, 'the event is not dispatched');
      });
    });
  });
});

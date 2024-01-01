import { assert, aTimeout, fixture, html } from '@open-wc/testing';
import { TemplateResult } from 'lit';
import sinon from 'sinon';
import { ISplitItem, SplitItem } from '../src/SplitItem.js';
import { ITabCloseDetail, TabsLayout } from '../src/TabsLayout.js';
import { ISplitPanel, SplitPanel } from '../src/SplitPanel.js';
import SplitView from '../src/SplitView.js';
import { LayoutType, SplitDirection, SplitRegion } from '../src/type.js';
import '../src/define/split-view.js';

describe('layout', () => {
  describe('TabsLayout', () => {
    async function splitViewFixture(key: string): Promise<SplitView> {
      return fixture(html`
      <split-view .key="${key}">
        <div id="v1"><button>a</button></div>
        <div id="v2"><button>b</button></div>
      </split-view>`);
    }

    describe('new()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('sets the active', () => {
        manager.new({
          definitions: [],
          items: [],
          active: 'test-id',
        });

        assert.equal(manager.active, 'test-id')
      });

      it('restores the items', () => {
        manager.new({
          definitions: [],
          items: ['test-id'],
        });
        assert.lengthOf(manager.items, 1, 'has a single item');
        const [item] = manager.items;
        assert.equal(item.type, LayoutType.panel, 'the type is a panel by default');
        assert.equal(item.key, 'test-id', 'the key is restored');
      });

      it('restores a split panel', () => {
        manager.new({
          definitions: [{
            type: LayoutType.panel,
            value: {
              layout: SplitDirection.vertical,
              key: 'test-key'
            } as ISplitPanel,
          }],
          items: [],
        });
        assert.equal(manager.definitions.size, 1, 'has a single definition');
        const read = manager.definitions.get('test-key')!;
        assert.ok(read, 'definitions have the item')
        
        assert.instanceOf(read.value, SplitPanel, 'has the value');
        assert.equal(read.type, LayoutType.panel, 'has the type');
      });

      it('restores a split item', () => {
        manager.new({
          definitions: [{
            type: LayoutType.item,
            value: {
              key: 'test-key',
              kind: 'test-kind',
              label: 'test-label'
            } as ISplitItem,
          }],
          items: [],
        });
        assert.equal(manager.definitions.size, 1, 'has a single definition');
        const read = manager.definitions.get('test-key')!;
        assert.ok(read, 'definitions have the item')

        assert.equal(read.type, LayoutType.item, 'has the type');
        assert.instanceOf(read.value, SplitItem, 'has the value');
      });
    });

    describe('toJSON()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('serializes an item', () => {
        manager.new({
          definitions: [{
            type: LayoutType.item,
            value: {
              key: 'test-key',
              kind: 'test-kind',
              label: 'test-label'
            } as ISplitItem,
          }],
          items: [],
        });

        const result = manager.toJSON();
        const { definitions } = result;
        assert.lengthOf(definitions, 1, 'definitions has one item');
        const [item] = definitions;
        assert.equal(item.type, LayoutType.item, 'the item is the "item" type');
        assert.equal(item.value.key, 'test-key', 'the item has the key');
      });

      it('serializes a panel', () => {
        manager.new({
          definitions: [{
            type: LayoutType.panel,
            value: {
              layout: SplitDirection.vertical,
              key: 'test-key'
            } as ISplitPanel,
          }],
          items: [],
        });

        const result = manager.toJSON();
        const { definitions } = result;
        assert.lengthOf(definitions, 1, 'definitions has one item');
        const [item] = definitions;
        assert.equal(item.type, LayoutType.panel, 'the panel is the "panel" type');
        assert.equal(item.value.key, 'test-key', 'the panel has the key');
      });

      it('serializes the active', () => {
        manager.new({
          definitions: [],
          items: [],
          active: 'test-key'
        });

        const result = manager.toJSON();
        const { active } = result;
        assert.equal(active, 'test-key');
      });
    });

    describe('initialize()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      afterEach(() => {
        manager.dispose();
      });

      it('ignores then state when not provided', async () => {
        await manager.initialize();
        assert.deepEqual(manager.items, []);
        assert.equal(manager.definitions.size, 0);
        assert.isUndefined(manager.active);
      });

      it('calls the new() function when the state is set', async () => {
        const spy = sinon.spy(manager, 'new');
        await manager.initialize({
          definitions: [],
          items: [],
        });
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('findView()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns undefined when no panel', () => {
        const result = manager.findView('some-key');
        assert.isUndefined(result);
      });

      it('returns the split view element', async () => {
        await splitViewFixture('abc');
        const result = manager.findView('abc');
        assert.ok(result);
      });
    });

    describe('getParents()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns empty array when no item or panel', () => {
        const result = manager.getParents('unknown');
        assert.deepEqual(result, []);
      });

      it('returns a parent for a panel that is a panel', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const result = manager.getParents(p2.key);
        assert.deepEqual(result, [p1]);
      });

      it('returns empty array when the parent is the manager', () => {
        const p1 = manager.addPanel();
        const result = manager.getParents(p1.key);
        assert.deepEqual(result, []);
      });

      it('returns a parent for an item', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          kind: 'a',
          key: 'b',
          label: 'c',
        });
        const result = manager.getParents(i1.key);
        assert.deepEqual(result, [p1]);
      });

      it('returns empty array for an item that has been removes', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          kind: 'a',
          key: 'b',
          label: 'c',
        });
        p1.removeChildItem(i1);
        const result = manager.getParents(i1.key);
        assert.deepEqual(result, []);
      });
    });

    describe('findPanel()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('finds a direct panel', () => {
        const p1 = manager.addPanel();
        const result = manager.findPanel(p1.key);
        assert.deepEqual(result, p1);
      });

      it('finds an indirect panel', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const result = manager.findPanel(p2.key);
        assert.deepEqual(result, p2);
      });

      it('returns undefined when no panel', () => {
        const result = manager.findPanel('test');
        assert.isUndefined(result);
      });

      it('returns undefined when referencing an item', () => {
        const i1 = manager.addItem({
          key: '',
          kind: '',
          label: '',
        });
        const result = manager.findPanel(i1.key);
        assert.isUndefined(result);
      });
    });

    describe('findItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('finds an item', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: '',
          kind: '',
          label: '',
        });
        const result = manager.findItem(i1.key);
        assert.deepEqual(result, i1);
      });

      it('returns undefined when no item', () => {
        const result = manager.findItem('test');
        assert.isUndefined(result);
      });

      it('returns undefined when referencing a panel', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const result = manager.findItem(p2.key);
        assert.isUndefined(result);
      });
    });

    describe('notifyChange()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('dispatches the "change" event', () => {
        const spy = sinon.spy();
        manager.addEventListener('change', spy);
        manager.notifyChange();
        assert.isTrue(spy.calledOnce);
      });

      it('calls the scheduleStore() method', () => {
        const spy = sinon.spy(manager, 'scheduleStore');
        manager.notifyChange();
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('dispatchNameItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('dispatches the "nameitem" event', () => {
        const i1 = manager.addItem({
          key: '',
          kind: '',
          label: '',
        });
        const spy = sinon.spy();
        manager.addEventListener('nameitem', spy);
        manager.dispatchNameItem(i1);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('notifyTabClose()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('dispatches the "nameitem" event', () => {
        const spy = sinon.spy();
        manager.addEventListener('closetab', spy);
        manager.notifyTabClose('test', 'key');
        assert.isTrue(spy.calledOnce);
        const event = spy.args[0][0] as CustomEvent<ITabCloseDetail>;
        assert.equal(event.detail.tab, 'test');
        assert.equal(event.detail.panel, 'key');
      });
    });

    describe('requestNameUpdate()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('dispatches the "nameitem" event', () => {
        const i1 = manager.addItem({
          key: '',
          kind: '',
          label: '',
        });
        const spy = sinon.spy();
        manager.addEventListener('nameitem', spy);
        manager.requestNameUpdate(i1.key);
        assert.isTrue(spy.calledOnce);
        const event = spy.args[0][0] as CustomEvent<SplitItem>;
        assert.deepEqual(event.detail, i1);
      });

      it('does not dispatch the "nameitem" event when the item is not found', () => {
        const spy = sinon.spy();
        manager.addEventListener('nameitem', spy);
        manager.requestNameUpdate('unknown');
        assert.isFalse(spy.called);
      });

      it('calls update view on the parent', () => {
        const p1 = manager.addPanel();
        const i1 = manager.addItem({
          key: 'test-id',
          kind: '',
          label: '',
        });
        manager.addEventListener('nameitem', (e: Event): void => {
          const event = e as CustomEvent<SplitItem>;
          event.detail.label = 'changed';
        });
        const spy = sinon.spy(p1, 'updateView');
        manager.requestNameUpdate(i1.key);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('addPanel()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('adds a panel to the definitions', () => {
        const p1 = manager.addPanel();
        const def = manager.definitions.get(p1.key);
        assert.deepEqual(def?.value, p1);
      });

      it('adds a panel to the root items', () => {
        const p1 = manager.addPanel();
        const item = manager.items.find(i => i.key === p1.key)!;
        assert.ok(item, 'has the item');
        assert.equal(item?.type, LayoutType.panel, 'has the correct type');
      });

      it('adds a panel to another panel', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const def = manager.definitions.get(p2.key);
        assert.deepEqual(def?.value, p2, 'has the definition');
        const parent = p2.getParent();
        assert.deepEqual(parent, p1, 'has the parent');
      });

      it('throws when the parent panel is not found', () => {
        assert.throws(() => {
          manager.addPanel({ parent: 'unknown' });
        }, `Parent panel not found.`);
      });

      it('throws when the parent panel already has items', () => {
        const p1 = manager.addPanel();
        p1.addItem({
          kind: 'a',
          key: 'b',
          label: 'c',
        });
        assert.throws(() => {
          manager.addPanel({ parent: p1.key });
        }, `Unable to create panel in a panel that has items.`);
      });
      
      it('sets the default layout', () => {
        const p1 = manager.addPanel();
        assert.equal(p1.layout, SplitDirection.horizontal);
      });
      
      it('sets the configured layout', () => {
        const p1 = manager.addPanel({ layout: SplitDirection.vertical });
        assert.equal(p1.layout, SplitDirection.vertical);
      });
    });

    describe('addItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('adds a panel with an item', () => {
        const i1 = manager.addItem({
          key: 'test-id',
          kind: '',
          label: '',
        });
        const parent = i1.getParents()[0];
        assert.ok(parent, 'has the parent');
        const foundParent = manager.findPanel(parent.key);
        assert.ok(foundParent, 'the parent is in the layout');
        const foundItem = manager.findItem(i1.key);
        assert.ok(foundItem, 'the item is in the layout');
      });

      it('adds an item to a first panel that has no panels', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const i1 = manager.addItem({
          key: 'test-id',
          kind: '',
          label: '',
        });
        const itemParent = i1.getParents()[0];
        // p1 has panels in it so it must be p2.
        assert.deepEqual(itemParent, p2);
      });

      it('adds an item to an active panel', () => {
        manager.addPanel();
        const p2 = manager.addPanel();
        manager.setActive(p2.key);
        const i1 = manager.addItem({
          key: 'test-id',
          kind: '',
          label: '',
        });
        const itemParent = i1.getParents()[0];
        assert.deepEqual(itemParent, p2);
      });

      it('notifies update', () => {
        const spy = sinon.spy();
        manager.addEventListener('change', spy);
        manager.addItem({
          key: 'test-id',
          kind: '',
          label: '',
        });
        assert.isTrue(spy.calledOnce);
      });

      it('updates the view', async () => {
        const p1 = manager.addPanel();
        const view = await splitViewFixture(p1.key);
        const spy = sinon.spy(view, 'requestUpdate');
        manager.addItem({
          key: 'test-id',
          kind: '',
          label: '',
        });
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('updateView()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('calls updateView() on specified panel', () => {
        const p1 = manager.addPanel();
        const spy = sinon.spy(p1, 'updateView');
        manager.updateView(p1.key);
        assert.isTrue(spy.calledOnce);
      });

      it('calls updateView() on an active panel', () => {
        const p1 = manager.addPanel();
        manager.setActive(p1.key);
        const spy = sinon.spy(p1, 'updateView');
        manager.updateView();
        assert.isTrue(spy.calledOnce);
      });

      it('does nothing when an active panel is not set', () => {
        const p1 = manager.addPanel();
        const spy = sinon.spy(p1, 'updateView');
        manager.updateView();
        assert.isFalse(spy.called);
      });
    });

    describe('setItemLabel()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('sets the label on an item', () => {
        const i1 = manager.addItem({
          key: 'test-key',
          kind: '',
          label: '',
        });
        manager.setItemLabel(i1.key, 'updated');
        assert.equal(i1.label, 'updated');
      });

      it('does nothing when the item is not in the manager', () => {
        const i1 = manager.addItem({
          key: 'test-key',
          kind: '',
          label: '',
        });
        manager.setItemLabel('another', 'updated');
        assert.equal(i1.label, '');
      });

      it('calls the updateView() on the panel', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'test-key',
          kind: '',
          label: '',
        });
        const spy = sinon.spy(p1, 'updateView')
        manager.setItemLabel(i1.key, 'updated');
        assert.isTrue(spy.calledOnce);
      });

      it('notifies the change', () => {
        const i1 = manager.addItem({
          key: 'test-key',
          kind: '',
          label: '',
        });
        const spy = sinon.spy();
        manager.addEventListener('change', spy)
        manager.setItemLabel(i1.key, 'updated');
        assert.isTrue(spy.calledOnce);
      });

      it('does nothing when the label is the same', () => {
        const i1 = manager.addItem({
          key: 'test-key',
          kind: '',
          label: 'value',
        });
        const spy = sinon.spy();
        manager.addEventListener('change', spy)
        manager.setItemLabel(i1.key, 'value');
        assert.isFalse(spy.called);
      });
    });

    describe('removeItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });
      
      it('removes an item from the layout', () => {
        const i1 = manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        manager.removeItem(i1.key);
        const read = manager.findItem(i1.key);
        assert.isUndefined(read);
      });

      it('removes only the select item', () => {
        const i1 = manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = manager.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const i3 = manager.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        manager.removeItem(i2.key);
        assert.ok(manager.findItem(i1.key));
        assert.isUndefined(manager.findItem(i2.key));
        assert.ok(manager.findItem(i3.key));
      });

      it('does nothing when item not managed by the manager', () => {
        const i1 = manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        manager.removeItem('other');
        assert.ok(manager.findItem(i1.key));
      });

      it('removes the panel when it was the last item', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const p3 = p1.addPanel();
        const i1 = p3.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        manager.removeItem(i1.key);
        const read3 = manager.findPanel(p3.key);
        assert.isUndefined(read3, 'removes the parent panel');
        const read2 = manager.findPanel(p2.key);
        assert.ok(read2, 'has the other panel');
      });

      it('does not remove a panel when it was the other items', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const i1 = p2.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p2.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        manager.removeItem(i1.key);
        const read2 = manager.findPanel(p2.key);
        assert.ok(read2, 'has the other panel');
      });
    });

    // describe('removeRelative()', () => {
    //   let manager: TabsLayout;

    //   beforeEach(() => {
    //     manager = new TabsLayout();
    //   });

    //   it('calls removeRelative() on the parent with defaults', () => {
    //     const p1 = manager.addPanel();
    //     const spy = sinon.spy(p1, 'removeRelative');
    //     const i1 = p1.addItem({
    //       key: 'i1',
    //       kind: '',
    //       label: '',
    //     });
    //     manager.removeRelative(i1.key);
    //     assert.isTrue(spy.calledOnce);
    //     assert.equal(spy.args[0][0], i1.key, 'passes the key');
    //     assert.isUndefined(spy.args[0][1], 'has no direction specified');
    //   });

    //   it('calls removeRelative() on the parent with the direction', () => {
    //     const p1 = manager.addPanel();
    //     const spy = sinon.spy(p1, 'removeRelative');
    //     const i1 = p1.addItem({
    //       key: 'i1',
    //       kind: '',
    //       label: '',
    //     });
    //     manager.removeRelative(i1.key, SplitCloseDirection.left);
    //     assert.isTrue(spy.calledOnce);
    //     assert.equal(spy.args[0][0], i1.key, 'passes the key');
    //     assert.equal(spy.args[0][1], SplitCloseDirection.left, 'has the direction');
    //   });

    //   it('does nothing when item is not found', () => {
    //     const p1 = manager.addPanel();
    //     const spy = sinon.spy(p1, 'removeRelative');
    //     manager.removeRelative('unknown', SplitCloseDirection.left);
    //     assert.isFalse(spy.called);
    //   });
    // });

    describe('moveItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('moves items within the same panel', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const i3 = p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        manager.moveItem(p1.key, p1.key, i1.key, { index: 1 });
        assert.equal(i1.index, 1, 'the #1 has changed index');
        assert.equal(i2.index, 0, 'the #2 has changed index');
        assert.equal(i3.index, 2, 'the #3 has unchanged index');
      });

      it('moves items between layouts', () => {
        const p1 = manager.addPanel();
        const p2 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const i3 = p2.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        manager.moveItem(p1.key, p2.key, i1.key, { index: 0 });
        const readI1 = manager.findItem(i1.key)!;
        assert.ok(readI1, 'the manager has the moved item');
        assert.isFalse(p1.hasItem(i1.key), 'item was removed from the from parent');
        assert.isTrue(p2.hasItem(i1.key), 'target parent has the item');
        assert.equal(i1.index, 0, 'item 1 is placed at the index');
        assert.equal(i2.index, 0, 'item 2 has decreased index');
        assert.equal(i3.index, 1, 'item 3 has increased index');
      });

      it('throws when the from parent is not found', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        assert.throws(() => {
          manager.moveItem('unknown', p1.key, i1.key, { index: 0 });
        }, 'Source layout panel not found.');
      });

      it('throws when the target parent is not found', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        assert.throws(() => {
          manager.moveItem(p1.key, 'unknown', i1.key, { index: 0 });
        }, 'Target layout panel not found.');
      });

      it('throws when the item is not found', () => {
        const p1 = manager.addPanel();
        const p2 = manager.addPanel();
        assert.throws(() => {
          manager.moveItem(p1.key, p2.key, 'unknown');
        }, 'Item not found.');
      });
    });

    describe('panelIterator()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('iterates over panels in order', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const p3 = p1.addPanel();
        const p4 = p2.addPanel();
        const results: string[] = [];
        for (const panel of manager.panelIterator()) {
          results.push(panel.key);
        }
        assert.deepEqual(results, [p1.key, p2.key, p4.key, p3.key]);
      });

      it('ignores panels that are not defined', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        p2.items.push({
          type: LayoutType.panel,
          key: 'unknown',
        });
        const results: string[] = [];
        for (const panel of manager.panelIterator()) {
          results.push(panel.key);
        }
        assert.deepEqual(results, [p1.key, p2.key]);
      });
    });

    describe('parentItemsIterator()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('iterates over panels in order', () => {
        const parent = 'my-parent';
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const p3 = p1.addPanel();
        const p4 = p2.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
          parent,
        });
        p2.addItem({
          key: 'i2',
          kind: '',
          label: '',
          parent: 'other-parent',
        });
        p3.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        const i4 = p4.addItem({
          key: 'i4',
          kind: '',
          label: '',
          parent,
        });
        const results: string[] = [];
        for (const panel of manager.parentItemsIterator(parent)) {
          results.push(panel.key);
        }
        // i4 is first because it's panel is closer that the i1 item.
        assert.deepEqual(results, [i4.key, i1.key]);
      });
    });

    describe('requestNameUpdateByParent()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('updates name on items with set parent only', () => {
        const parent = 'my-parent';
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
          parent,
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
          parent: 'other-parent',
        });
        const i3 = p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        const p2 = manager.addPanel();
        const i4 = p2.addItem({
          key: 'i4',
          kind: '',
          label: '',
          parent,
        });

        let i = 0;
        manager.addEventListener('nameitem', (e: Event): void => {
          const event = e as CustomEvent<SplitItem>;
          event.detail.label = `changed ${i++}`;
        });
        manager.requestNameUpdateByParent(parent);
        assert.equal(i1.label, 'changed 0', 'item 1 label has changed');
        assert.equal(i2.label, '', 'item 2 label has not changed');
        assert.equal(i3.label, '', 'item 3 label has not changed');
        assert.equal(i4.label, 'changed 1', 'item 4 label has changed');
      });

      it('calls updateView() only once per panel', () => {
        const parent = 'my-parent';
        const p1 = manager.addPanel();
        p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
          parent,
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
          parent,
        });
        const p2 = manager.addPanel();
        p2.addItem({
          key: 'i3',
          kind: '',
          label: '',
          parent,
        });
        p2.addItem({
          key: 'i4',
          kind: '',
          label: '',
          parent,
        });

        let i = 0;
        manager.addEventListener('nameitem', (e: Event): void => {
          const event = e as CustomEvent<SplitItem>;
          event.detail.label = `changed ${i++}`;
        });
        const spy = sinon.spy(manager, 'updateView');
        manager.requestNameUpdateByParent(parent);
        assert.equal(spy.callCount, 2, 'update view called twice for each panel');
        assert.equal(spy.args[0][0], p1.key, 'called panel 1');
        assert.equal(spy.args[1][0], p2.key, 'called panel 2');
      });
    });

    describe('removeByParent()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('removes items that have a parent', () => {
        const parent = 'my-parent';
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
          parent,
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
          parent: 'other-parent',
        });
        const i3 = p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        const p2 = manager.addPanel();
        const i4 = p2.addItem({
          key: 'i4',
          kind: '',
          label: '',
          parent,
        });
        manager.removeByParent(parent);
        assert.isUndefined(manager.findItem(i1.key), 'item 1 is removed');
        assert.ok(manager.findItem(i2.key), 'item 2 is kept');
        assert.ok(manager.findItem(i3.key), 'item 3 is kept');
        assert.isUndefined(manager.findItem(i4.key), 'item 4 is removed');
      });
    });

    describe('hasItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns true when the layout has an item', () => {
        const i1 = manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        assert.isTrue(manager.hasItem(i1.key));
      });

      it('returns false when item is not defined', () => {
        assert.isFalse(manager.hasItem('other'));
      });
    });

    describe('selectItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('sets the item selected in a set panel', () => {
        const p1 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        p1.selected = i2.key;
        manager.selectItem(i1.key, p1.key);
        assert.equal(p1.selected, i1.key);
      });

      it('sets the item selected in an active panel', () => {
        const p1 = manager.addPanel();
        const p2 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        p2.addItem(i1);
        p2.addItem(i2);

        manager.setActive(p2.key);
        p2.selected = i2.key;
        manager.selectItem(i1.key);
        assert.equal(p2.selected, i1.key);
      });

      it('sets the item selected in an first panel with the item', () => {
        const p1 = manager.addPanel();
        const p2 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        p2.addItem(i1);
        p2.addItem(i2);

        p1.selected = i2.key;
        manager.selectItem(i1.key);
        assert.equal(p1.selected, i1.key);
      });

      it('does nothing when the item panel cannot be found', () => {
        const p1 = manager.addPanel();
        const p2 = manager.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        p2.addItem(i1);
        p2.addItem(i2);

        manager.selectItem('other');

        assert.equal(p1.selected, i2.key);
        assert.equal(p2.selected, i2.key);
      });

      it('requests a view update', () => {
        const i1 = manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        manager.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const spy = sinon.spy(manager, 'updateView');
        manager.selectItem(i1.key);
        assert.isTrue(spy.calledOnce);
      });

      it('notifies change', () => {
        const i1 = manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        manager.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const spy = sinon.spy(manager, 'notifyChange');
        manager.selectItem(i1.key);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('isEmpty()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns true for empty layout', () => {
        assert.isTrue(manager.isEmpty());
      });

      it('returns true for all panels are empty', () => {
        const p1 = manager.addPanel();
        manager.addPanel();
        const p3 = p1.addPanel();
        p3.addPanel();
        assert.isTrue(manager.isEmpty());
      });

      it('returns false when a layout has an item', () => {
        const p1 = manager.addPanel();
        manager.addPanel();
        const p3 = p1.addPanel();
        const p4 = p3.addPanel();
        p4.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        assert.isFalse(manager.isEmpty());
      });
    });

    describe('storeLayout()', () => {
      it('calls the callback', async () => {
        const spy = sinon.spy();
        const manager = new TabsLayout({
          stateCallback: spy,
        });
        manager.addPanel();
        const compare = manager.toJSON();
        await manager.storeLayout();
        assert.isTrue(spy.calledOnce);
        assert.deepEqual(spy.args[0][0], compare);
      });

      it('calls the callback again when an update happens while storing', async () => {
        let callCount = 0;
        const manager = new TabsLayout({
          stateCallback: async (): Promise<void> => {
            callCount++;
            await aTimeout(1);
          },
        });
        manager.addPanel();
        const promise = manager.storeLayout();
        manager.storeLayout();
        await promise;
        assert.equal(callCount, 2);
      });
    });

    describe('setting the active panel from a focus', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
        manager.initialize();
      });

      afterEach(() => {
        manager.dispose();
      });

      it('sets the active panel', async () => {
        const p1 = manager.addPanel();
        const view = await splitViewFixture(p1.key);
        const button = view.querySelector('#v1 button') as HTMLButtonElement;
        button.focus();
        assert.equal(manager.active, p1.key);
      });

      it('ignores when focus comes from the outside of the view', async () => {
        const p1 = manager.addPanel();
        await splitViewFixture(p1.key);
        document.body.focus();
        assert.isUndefined(manager.active);
      });

      it('ignores when focus comes from a not registered panel', async () => {
        const view = await splitViewFixture('something');
        const button = view.querySelector('#v1 button') as HTMLButtonElement;
        button.focus();
        assert.isUndefined(manager.active);
      });
    });

    describe('addItem()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      function renderer(item: SplitItem, visible: boolean): TemplateResult {
        const { key, kind } = item;
        return html`<p class="content" data-key="${key}" data-kind="${kind}" ?hidden="${!visible}">${key}</p>`;
      }

      it('renders single panel', async () => {
        manager.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        manager.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const content = manager.render(renderer);
        const markup = await fixture(html`<div>${content}</div>`);
        const views = markup.querySelectorAll('split-view');
        assert.lengthOf(views, 1, 'renders single view');
        const contents = views[0].querySelectorAll('p');
        assert.lengthOf(contents, 2, 'renders all items');
        const [c1, c2] = Array.from(contents);
        assert.equal(c1.dataset.key, 'i1', 'item 1 has the rendered values');
        assert.equal(c2.dataset.key, 'i2', 'item 2 has the rendered values');
      });

      it('renders another panel in the east region', async () => {
        const p1 = manager.addPanel();
        p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        // split view 
        p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        }, { region: SplitRegion.east });
        const content = manager.render(renderer);
        const markup = await fixture(html`<div>${content}</div>`);
        const views = markup.querySelectorAll('split-view');
        assert.lengthOf(views, 3, 'renders all views');
        const contents1 = views[1].querySelectorAll('p');
        assert.lengthOf(contents1, 2, 'renders all panel 1 items');
        const contents2 = views[2].querySelectorAll('p');
        assert.lengthOf(contents2, 1, 'renders all panel 2 items');
        const [c1, c2] = Array.from(contents1);
        assert.equal(c1.dataset.key, 'i1', 'item 1 has the rendered values');
        assert.equal(c2.dataset.key, 'i2', 'item 2 has the rendered values');
        const [c3] = Array.from(contents2);
        assert.equal(c3.dataset.key, 'i3', 'item 3 has the rendered values');
      });

      it('renders another panel in the west region', async () => {
        const p1 = manager.addPanel();
        p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        // split view 
        p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        }, { region: SplitRegion.west });
        const content = manager.render(renderer);
        const markup = await fixture(html`<div>${content}</div>`);
        const views = markup.querySelectorAll('split-view');
        assert.lengthOf(views, 3, 'renders all views');
        const contents1 = views[1].querySelectorAll('p');
        assert.lengthOf(contents1, 1, 'renders all panel 1 items');
        const contents2 = views[2].querySelectorAll('p');
        assert.lengthOf(contents2, 2, 'renders all panel 2 items');

        const [c1, c2] = Array.from(contents2);
        assert.equal(c1.dataset.key, 'i1', 'item 1 has the rendered values');
        assert.equal(c2.dataset.key, 'i2', 'item 2 has the rendered values');
        
        const [c3] = Array.from(contents1);
        assert.equal(c3.dataset.key, 'i3', 'item 3 has the rendered values');
      });

      it('renders another panel in the south region', async () => {
        const p1 = manager.addPanel();
        p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        // split view 
        p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        }, { region: SplitRegion.south });
        const content = manager.render(renderer);
        const markup = await fixture(html`<div>${content}</div>`);
        const views = markup.querySelectorAll('split-view');
        assert.lengthOf(views, 3, 'renders all views');
        const contents1 = views[1].querySelectorAll('p');
        assert.lengthOf(contents1, 2, 'renders all panel 1 items');
        const contents2 = views[2].querySelectorAll('p');
        assert.lengthOf(contents2, 1, 'renders all panel 2 items');
        const [c1, c2] = Array.from(contents1);
        assert.equal(c1.dataset.key, 'i1', 'item 1 has the rendered values');
        assert.equal(c2.dataset.key, 'i2', 'item 2 has the rendered values');
        const [c3] = Array.from(contents2);
        assert.equal(c3.dataset.key, 'i3', 'item 3 has the rendered values');
      });

      it('renders another panel in the north region', async () => {
        const p1 = manager.addPanel();
        p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        // split view 
        p1.addItem({
          key: 'i3',
          kind: '',
          label: '',
        }, { region: SplitRegion.north });
        const content = manager.render(renderer);
        const markup = await fixture(html`<div>${content}</div>`);
        const views = markup.querySelectorAll('split-view');
        assert.lengthOf(views, 3, 'renders all views');
        const contents1 = views[1].querySelectorAll('p');
        assert.lengthOf(contents1, 1, 'renders all panel 1 items');
        const contents2 = views[2].querySelectorAll('p');
        assert.lengthOf(contents2, 2, 'renders all panel 2 items');

        const [c1, c2] = Array.from(contents2);
        assert.equal(c1.dataset.key, 'i1', 'item 1 has the rendered values');
        assert.equal(c2.dataset.key, 'i2', 'item 2 has the rendered values');
        
        const [c3] = Array.from(contents1);
        assert.equal(c3.dataset.key, 'i3', 'item 3 has the rendered values');
      });
    });
  });
});

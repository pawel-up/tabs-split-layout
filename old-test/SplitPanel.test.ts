import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { SplitItem } from '../src/SplitItem';
import { ITabCloseDetail, TabsLayout } from "../src/TabsLayout.js";
import { SplitPanel } from '../src/SplitPanel.js';
import { IPanelObject, LayoutType, PanelState, SplitCloseDirection, SplitDirection, SplitRegion } from '../src/type.js';

describe('layout', () => {
  describe('SplitPanel', () => {
    describe('new()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('sets a random key', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.horizontal });
        assert.isNotEmpty(panel.key);
      });

      it('sets the passed key', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.horizontal, key: 'abc' });
        assert.equal(panel.key, 'abc');
      });

      it('sets the passed layout', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical });
        assert.equal(panel.layout, SplitDirection.vertical);
      });

      it('sets the default layout', () => {
        const panel = new SplitPanel(manager);
        assert.equal(panel.layout, SplitDirection.horizontal);
      });

      it('sets the passed selected', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, selected: 'a' });
        assert.equal(panel.selected, 'a');
      });

      it('sets the default selected', () => {
        const panel = new SplitPanel(manager);
        assert.isUndefined(panel.selected);
      });

      it('sets the default state', () => {
        const panel = new SplitPanel(manager);
        assert.equal(panel.state, PanelState.idle);
      });

      it('sets copy of the items', () => {
        const items: IPanelObject[] = [
          {
            key: 'i1',
            type: LayoutType.item,
          }
        ];
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, items });
        assert.deepEqual(panel.items, items, 'sets the value');
        items.splice(0, 1);
        assert.lengthOf(panel.items, 1, 'the array is a copy.');
      });

      it('sets default items', () => {
        const items: IPanelObject[] = [
          {
            key: 'i1',
            type: LayoutType.item,
          }
        ];
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, items });
        panel.new({ layout: SplitDirection.vertical });
        assert.lengthOf(panel.items, 0, 'the array is empty');
      });
    });

    describe('toJSON()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('serializes the layout', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical });
        const result = panel.toJSON();
        assert.equal(result.layout, SplitDirection.vertical);
      });

      it('serializes the key', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, key: 'abc' });
        const result = panel.toJSON();
        assert.equal(result.key, 'abc');
      });

      it('serializes the items', () => {
        const items: IPanelObject[] = [
          {
            key: 'i1',
            type: LayoutType.item,
          }
        ];
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, items });
        const result = panel.toJSON();
        assert.deepEqual(result.items, items);
      });

      it('serialized items are a copy', () => {
        const items: IPanelObject[] = [
          {
            key: 'i1',
            type: LayoutType.item,
          }
        ];
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, items });
        const result = panel.toJSON();
        items[0].key = 'i2';
        assert.equal(result.items![0].key, 'i1');
        items.splice(0, 1);
        assert.lengthOf(result.items!, 1);
      });

      it('ignores items when empty', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical });
        const result = panel.toJSON();
        assert.isUndefined(result.items);
      });

      it('serializes the selected', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical, selected: 'abc' });
        const result = panel.toJSON();
        assert.equal(result.selected, 'abc');
      });

      it('serializes selected when not set', () => {
        const panel = new SplitPanel(manager, { layout: SplitDirection.vertical });
        const result = panel.toJSON();
        assert.isUndefined(result.selected);
      });
    });

    describe('getParent()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns undefined when no parent', () => {
        const instance = new SplitPanel(manager);
        const result = instance.getParent();
        assert.isUndefined(result);
      });

      it('returns the parent panel', () => {
        const p1 = manager.addPanel();
        const p2 = p1.addPanel();
        const result = p2.getParent();
        assert.deepEqual(result, p1);
      });
    });

    describe('canDrop()', () => {
      let manager: TabsLayout;

      beforeEach(() => {
        manager = new TabsLayout();
      });

      it('returns false when has no items', () => {
        const instance = new SplitPanel(manager);
        assert.isFalse(instance.canDrop());
      });

      it('returns true what has a panel', () => {
        const p1 = manager.addPanel();
        p1.addPanel();
        assert.isTrue(p1.canDrop());
      });

      it('returns true what has an item', () => {
        const p1 = manager.addPanel();
        p1.addItem({
          key: 'test-key',
          kind: 'test-kind',
          label: 'test-label',
        });
        assert.isTrue(p1.canDrop());
      });
    });

    describe('sortedItems()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;
      let items: SplitItem[];

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const i2 = panel.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const i3 = panel.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        items = [i1, i2, i3];
      });

      it('returns items in order of adding', () => {
        const result = panel.sortedItems();
        assert.deepEqual(result, items);
      });

      it('sorts the items', () => {
        items[0].index = 1;
        items[1].index = 0;
        items[2].index = 2;
        const result = panel.sortedItems();
        assert.deepEqual(result, [items[1], items[0], items[2]]);
      });

      it('the returning array is a copy', () => {
        const result = panel.sortedItems();
        result.splice(0, 1);
        assert.lengthOf(panel.items, 3);
      });
    });

    describe('nextIndex()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
      });

      it('sets the index when no items', () => {
        const result = panel.nextIndex();
        assert.equal(result, 0);
      });

      it('sets the next available index', () => {
        panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const result = panel.nextIndex();
        assert.equal(result, 1);
      });

      it('sets the next available index with a gap', () => {
        const p1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.index = 4;
        const result = panel.nextIndex();
        assert.equal(result, 0);
      });

      it('returns the index after multiple items', () => {
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        i1.index = 0;
        const i2 = panel.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        i2.index = 1;
        const i3 = panel.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        i3.index = 2;
        const result = panel.nextIndex();
        assert.equal(result, 3);
      });

      it('returns the index with a gap', () => {
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        i1.index = 0;
        const i2 = panel.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        i2.index = 2;
        const i3 = panel.addItem({
          key: 'i3',
          kind: '',
          label: '',
        });
        i3.index = 3;
        const result = panel.nextIndex();
        assert.equal(result, 1);
      });
    });

    describe('hasItem()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
      });

      it('returns true when the panel has an item', () => {
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        assert.isTrue(panel.hasItem(i1.key));
      });

      it('returns false when the panel has no such item', () => {
        panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        assert.isFalse(panel.hasItem('other'));
      });
    });

    describe('addItem()', () => {
      describe('center region', () => {
        let manager: TabsLayout;
        let panel: SplitPanel;
  
        beforeEach(() => {
          manager = new TabsLayout();
          panel = manager.addPanel();
        });
  
        it('does nothing when adding an existing item', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          const spy = sinon.spy(manager, 'notifyChange');
          panel.addItem(i1);
          assert.isFalse(spy.called);
        });
  
        it('adds an item to to the items', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          assert.lengthOf(panel.items, 1, 'panel has a single item');
          assert.equal(panel.items[0].key, 'i1', 'the item has the key');
          assert.equal(panel.items[0].type, LayoutType.item, 'the item has the type');
        });
  
        it('adds an item to manager\'s definitions', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          const item = manager.definitions.get('i1')!;
          assert.equal(item.type, LayoutType.item, 'the definition has the type');
          const value = item.value as SplitItem;
          assert.equal(value.key, 'i1', 'the definition has the key');
        });
  
        it('notifies about the change.', () => {
          const spy = sinon.spy(manager, 'notifyChange');
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          assert.isTrue(spy.calledOnce);
        });

        it('calls the updateView()', () => {
          const spy = sinon.spy(panel, 'updateView');
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          assert.isTrue(spy.calledOnce);
        });

        it('sets a default next index', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          const i2 = panel.addItem({
            key: 'i2',
            kind: '',
            label: '',
          });
          assert.equal(i1.index, 0);
          assert.equal(i2.index, 1);
        });

        it('respects the item\'s index.', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
            index: 1,
          });
          assert.equal(i1.index, 1);
        });

        it('respects the option\'s index.', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { index: 1 });
          assert.equal(i1.index, 1);
        });

        it('respects the option\'s index has priority', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
            index: 1,
          }, { index: 2 });
          assert.equal(i1.index, 2);
        });

        it('sets the item selected', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          });
          assert.equal(panel.selected, i1.key);
        });
      });

      describe('east region', () => {
        let manager: TabsLayout;
        let panel: SplitPanel;

        beforeEach(() => {
          manager = new TabsLayout();
          panel = manager.addPanel({ layout: SplitDirection.vertical });

          panel.addItem({
            key: 'pre',
            kind: '',
            label: '',
          });
        });

        it('splits the layout horizontally', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.east });
          assert.equal(panel.layout, SplitDirection.horizontal);
        });

        it('adds 2 split panels as items', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.east });
          const [p1, p2] = panel.items;
          assert.ok(p1, 'has the first panel');
          assert.ok(p2, 'has the second panel');
          assert.equal(p1.type, LayoutType.panel, '#1 has the panel type')
          assert.equal(p2.type, LayoutType.panel, '#2 has the panel type')
        });

        it('moves the existing items to the first panel', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.east });
          const [p1] = panel.items;
          const def = manager.findPanel(p1.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
        });

        it('adds the new item to the other panel', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.east });
          const [, p2] = panel.items;
          const def = manager.findPanel(p2.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
        });

        it('notifies about the change', () => {
          const spy = sinon.spy(manager, 'notifyChange');
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.east });
          assert.isTrue(spy.calledOnce);
        });
      });

      describe('west region', () => {
        let manager: TabsLayout;
        let panel: SplitPanel;

        beforeEach(() => {
          manager = new TabsLayout();
          panel = manager.addPanel({ layout: SplitDirection.vertical });

          panel.addItem({
            key: 'pre',
            kind: '',
            label: '',
          });
        });

        it('splits the layout horizontally', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.west });
          assert.equal(panel.layout, SplitDirection.horizontal);
        });

        it('adds 2 split panels as items', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.west });
          const [p1, p2] = panel.items;
          assert.ok(p1, 'has the first panel');
          assert.ok(p2, 'has the second panel');
          assert.equal(p1.type, LayoutType.panel, '#1 has the panel type')
          assert.equal(p2.type, LayoutType.panel, '#2 has the panel type')
        });

        it('moves the existing items to the second panel', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.west });
          const [, p2] = panel.items;
          const def = manager.findPanel(p2.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
        });

        it('adds the new item to the other panel', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.west });
          const [p1] = panel.items;
          const def = manager.findPanel(p1.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
        });

        it('notifies about the change', () => {
          const spy = sinon.spy(manager, 'notifyChange');
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.west });
          assert.isTrue(spy.calledOnce);
        });
      });

      describe('south region', () => {
        let manager: TabsLayout;
        let panel: SplitPanel;

        beforeEach(() => {
          manager = new TabsLayout();
          panel = manager.addPanel({ layout: SplitDirection.horizontal });

          panel.addItem({
            key: 'pre',
            kind: '',
            label: '',
          });
        });

        it('splits the layout vertical', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.south });
          assert.equal(panel.layout, SplitDirection.vertical);
        });

        it('adds 2 split panels as items', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.south });
          const [p1, p2] = panel.items;
          assert.ok(p1, 'has the first panel');
          assert.ok(p2, 'has the second panel');
          assert.equal(p1.type, LayoutType.panel, '#1 has the panel type')
          assert.equal(p2.type, LayoutType.panel, '#2 has the panel type')
        });

        it('moves the existing items to the first panel', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.south });
          const [p1] = panel.items;
          const def = manager.findPanel(p1.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
        });

        it('adds the new item to the other panel', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.south });
          const [, p2] = panel.items;
          const def = manager.findPanel(p2.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
        });

        it('notifies about the change', () => {
          const spy = sinon.spy(manager, 'notifyChange');
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.south });
          assert.isTrue(spy.calledOnce);
        });
      });

      describe('north region', () => {
        let manager: TabsLayout;
        let panel: SplitPanel;

        beforeEach(() => {
          manager = new TabsLayout();
          panel = manager.addPanel({ layout: SplitDirection.horizontal });

          panel.addItem({
            key: 'pre',
            kind: '',
            label: '',
          });
        });

        it('splits the layout vertical', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.north });
          assert.equal(panel.layout, SplitDirection.vertical);
        });

        it('adds 2 split panels as items', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.north });
          const [p1, p2] = panel.items;
          assert.ok(p1, 'has the first panel');
          assert.ok(p2, 'has the second panel');
          assert.equal(p1.type, LayoutType.panel, '#1 has the panel type')
          assert.equal(p2.type, LayoutType.panel, '#2 has the panel type')
        });

        it('moves the existing items to the other panel', () => {
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.north });
          const [, p2] = panel.items;
          const def = manager.findPanel(p2.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
        });

        it('adds the new item to the first panel', () => {
          const i1 = panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.north });
          const [p1] = panel.items;
          const def = manager.findPanel(p1.key)!;
          assert.lengthOf(def.items, 1, 'the panel has an item');
          assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
        });

        it('notifies about the change', () => {
          const spy = sinon.spy(manager, 'notifyChange');
          panel.addItem({
            key: 'i1',
            kind: '',
            label: '',
          }, { region: SplitRegion.north });
          assert.isTrue(spy.calledOnce);
        });
      });
    });

    describe('removeItem()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
      });

      it('removes an item from the panel and keeps the panel as the first from root', () => {
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        panel.removeItem(i1.key);
        assert.isFalse(panel.hasItem(i1.key), 'the panel has no item');
        assert.ok(manager.definitions.get(panel.key), 'keeps the panel');
      });

      it('removes an item from the panel and keeps the panel with more items', () => {
        const p1 = panel.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        p1.removeItem(i1.key);
        assert.isFalse(p1.hasItem(i1.key), 'the panel has no item');
        assert.ok(manager.definitions.get(p1.key), 'keeps the panel');
      });

      it('removes an item and the panel when empty', () => {
        const p1 = panel.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.removeItem(i1.key);
        assert.isFalse(p1.hasItem(i1.key), 'the panel has no item');
        assert.isUndefined(manager.definitions.get(p1.key), 'removes the panel');
      });

      it('removes item definition', () => {
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        panel.removeItem(i1.key);
        assert.isUndefined(manager.definitions.get(i1.key), 'removes the item');
      });

      it('notifies tab removed when the panel has no more parents', () => {
        const i1 = panel.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const spy = sinon.spy();
        manager.addEventListener('closetab', spy);
        panel.removeItem(i1.key);
        assert.isTrue(spy.calledOnce, 'removes the item');
        const event = spy.args[0][0] as CustomEvent<ITabCloseDetail>;
        assert.equal(event.detail.tab, i1.key, 'has the tab key');
        assert.equal(event.detail.panel, panel.key, 'has the panel key');
      });

      it('notifies tab removed when the panel has more items', () => {
        const p1 = panel.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
        });
        const spy = sinon.spy();
        manager.addEventListener('closetab', spy);
        p1.removeItem(i1.key);
        assert.isTrue(spy.calledOnce, 'removes the item');
        const event = spy.args[0][0] as CustomEvent<ITabCloseDetail>;
        assert.equal(event.detail.tab, i1.key, 'has the tab key');
        assert.equal(event.detail.panel, p1.key, 'has the panel key');
      });

      it('notifies tab removed when removing the panel', () => {
        const p1 = panel.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        const spy = sinon.spy();
        manager.addEventListener('closetab', spy);
        p1.removeItem(i1.key);
        assert.isTrue(spy.calledOnce, 'removes the item');
        const event = spy.args[0][0] as CustomEvent<ITabCloseDetail>;
        assert.equal(event.detail.tab, i1.key, 'has the tab key');
        assert.equal(event.detail.panel, p1.key, 'has the panel key');
      });

      it('moves the selection to the next item', () => {
        const p1 = panel.addPanel();
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
        p1.selected = i1.key;
        p1.removeItem(i1.key);
        assert.equal(p1.selected, i2.key);
      });

      it('moves the selection to the previous item', () => {
        const p1 = panel.addPanel();
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
        p1.removeItem(i2.key);
        assert.equal(p1.selected, i1.key);
      });

      it('moves the selection to the first item', () => {
        const p1 = panel.addPanel();
        const i1 = p1.addItem({
          key: 'i1',
          kind: '',
          label: '',
          index: 2,
        });
        const i2 = p1.addItem({
          key: 'i2',
          kind: '',
          label: '',
          index: 4,
        });
        p1.selected = i2.key;
        p1.removeItem(i2.key);
        assert.equal(p1.selected, i1.key);
      });
    });

    describe('removeRelative()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;
      let items: SplitItem[];

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
        items = new Array(5).fill('').map((_, index) => {
          const item = panel.addItem({
            key: `i${index}`,
            kind: '',
            label: `i${index}`,
          });
          return item;
        });
      });

      it('removes items to the left', () => {
        panel.removeRelative(items[2].key, SplitCloseDirection.left);
        assert.lengthOf(panel.items, 3, 'has 3 remaining items');
        assert.equal(panel.items[0].key, items[2].key, 'leaves the item');
        assert.equal(panel.items[1].key, items[3].key, 'has the right item #1');
        assert.equal(panel.items[2].key, items[4].key, 'has the right item #2');
      });

      it('removes items to the right', () => {
        panel.removeRelative(items[2].key, SplitCloseDirection.right);
        assert.lengthOf(panel.items, 3, 'has 3 remaining items');
        assert.equal(panel.items[0].key, items[0].key, 'has the left item #1');
        assert.equal(panel.items[1].key, items[1].key, 'has the left item #2');
        assert.equal(panel.items[2].key, items[2].key, 'leaves the item');
      });

      it('removes items on the both sides', () => {
        panel.removeRelative(items[2].key, SplitCloseDirection.both);
        assert.lengthOf(panel.items, 1, 'has single item');
        assert.equal(panel.items[0].key, items[2].key, 'leaves the item');
      });

      it('does not remove items on the left when selecting first item', () => {
        panel.removeRelative(items[4].key, SplitCloseDirection.right);
        assert.lengthOf(panel.items, 5, 'has all items');
      });

      it('does not remove items on the right when selecting first item', () => {
        panel.removeRelative(items[0].key, SplitCloseDirection.left);
        assert.lengthOf(panel.items, 5, 'has all items');
      });

      it('removes definitions for removed items', () => {
        panel.removeRelative(items[1].key, SplitCloseDirection.both);
        assert.isUndefined(manager.definitions.get(items[0].key), 'has no item on the left');
        assert.isUndefined(manager.definitions.get(items[2].key), 'has no item on the right');
        assert.ok(manager.definitions.get(items[1].key), 'has the item');
      });

      it('notifies tab close', () => {
        const spy = sinon.spy();
        manager.addEventListener('closetab', spy);
        panel.removeRelative(items[1].key, SplitCloseDirection.both);
        assert.equal(spy.callCount, 4, 'dispatches for each removed tab');
      });

      it('notifies change once', () => {
        const spy = sinon.spy(manager, 'notifyChange');
        panel.removeRelative(items[1].key, SplitCloseDirection.both);
        assert.equal(spy.callCount, 1, 'calls the change only once');
      });

      it('updates the view once', () => {
        const spy = sinon.spy(manager, 'updateView');
        panel.removeRelative(items[1].key, SplitCloseDirection.both);
        assert.equal(spy.callCount, 1, 'calls the change only once');
      });
    });

    describe('removePanel()', () => {
      let manager: TabsLayout;
      let panel: SplitPanel;

      beforeEach(() => {
        manager = new TabsLayout();
        panel = manager.addPanel();
      });

      it('removes a panel from a parent', () => {
        const p1 = panel.addPanel();
        panel.removePanel(p1.key);

        assert.isFalse(panel.hasItem(p1.key));
      });

      it('removes panel\'s definition', () => {
        const p1 = panel.addPanel();
        panel.removePanel(p1.key);

        assert.isUndefined(manager.definitions.get(p1.key));
      });

      it('removes items from the panel', () => {
        const p1 = panel.addPanel();
        const p2 = p1.addPanel();
        const i1 = p2.addItem({
          key: 'i1',
          kind: '',
          label: '',
        });
        panel.removePanel(p1.key);

        assert.isUndefined(manager.definitions.get(p2.key), 'child panel definition is removed');
        assert.isUndefined(manager.definitions.get(i1.key), 'child item definition is removed');
      });
    });
  });
});

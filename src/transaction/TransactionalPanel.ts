/* eslint-disable no-param-reassign */
import { Panel, SerializedPanel } from "../Panel.js";
import { StateObject, TabsLayoutAddOptions, PanelSplitOptions, } from "../type.js";
import { LayoutObjectType, LayoutDirection, SplitPanelTarget, SplitRegion, TabCloseDirection, } from "../Enum.js";
import type { State } from "../State.js";
import type { Transaction } from "./Transaction.js";
import type { Item, SerializedItem } from "../Item.js";
import type { PanelObject } from "../PanelObject.js";
import { TransactionalItem } from "./TransactionalItem.js";
import { TransactionError } from "./TransactionError.js";
import { Rand } from "../lib/Rand.js";
import missingIndexes from "../lib/math/MissingIndexes.js";

export const removeDefinition = Symbol('removeDefinition');
export const decreaseItemIndex = Symbol('decreaseItemIndex');
export const increaseItemIndex = Symbol('increaseItemIndex');
export const moveToRegion = Symbol('moveToRegion');
export const moveToIndex = Symbol('moveToIndex');
export const moveToEnd = Symbol('moveToEnd');
export const nextIndex = Symbol('nextIndex');

/**
 * An instance of this object has methods that can be used in a transaction.
 */
export class TransactionalPanel extends Panel {
  constructor(public readonly transaction: Transaction, state: State, schema?: SerializedPanel) {
    super(state, schema);
  }

  override getParent(): TransactionalPanel | null {
    return super.getParent() as TransactionalPanel | null;
  }

  /**
   * Removes this panel and its children from the layout.
   */
  remove(): void {
    const parent = this.getParent();
    const items: string[] = [];
    const panels: string[] = [];
    for (const item of this.items) {
      if (item.type === LayoutObjectType.item) {
        items.push(item.key);
      } else if (item.type === LayoutObjectType.panel) {
        panels.push(item.key);
      }
    }
    items.forEach((item) => {
      // remove manually as the `removeItem()` has a lot of computations related to indexes.
      const index = this.items.findIndex(i => i.key === item);
      this.items.splice(index, 1);
      this.layoutState.definitions.delete(item);
    });
    panels.forEach((key) => {
      const panel = this.layoutState.panel(key) as TransactionalPanel;
      panel?.remove();
    });
    this[removeDefinition](this);
    if (parent) {
      const index = parent.items.findIndex(i => i.key === this.key);
      if (index >= 0) {
        parent.items.splice(index, 1);
      }
    } else {
      const index = this.layoutState.items.findIndex(i => i.key === this.key);
      if (index >= 0) {
        // this is a root panel.
        this.layoutState.items.splice(index, 1);
      }
    }
  }

  /**
   * Removes a single item from the panel.
   * 
   * It takes care about the item indexes (decreases higher indexes) and the `selected` state.
   * 
   * Note, it is possible to leave a panel without any item added. This means that such a
   * panel can accept items or a new panel (and becoming a split panel). 
   * You should handle this situation if you'd like to remove the panel
   * if it has no more children.
   * 
   * Note, you may want to use the `StateHelper.removeItem()` as it has additional logic
   * that takes care of empty panels.
   * 
   * @param key The key of the item to remove.
   * @returns The deleted item or null if not found or not a parent of the item.
   */
  removeItem(key: string): TransactionalItem | null {
    const { layoutState } = this;
    const index = this.items.findIndex(i => i.key === key);
    if (index < 0) {
      return null;
    }
    const itemInfo = this.items[index];
    if (itemInfo.type !== LayoutObjectType.item) {
      return null;
    }
    this.items.splice(index, 1);
    const item = layoutState.item(key) as TransactionalItem | null;
    if (!item) {
      // While we just removed an item from this panel, it's OK
      // as this is a self-cleaning, which should never happen.
      return null;
    }
    this[decreaseItemIndex](itemInfo.index || 0);
    if (!item.getParents().length) {
      this[removeDefinition](item);
    }
    if (this.selected === item.key) {
      let nextKey: string | undefined;
      if (this.items[index]) {
        nextKey = this.items[index].key;
      } else if (this.items[index - 1]) {
        nextKey = this.items[index - 1].key;
      }
      /* else if (this.items.length) {
        const [other] = this.items;
        nextKey = other.key;
      } */
      this.update({
        selected: nextKey,
      });
    }
    return item;
  }

  /**
   * Removes an item from the state definitions and adds the transaction record.
   * @param item The item definition to remove.
   */
  [removeDefinition](item: Item | Panel): void {
    const { layoutState } = this;
    layoutState.definitions.delete(item.key);
  }

  /**
   * Decreases items index by 1 to all items with the index at least equal to `fromIndex`.
   * @param fromIndex The minimal index to affect.
   */
  [decreaseItemIndex](fromIndex: number): void {
    for (const item of this.items) {
      if (item.type !== LayoutObjectType.item) {
        continue;
      }
      const { index = 0 } = item;
      if (index >= fromIndex && index > 0) {
        item.index = index - 1;
      }
    }
  }

  /**
   * Increases items index by 1 to all items with index at least equal to `fromIndex`.
   * @param fromIndex The minimal index to affect.
   */
  [increaseItemIndex](fromIndex: number): void {
    for (const item of this.items) {
      if (item.type !== LayoutObjectType.item) {
        continue;
      }
      const { index = 0 } = item;
      if (index >= fromIndex) {
        item.index = index + 1;
      }
    }
  }

  /**
   * Moves an item within a panel.
   * 
   * It can move an item:
   * - at the specific index of a panel - when an index is specified.
   * - move an item to a region (split the panel) - when a region is specified.
   * - move at the end of the panel - default behavior.
   * 
   * @param key The key of the panel object to move.
   * @param opts Moving options.
   */
  move(key: string, opts: TabsLayoutAddOptions = {}): void {
    const info = this.items.find(i => i.key === key);
    if (!info) {
      throw new TransactionError(`Item ${key} does not exist on the panel.`);
    }
    const { index, region } = opts;
    if (region) {
      this[moveToRegion](info, region);
    } else if (typeof index === 'number') {
      this[moveToIndex](info, index);
    } else {
      this[moveToEnd](info);
    }
  }

  /**
   * Moves an item from this panel to the panel's region, splitting the panel.
   * 
   * @param item The item to move
   * @param region The panel's region to move the item to.
   */
  [moveToRegion](info: PanelObject, region: SplitRegion): void {
    const item = this.layoutState.item(info.key) as TransactionalItem;
    if (!item) {
      throw new TransactionError(`Item ${info.key} definition does not exist.`);
    }
    if (this.items.length < 2) {
      // nothing to split.
      return;
    }
    if (region === SplitRegion.center) {
      // the item is already there.
      return;
    }
    const isItemSelected = this.selected === item.key;
    // The ordered items are needed to select next/previous item if needed.
    const orderedItems = isItemSelected && this.sortedItems() || [];
    const itemsIndex = this.items.findIndex(i => i.key === item.key);
    if (itemsIndex < 0) {
      return;
    }
    this.items.splice(itemsIndex, 1);
    this[decreaseItemIndex](info.index || 0);
    const panel = this.splitByRegion(region);
    panel.items = [{ key: item.key, type: LayoutObjectType.item, index: 0, pinned: info.pinned }];
    panel.update({
      selected: item.key,
    });
    const other = this.items.find(i => i.key !== panel.key);
    const otherPanel = other && this.transaction.state.panel(other.key);
    if (otherPanel && isItemSelected) {
      const itemOldIndex = orderedItems.findIndex(i => i.key === item.key);
      let selected = orderedItems[itemOldIndex + 1]?.key;
      if (!selected) {
        selected = orderedItems[itemOldIndex - 1]?.key;
      }
      otherPanel.update({
        selected,
      });
    }
  }

  [moveToIndex](info: PanelObject, index: number): void {
    if (info.index === index) {
      return;
    }
    const hasTargetAtTarget = !!this.items[index as number];
    this[decreaseItemIndex](info.index || 0);
    if (hasTargetAtTarget) {
      this[increaseItemIndex](index);
    }
    info.index = index;
  }

  [moveToEnd](info: PanelObject): void {
    if (!info) {
      return;
    }
    if (info.index !== undefined) {
      this[decreaseItemIndex](info.index);
    }
    info.index = this[nextIndex]();
  }

  /**
   * Performs a registered update on the object.
   * 
   * Do not directly manipulate the properties of the object. Instead use 
   * the `update()` method to register a change within the transaction.
   * 
   * This way you can update most properties of the panel, expect for the `key`, `type` and `items`.
   * 
   * To remove property, set the value to `undefined`. The `toJSON()` function filters those.
   * 
   * @param info The properties of the panel to update.
   */
  update(info: Partial<SerializedPanel>): void {
    const cp = { ...info } as Partial<SerializedPanel>;
    if (cp.key) {
      delete cp.key;
    }
    if (cp.items) {
      delete cp.items;
    }
    if (cp.type) {
      delete cp.type;
    }
    const keys = Object.keys(cp) as (keyof SerializedPanel)[];
    if (!keys.length) {
      return;
    }
    const old: Partial<SerializedPanel> = {};
    for (const key of keys) {
      const current = this[key];
      const next = cp[key];
      if (current !== next) {
        // Any idea how to do this correctly in typescript??
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        old[key] = current;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this[key] = next;
      }
    }
  }

  /**
   * Adds a new panel to this panel.
   * Note, this is only possible if the panel does not contain items already.
   * In such case the transaction will fail.
   * 
   * @param init The properties to set on the new panel.
   */
  addPanel(init: Partial<SerializedPanel> = {}): TransactionalPanel {
    if (this.hasItems) {
      throw new TransactionError(`Unable to create a panel in a parent that already has items.`);
    }
    const cp = { ...init } as Partial<SerializedPanel>;
    if (cp.items) {
      delete cp.items;
    }
    if (cp.type) {
      delete cp.type;
    }
    const panel = new TransactionalPanel(this.transaction, this.layoutState);
    for (const key of Object.keys(cp)) {
      // Anyone have an idea how to deal with it?
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      panel[key] = cp[key];
    }
    const definition: StateObject = {
      type: LayoutObjectType.panel,
      value: panel,
    }
    this.layoutState.definitions.set(panel.key, definition);
    const obj: PanelObject = {
      key: panel.key,
      type: LayoutObjectType.panel,
    };
    this.items.push(obj);
    return panel;
  }

  /**
   * Adds a new item to the layout.
   * 
   * Note, if the item already exists, a new item with a new, random key will be inserted.
   * 
   * @param init The item definition.
   * @param options THe add options, if any. By default it adds the item at the end of the current panel.
   * @returns The created Item or an existing item if the panel already hosts the item.
   */
  addItem(init: Partial<SerializedItem> = {}, options: TabsLayoutAddOptions = {}): TransactionalItem {
    if (this.hasPanels) {
      throw new TransactionError(`Unable to create an item in a parent that already has other panels.`);
    }
    const cp = { ...init } as Partial<SerializedItem>;
    if (cp.type) {
      delete cp.type;
    }
    const { region = SplitRegion.center, pinned } = options;
    const alreadyInPanel = !!init.key && region === SplitRegion.center && this.hasItem(init.key);
    if (alreadyInPanel) {
      if (init.key !== this.selected) {
        this.update({
          selected: init.key,
        });
      }
      const item = this.layoutState.item(init.key as string) as TransactionalItem;
      if (!item) {
        throw new TransactionError(`The item ${init.key} is defined on a panel but not defined in definitions.`);
      }
      return item;
    }
    const isCenter = region === SplitRegion.center || (!this.hasItems && !this.hasPanels);
    if (!isCenter) {
      const panel = this.splitByRegion(region);
      return panel.addItem(cp, { index: 0 });
    }
    let existingItem: TransactionalItem | null = null;
    if (cp.key) {
      existingItem = this.layoutState.item(cp.key) as TransactionalItem | null;
    }

    const { key = Rand.id() } = cp;
    const hasIndex = typeof options.index === 'number';
    let index: number;
    if (hasIndex) {
      index = options.index as number;
    } else {
      index = this[nextIndex]();
    }
    // add to the current items, no splitting.
    if (hasIndex) {
      this[increaseItemIndex](index);
    }

    let result: TransactionalItem;
    if (existingItem) {
      result = existingItem;
    } else {
      const item = new TransactionalItem(this.transaction, this.layoutState);
      for (const _key of Object.keys(cp)) {
        // Anyone have an idea how to deal with it?
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        item[_key] = cp[_key];
      }
      item.key = key;
      // The item may change here by the hosting application.
      this.transaction.currentState.notifyItemCreated(item);
      const definition: StateObject = {
        type: LayoutObjectType.item,
        value: item,
      }
      this.layoutState.definitions.set(key, definition);
      result = item;
    }
    const obj: PanelObject = {
      key: result.key,
      type: LayoutObjectType.item,
      index,
      pinned,
    };
    this.items.push(obj);
    this.selected = result.key;
    return result;
  }

  /**
   * Finds an index where to put an item.
   * This finds "holes" in items where an index is not set for a given position.
   * In this case the resulting index is the missing index.
   * Otherwise it returns next after the highest index.
   * 
   * @returns The index of the next item
   */
  [nextIndex](): number {
    const { items } = this;
    if (!items.length) {
      return 0;
    }
    const set = new Set<number>();
    for (const item of items) {
      const { index = 0 } = item;
      set.add(index);
    }
    const sorted = [...set].sort();
    const missing = missingIndexes(sorted);
    if (missing.length) {
      return missing[0];
    }
    const max = sorted.pop() as number;
    return max + 1;
  }

  splitByRegion(region: SplitRegion): TransactionalPanel {
    let panel: TransactionalPanel;
    if (region === 'east') {
      [, panel] = this.split({
        direction: LayoutDirection.horizontal,
        itemsTarget: SplitPanelTarget.first,
      });
    } else if (region === 'west') {
      [panel] = this.split({
        direction: LayoutDirection.horizontal,
        itemsTarget: SplitPanelTarget.other,
      });
    } else if (region === 'south') {
      [, panel] = this.split({
        direction: LayoutDirection.vertical,
        itemsTarget: SplitPanelTarget.first,
      });
    } else {
      [panel] = this.split({
        direction: LayoutDirection.vertical,
        itemsTarget: SplitPanelTarget.other,
      });
    }
    return panel;
  }

  /**
   * Splits this panel into 2 panels.
   * 
   * This to be used when the panel has no other panels. Only items are allowed.
   * It produces 2 new panels and moves the items to the first one leaving the other one available.
   */
  split(opts: PanelSplitOptions = {}): TransactionalPanel[] {
    if (this.hasPanels) {
      throw new TransactionError(`Invalid state. Panels can be split only when containing items only.`);
    }
    const { direction = LayoutDirection.horizontal, itemsTarget = SplitPanelTarget.first } = opts;
    this.update({
      direction,
    });
    const { items, selected } = this;

    this.items = [];
    this.selected = undefined;

    const p1 = this.addPanel();
    const p2 = this.addPanel();

    const panel = itemsTarget === SplitPanelTarget.first ? p1 : p2;
    panel.update({
      selected,
    });
    panel.items = items;
    return [p1, p2];
  }

  /**
   * Moves all items from panels below to this panel and removes the other panels.
   */
  unSplit(): void {
    const oldItems = this.items;
    const items: PanelObject[] = [];
    for (const item of this.transaction.state.itemsIterator(this)) {
      items.push(item);
    }
    this.items = items;
    this.selected = items[items.length - 1]?.key;
    oldItems.forEach((item) => {
      if (item.type === LayoutObjectType.panel) {
        this.layoutState.definitions.delete(item.key);
      }
    });
  }

  /**
   * @param key The key of the item to perform a relative operation from.
   * @param dir The direction to which close other items. Default to both directions leaving only the `key` item
   */
  closeRelative(key: string, dir: TabCloseDirection = TabCloseDirection.left): void {
    const items = this.sortedItems();
    const index = items.findIndex(i => i.key === key);
    if (index < 0) {
      return;
    }
    const item = items[index];
    let removed: string[] = [];

    if (dir === TabCloseDirection.both) {
      removed = items.filter(i => i !== item).map(i => i.key);
    } else if (dir === TabCloseDirection.left) {
      removed = items.slice(0, index).map(i => i.key);
    } else {
      removed = this.items.slice(index + 1).map(i => i.key);
    }

    for (const itemKey of removed) {
      this.removeItem(itemKey);
    }
  }
}

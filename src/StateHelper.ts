import { TransactionError } from "./transaction/TransactionError.js";
import type { Item, SerializedItem } from "./Item.js";
import type { TabsLayoutAddOptions } from "./type.js";
import type { Manager } from "./Manager.js";
import type { TransactionalPanel } from "./transaction/TransactionalPanel.js";

/**
 * A class that contains a common interactions 
 * with the state through the transactions.
 */
export class StateHelper {
  /**
   * Creates a transaction and removes an item from the state and all parents.
   * 
   * @param state The state object to remove the item from.
   * @param itemKey The key of the item to remove.
   * @throws When the item was not found.
   */
  static removeItem(manager: Manager, itemKey: string): void;

  /**
   * Creates a transaction and removes an item from a specific parent.
   * When the item has only single parent, it is removed from the state.
   * 
   * @param state The state object to remove the item from.
   * @param itemKey The key of the item to remove.
   * @param parentKey When set it removes the item from the specific panel only.
   * @throws When the item was not found.
   * @throws When the parent was not found.
   * @throws When the parent has no item on it.
   */
  static removeItem(manager: Manager, itemKey: string, parentKey: string): void;

  /**
   * Creates a transaction and removes an item from the state.
   * It also removes the item from all parents it was added to, if 
   * the parent is not specified.
   * 
   * This function takes care of removing panels that do not have 
   * children after removing the item. If the parent panel to the panel is 
   * left with only one panel as a child, then it is removed.
   * 
   * @param state The state object to remove the item from.
   * @param itemKey The key of the item to remove.
   * @throws When the item was not found.
   * @throws When the parent was not found.
   * @throws When the parent has no item on it.
   */
  static removeItem(manager: Manager, itemKey: string, parentKey?: string): void {
    const tx = manager.transaction();
    const item = tx.state.item(itemKey);
    if (!item) {
      throw new TransactionError(`The item to remove is not in the state.`);
    }
    const parents = item.getParents();
    if (parentKey) {
      const panel = parents.find(i => i.key === parentKey);
      if (!panel) {
        throw new TransactionError(`The parent panel does not exist on the state.`);
      }
      const parent = panel.getParent();
      panel.removeItem(itemKey);
      if (!panel.hasItems) {
        panel.remove();
      }
      // if the parent panel of the item's parent has only one panel left,
      // then we "un-split" them.
      if (parent && parent.items.length === 1) {
        parent.unSplit();
      }
    } else {
      for (const panel of parents) {
        const parent = panel.getParent();
        const removed = panel.removeItem(itemKey);
        if (!removed) {
          // it is possible this will happen because of the condition below.
          continue;
        }
        if (!panel.hasItems) {
          panel.remove();
        }
        // if the parent panel of the item's parent has only one panel left,
        // then we "un-split" them.
        if (parent && parent.items.length === 1) {
          parent.unSplit();
          // it may happen that an item that is being removed
          // was just moved to the parent. We need to check that again.
          parents.push(parent);
        }
      }
    }
    tx.commit();
  }

  /**
   * Crates a transaction and marks an item as selected on a given panel.
   * 
   * @param state The state object to use to change the selected state.
   * @param itemKey The key of the item to select on the panel.
   * @param parentKey The key of the parent panel of the item.
   * @throws When the state has no parent panel.
   * @throws When the parent panel already has the item selected.
   * 
   */
  static selectItem(manager: Manager, itemKey: string, parentKey: string): void {
    const tx = manager.transaction();
    const item = tx.state.item(itemKey);
    if (!item) {
      throw new TransactionError(`The item does not exist on the state.`);
    }
    const panel = item.getParents().find(i => i.key === parentKey);
    if (!panel) {
      throw new TransactionError(`The parent panel does not exist on the state.`);
    }
    if (panel.selected === itemKey) {
      throw new TransactionError(`The item is already selected on the panel.`);
    }
    panel.update({
      selected: itemKey,
    });
    tx.commit();
  }

  /**
   * A method to move an item within a panel of between panels.
   * 
   * @param state The current state object to manipulate.
   * @param fromParent The panel key to move the item from.
   * @param toParent The parent to move the item to. May be the same as `fromParent`.
   * @param itemKey The key of the item to move.
   * @param opts Move options.
   * @throws When an error occurs, e.i., when panels do not exists, or the item does not exist.
   */
  static moveItem(manager: Manager, fromParent: string, toParent: string, itemKey: string, opts?: TabsLayoutAddOptions): void {
    if (fromParent === toParent) {
      this.moveItemWithinPanel(manager, itemKey, fromParent, opts);
    } else {
      this.moveItemBetweenPanels(manager, fromParent, toParent, itemKey, opts);
    }
  }

  /**
   * Moves an item within the same panel.
   * 
   * @param state The current state object to manipulate.
   * @param itemKey The key of the item to move.
   * @param parentKey The key of the parent panel.
   * @param opts Item manipulation options.
   */
  static moveItemWithinPanel(manager: Manager, itemKey: string, parentKey: string, opts?: TabsLayoutAddOptions): void {
    const tx = manager.transaction();
    const item = tx.state.item(itemKey);
    if (!item) {
      throw new TransactionError(`The target item of the move operation does not exist.`);
    }
    item.move(parentKey, opts);
    tx.commit();
  }

  /**
   * Moves an item between two panels.
   * 
   * @param state The current state object to manipulate.
   * @param fromParent The panel key to move the item from.
   * @param toParent The parent to move the item to. May be the same as `fromParent`.
   * @param itemKey The key of the item to move.
   * @param toIndex The position on which to insert the item at. When not set, adds it to the end of items.
   * @throws When an error occurs, e.i., when panels do not exists, or the item does not exist.
   */
  static moveItemBetweenPanels(manager: Manager, fromParent: string, toParent: string, itemKey: string, opts?: TabsLayoutAddOptions): void {
    const tx = manager.transaction();
    const item = tx.state.item(itemKey);
    if (!item) {
      throw new TransactionError(`The target item of the move operation does not exist.`);
    }
    item.moveTo(fromParent, toParent, opts);
    // it is safe to do so or otherwise the previous function would throw.
    const from = tx.state.panel(fromParent) as TransactionalPanel;
    const parent = from.getParent();
    if (!from.hasItems) {
      from.remove();
    }
    if (parent && parent.items.length === 1) {
      parent.unSplit();
    }
    tx.commit();
  }

  /**
   * A shortcut to create an item inside a panel.
   * @param state The current state object to manipulate.
   * @param parentKey The parent panel to add the item to.
   * @param item 
   * @param opts 
   */
  static createItem(manager: Manager, parentKey: string, item: Partial<SerializedItem>, opts?: TabsLayoutAddOptions): Item {
    const tx = manager.transaction();
    const panel = tx.state.panel(parentKey);
    if (!panel) {
      throw new TransactionError(`The parent panel of the add operation does not exist.`);
    }
    const created = panel.addItem(item, opts);
    tx.commit();
    return manager.state.item(created.key) as Item;
  }
}

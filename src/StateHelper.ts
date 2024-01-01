import { TransactionError } from "./transaction/TransactionError.js";
import type { Item, SerializedItem } from "./Item.js";
import type { TabsLayoutAddOptions } from "./type.js";
import type { Manager } from "./Manager.js";

/**
 * A class that contains a common interactions 
 * with the state through the transactions.
 */
export class StateHelper {
  /**
   * Creates a transaction and removes an item from the state and all parents.
   * 
   * @param state The state object to remove the item from.
   * @param key The key of the item to remove.
   * @throws When the item was not found.
   */
  static removeItem(manager: Manager, key: string): void;

  /**
   * Creates a transaction and removes an item from a specific parent.
   * When the item has only single parent, it is removed from the state.
   * 
   * @param state The state object to remove the item from.
   * @param key The key of the item to remove.
   * @param parent When set it removes the item from the specific panel only.
   * @throws When the item was not found.
   * @throws When the parent was not found.
   * @throws When the parent has no item on it.
   */
  static removeItem(manager: Manager, key: string, parent: string): void;

  /**
   * Creates a transaction and removes an item from the state.
   * It also removes the item from all parents it was added to, if 
   * the parent is not specified.
   * 
   * @param state The state object to remove the item from.
   * @param key The key of the item to remove.
   * @param parent When set it removes the item from the specific panel only.
   * @throws When the item was not found.
   * @throws When the parent was not found.
   * @throws When the parent has no item on it.
   */
  static removeItem(manager: Manager, key: string, parent?: string): void {
    const tx = manager.transaction();
    const item = tx.state.item(key);
    if (!item) {
      throw new TransactionError(`The item to remove is not in the state.`);
    }
    if (parent) {
      const panel = tx.state.panel(parent);
      if (!panel) {
        throw new TransactionError(`The parent is not in the state.`);
      }
      if (!panel.hasItem(key)) {
        throw new TransactionError(`The parent has no item on it.`);
      }
      panel.removeItem(key);
      if (!panel.hasItems) {
        panel.remove();
      }
    } else {
      const parents = item.getParents();
      item.remove();
      for (const panel of parents) {
        if (!panel.hasItems) {
          panel.remove();
        }
      }
    }
    tx.commit();
  }

  /**
   * Crates a transaction and marks an item as selected on a given panel.
   * An item can be added to multiple panels so the parent panel must be specified.
   * 
   * @param state The state object to use to change the selected state.
   * @param key The key of the item to select on the panel.
   * @param parent The parent panel of the item to select the item on.
   * @throws When the state has no parent panel.
   * @throws When the parent panel already has the item selected.
   * 
   */
  static selectItem(manager: Manager, key: string, parent: string): void {
    const tx = manager.transaction();
    const panel = tx.state.panel(parent);
    if (!panel) {
      throw new TransactionError(`The parent panel does not exist on the state.`);
    }
    if (panel.selected === key) {
      throw new TransactionError(`The item is already selected on the panel.`);
    }
    panel.update({
      selected: key,
    });
    tx.commit();
  }

  /**
   * A method to move an item within a panel of between panels.
   * 
   * @param state The current state object to manipulate.
   * @param fromParent The panel key to move the item from.
   * @param toParent The parent to move the item to. May be the same as `fromParent`.
   * @param key The key of the item to move.
   * @param opts Move options.
   * @throws When an error occurs, e.i., when panels do not exists, or the item does not exist.
   */
  static moveItem(manager: Manager, fromParent: string, toParent: string, key: string, opts?: TabsLayoutAddOptions): void {
    if (fromParent === toParent) {
      this.moveItemWithinPanel(manager, fromParent, key, opts);
    } else {
      this.moveItemBetweenPanels(manager, fromParent, toParent, key, opts);
    }
  }

  /**
   * Moves an item within the same panel.
   * 
   * @param state The current state object to manipulate.
   * @param parent The parent panel of the item. Note, an item may be opened in multiple panels.
   * @param key The key of the item to move.
   * @param opts Item manipulation options.
   */
  static moveItemWithinPanel(manager: Manager, parent: string, key: string, opts?: TabsLayoutAddOptions): void {
    const tx = manager.transaction();
    const panel = tx.state.panel(parent);
    if (!panel) {
      throw new TransactionError(`The source panel of the move operation does not exist.`);
    }
    panel.move(key, opts);
    tx.commit();
  }

  /**
   * Moves an item between two panels.
   * 
   * @param state The current state object to manipulate.
   * @param fromParent The panel key to move the item from.
   * @param toParent The parent to move the item to. May be the same as `fromParent`.
   * @param key The key of the item to move.
   * @param toIndex The position on which to insert the item at. When not set, adds it to the end of items.
   * @throws When an error occurs, e.i., when panels do not exists, or the item does not exist.
   */
  static moveItemBetweenPanels(manager: Manager, fromParent: string, toParent: string, key: string, opts?: TabsLayoutAddOptions): void {
    const tx = manager.transaction();
    const from = tx.state.panel(fromParent);
    const to = fromParent === toParent ? from : tx.state.panel(toParent);
    if (!from) {
      throw new TransactionError(`The source panel of the move operation does not exist.`);
    }
    if (!to) {
      throw new TransactionError(`The destination panel of the move operation does not exist.`);
    }
    const orderedItems = from.sortedItems();
    const item = from.removeItem(key);
    if (!item) {
      throw new TransactionError(`The target item of the move operation does not exist.`);
    }
    if (!from.hasItems) {
      from.remove();
    } else if (from.selected === key) {
      const index = orderedItems.findIndex(i => i.key === key);
      let selected = orderedItems[index + 1]?.key;
      if (!selected) {
        selected = orderedItems[index - 1]?.key;
      }
      from.update({
        selected,
      });
    }
    to.addItem(item.toJSON(), opts);
    to.update({
      selected: item.key,
    });
    tx.commit();
  }

  /**
   * 
   * @param state The current state object to manipulate.
   * @param parent The parent panel to add the item to.
   * @param item 
   * @param opts 
   */
  static createItem(manager: Manager, parent: string, item: Partial<SerializedItem>, opts?: TabsLayoutAddOptions): Item {
    const tx = manager.transaction();
    const panel = tx.state.panel(parent);
    if (!panel) {
      throw new TransactionError(`The parent panel of the add operation does not exist.`);
    }
    const created = panel.addItem(item, opts);
    tx.commit();
    return tx.currentState.item(created.key) as Item;
  }
}

import { Item, SerializedItem } from "../Item.js";
import type { State } from "../State.js";
import { TabsLayoutAddOptions } from "../type.js";
import type { Transaction } from "./Transaction.js";
import { TransactionError } from "./TransactionError.js";
import type { TransactionalPanel } from "./TransactionalPanel.js";

/**
 * An instance of this object has methods that can be used in a transaction.
 */
export class TransactionalItem extends Item {
  constructor(public readonly transaction: Transaction, state: State, schema?: SerializedItem) {
    super(state, schema);
  }

  /**
   * Removes this item from the parent.
   * It is the same as finding the parent and calling the `removeItem()` on it.
   * 
   * Note, you may want to use the `StateHelper.removeItem()` as it has additional logic
   * that takes care of empty panels.
   */
  remove(): void {
    const parent = this.getParent();
    if (parent) {
      parent.removeItem(this.key);
    }
  }

  override getParent(): TransactionalPanel {
    return super.getParent() as TransactionalPanel;
  }

  /**
   * Performs a registered update on the object.
   * 
   * Do not directly manipulate the properties of the object. Instead use 
   * the `update()` method to register a change within the transaction.
   * 
   * This way you can update most properties of the panel, expect for the `key` and `type`.
   * 
   * To remove property, set the value to `undefined`. The `toJSON()` function filters those.
   * 
   * @param info The properties of the panel to update.
   */
  update(info: Partial<SerializedItem>): void {
    const cp = { ...info } as Partial<SerializedItem>;
    if (cp.key) {
      // eslint-disable-next-line no-console
      console.error(`Tried to update the "key" of an item but this is prohibited.`);
      delete cp.key;
    }
    if (cp.type) {
      // eslint-disable-next-line no-console
      console.error(`Tried to update the "type" of an item but this is prohibited.`);
      delete cp.type;
    }
    const keys = Object.keys(cp) as (keyof SerializedItem)[];
    if (!keys.length) {
      return;
    }
    const old: Partial<SerializedItem> = {};
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
   * Moves this item within a panel.
   * 
   * @param opts Optional add options.
   */
  move(opts?: TabsLayoutAddOptions): void {
    const panel = this.getParent();
    if (!panel) {
      throw new TransactionError(`The parent panel of the move operation does not exist.`);
    }
    panel.move(this.key, opts);
  }

  /**
   * Moves this item to another panel.
   * 
   * @param panel The key of the target panel to move this item to.
   * @param opts Optional add options.
   */
  moveTo(panel: string, opts?: TabsLayoutAddOptions): void {
    const { key } = this;
    const from = this.getParent();
    if (!from) {
      throw new TransactionError(`The parent panel of the move operation does not exist.`);
    }
    const to = this.key === panel ? from : this.transaction.state.panel(panel);
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
    if (!to.hasItem(item.key)) {
      to.addItem(item.toJSON(), opts);
      to.update({
        selected: item.key,
      });
    }
  }
}

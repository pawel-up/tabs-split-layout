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
   * Removes this item from all parents.
   * It is the same as finding each parent and calling the `removeItem()` on them.
   * 
   * Note, you may want to use the `StateHelper.removeItem()` as it has additional logic
   * that takes care of empty panels.
   */
  remove(): void {
    const parents = this.getParents();
    for (const parent of parents) {
      parent.removeItem(this.key);
    }
  }

  override getParents(): TransactionalPanel[] {
    return super.getParents() as TransactionalPanel[];
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
      delete cp.key;
    }
    if (cp.type) {
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
   * @param parentKey The parent panel the item should be moved within.
   * @param opts Optional add options.
   */
  move(parentKey: string, opts?: TabsLayoutAddOptions): void {
    const panel = this.getParents().find(i => i.key === parentKey);
    if (!panel) {
      throw new TransactionError(`The parent panel of the move operation does not exist.`);
    }
    panel.move(this.key, opts);
  }

  /**
   * Moves this item to another panel.
   * 
   * Note, this function takes care of the selection process in the form/to panel
   * but it won't remove the empty from panel after removing the item.
   * 
   * @param fromPanel The key of the source panel to move this item from.
   * @param toPanel The key of the target panel to move this item to.
   * @param opts Optional add options.
   */
  moveTo(fromPanel: string, toPanel: string, opts?: TabsLayoutAddOptions): void {
    const { key } = this;
    const from = this.getParents().find(i => i.key === fromPanel);
    if (!from) {
      throw new TransactionError(`The parent panel of the move operation does not exist.`);
    }
    const to = this.key === toPanel ? from : this.transaction.state.panel(toPanel);
    if (!to) {
      throw new TransactionError(`The destination panel of the move operation does not exist.`);
    }
    // it's safe to cast as from has to be a parent so it has the item.
    const item = from.removeItem(key) as TransactionalItem;
    if (!to.hasItem(item.key)) {
      to.addItem(item.toJSON(), opts);
    }
    to.update({
      selected: item.key,
    });
  }
}

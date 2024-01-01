import { Item, SerializedItem } from "../Item.js";
import type { State } from "../State.js";
import type { Transaction } from "./Transaction.js";
import type { TransactionalPanel } from "./TransactionalPanel.js";

/**
 * An instance of this object has methods that can be used in a transaction.
 */
export class TransactionalItem extends Item {
  constructor(protected transaction: Transaction, state: State, schema?: SerializedItem) {
    super(state, schema);
  }

  /**
   * Removes this item from all panels it is opened in.
   * It is the same as finding all parents of this item and calling 
   * the `removeChild()` on each.
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
}

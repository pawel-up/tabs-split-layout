import type { PanelObject } from "../PanelObject.js";
import { SerializedState, State, createItem, createPanel } from "../State.js";
import type { PanelAddOptions, StateObject } from "../type.js";
import { LayoutObjectType } from "../Enum.js";
import { TransactionalItem } from "./TransactionalItem.js";
import { TransactionalPanel } from "./TransactionalPanel.js";
import type { SerializedItem } from "../Item.js";
import type { SerializedPanel } from "../Panel.js";
import type { Transaction } from "./Transaction.js";

export const tx = Symbol('tx');

/**
 * The state with methods only available during a transaction.
 */
export class TransactionalState extends State {
  /**
   * The current transaction.
   */
  [tx]: Transaction;

  constructor(transaction: Transaction, restored?: SerializedState) {
    super();
    this[tx] = transaction;
    if (restored) {
      this.new(restored);
    }
  }

  override activePanel(): TransactionalPanel | null {
    return super.activePanel() as TransactionalPanel | null;
  }
  
  /**
   * Adds a panel to the root of the state.
   * To add a panel to another panel, first find its reference and then call add panel.
   * @param opts Adding panel options.
   * @returns The created transactional panel.
   */
  addPanel(opts: PanelAddOptions = {}): TransactionalPanel {
    const panel = new TransactionalPanel(this[tx], this);
    if (opts.direction) {
      panel.direction = opts.direction;
    }
    const definition: StateObject = {
      type: LayoutObjectType.panel,
      value: panel,
    }
    this.definitions.set(panel.key, definition);
    const obj: PanelObject = {
      key: panel.key,
      type: LayoutObjectType.panel,
    };
    this.items.push(obj);
    return panel;
  }

  override [createItem](schema: SerializedItem): TransactionalItem {
    return new TransactionalItem(this[tx], this, schema);
  }

  override [createPanel](schema: SerializedPanel): TransactionalPanel {
    return new TransactionalPanel(this[tx], this, schema);
  }

  /**
   * Finds a `Panel` by its key.
   * 
   * @param key The id of the panel.
   * @returns The panel if found
   */
  override panel(key: string): TransactionalPanel | null {
    return super.panel(key) as TransactionalPanel | null;
  }

  /**
   * Finds an `Item` by its key.
   * 
   * @param key The id of the panel's item.
   * @returns The item if found
   */
  override item(key: string): TransactionalItem | null {
    return super.item(key) as TransactionalItem | null;
  }

  override * panelIterator(parentPanel?: TransactionalPanel | undefined): Generator<TransactionalPanel> {
    for (const panel of super.panelIterator(parentPanel)) {
      yield panel as TransactionalPanel;
    }
  }
}

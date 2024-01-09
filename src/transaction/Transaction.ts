import type { SerializedPanel } from "../Panel.js";
import type { State } from "../State.js";
import { LayoutObjectType, TransactionState } from "../Enum.js";
import { TransactionalPanel } from "./TransactionalPanel.js";
import { TransactionalState } from "./TransactionalState.js";

/**
 * A transaction object that holds a list of changes applied to the state.
 * A transaction has to be committed to the manager for any change to take effect.
 * 
 * You need to rollback the transaction when an error occur.
 * 
 * ```ts
 * const transaction = state.transaction();
 * // make changes
 * 
 * try {
 *   layout.commit(transaction);
 * } catch (e) {
 *   layout.rollback(transaction);
 * }
 * ```
 */
export class Transaction {
  #state: TransactionalState;
  
  /**
   * The working state for the transaction.
   * It is used internally to conduct operations on the state and transferred to
   * the `currentState` when committed.
   */
  get state(): TransactionalState {
    return this.#state;
  }

  #status: TransactionState = TransactionState.running;

  /**
   * The status of this transaction.
   * A transaction can be committed when its status is "running."
   */
  get status(): TransactionState {
    return this.#status;
  }

  /**
   * @param currentState A reference to the manager's current state. This is only changed when the `commit()` is called.
   */
  constructor(readonly currentState: State) {
    this.#state = new TransactionalState(this, currentState.toJSON());
  }

  /**
   * Adds a new panel to the state through this transaction.
   * This method only allow to add a new panel to the root of the state.
   * 
   * For adding a panel to another panel, find for the panel first and then call the `add()` function.
   * 
   * ```ts
   * const panel = transaction.get(parentKey) as TransactionalPanel;
   * panel.add(panel);
   * ```
   * 
   * @param panel The definition of the panel. If the `key` is not provided then one will be generated.
   * @param parentKey When set it is equivalent of reading a panel from the transaction and then calling the `add()` method.
   * When not set it adds the panel to the root.
   * @returns A panel that has transaction methods enabled.
   */
  add(panel: Partial<SerializedPanel> = {}): TransactionalPanel {
    const { state } = this;
    const result = new TransactionalPanel(this, state);
    if (panel.direction) {
      result.direction = panel.direction;
    }
    if (Array.isArray(panel.items)) {
      result.items = panel.items.map(i => ({ ...i }));
    }
    if (panel.key) {
      result.key = panel.key;
    }
    if (panel.selected) {
      result.selected = panel.selected;
    }
    if (panel.state) {
      result.state = panel.state;
    }
    state.definitions.set(result.key, {
      type: LayoutObjectType.panel,
      value: result,
    });
    state.items.push({
      type: LayoutObjectType.panel,
      key: result.key,
    });
    return result;
  }

  /**
   * Commits the transaction and finalizes the current transaction instance.
   * 
   * If any of the operations fail, then the entire transaction fails.
   * You need to `rollback()` the transaction to restore the state on the layout. 
   */
  commit(): void {
    const { currentState, state, status } = this;
    if (status === TransactionState.done) {
      throw new Error(`This transaction has been committed. Create a new transaction to manipulate the state.`);
    }
    currentState.new(state.toJSON());
    currentState.notifyChange();
    currentState.notifyRender();
    this.#status = TransactionState.done;
  }

  /**
   * Resets the State object to the initial values.
   * Note, this does not change the `status` of the transaction.
   */
  reset(): void {
    this.#state = new TransactionalState(this);
  }
}

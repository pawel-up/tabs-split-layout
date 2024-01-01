import type { State } from "../State.js";

export class StateEvent extends Event {
  /**
   * Creates a State event dispatched by the Manager.
   * @param name The type of the event.
   * @param state The current state object.
   */
  constructor(name: string, public readonly state: State) {
    super(name, { cancelable: false });
  }
}

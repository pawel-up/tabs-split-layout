import type { State } from "./State.js";
import { Rand } from "./lib/Rand.js";
import { LayoutObjectType } from "./Enum.js";


export interface SerializedLayoutObject {
  /**
   * The key of the object. 
   * Each object need a unique key inside the layout.
   */
  key: string;

  /**
   * The type of the object.
   * This is to compare object using this property and not the 
   * `instance of`.
   */
  type: LayoutObjectType;
}

/**
 * A base class for objects held in the layout.
 */
export class LayoutObject {
  /**
   * The key of the object. 
   * Each object need a unique key inside the layout.
   */
  key: string;

  /**
   * The type of the object.
   * This is to compare object using this property and not the 
   * `instance of`.
   */
  type: LayoutObjectType;

  /**
   * A reference to the state object.
   */
  protected layoutState: State;

  constructor(state: State, key: string, type: LayoutObjectType) {
    this.key = key;
    this.type = type;
    this.layoutState = state;
  }

  protected new(schema: SerializedLayoutObject): void {
    const { key = Rand.id(), type } = schema;
    const allowedTypes = Object.values(LayoutObjectType);
    if (!type || !allowedTypes.includes(type)) {
      throw new Error(`Invalid layout object definition. The type must be one of ${allowedTypes.join(', ')}.`);
    }
    this.key = key;
    this.type = type;
  }

  toJSON(): SerializedLayoutObject {
    const result: SerializedLayoutObject = {
      key: this.key,
      type: this.type,
    };
    return result;
  }
}

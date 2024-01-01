import { LayoutObjectType } from "./Enum.js";

/**
 * A definition od an object held by a panel.
 * This creates a reference from the panel to an actual item.
 */
export interface PanelObject {
  /**
   * The type of the object.
   */
  type: LayoutObjectType;
  /**
   * The id of the object in the `definitions` map.
   */
  key: string;
}

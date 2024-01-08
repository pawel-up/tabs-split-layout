import { SVGTemplateResult } from "lit";
import { LayoutObject, SerializedLayoutObject } from "./LayoutObject.js";
import { Rand } from "./lib/Rand.js";
import { LayoutObjectType } from "./Enum.js";
import type { State } from "./State.js";
import type { Panel } from "./Panel.js";

export type CustomSchema = Record<string | number | symbol, unknown>;

export interface SerializedItem<T = CustomSchema> extends SerializedLayoutObject {
  /**
   * Any custom data added by the application.
   * 
   * Use it to store item related identifiers, if needed.
   * Do not use `key` as the identifier. It may change when moving items between panels.
   * 
   * Example:
   * 
   * ```
   * {
   *   "custom": { "kind": "itemA", key: "my-key" }
   * }
   * ```
   * 
   * And then in the renderer:
   * 
   * ```
   * layout.render((item: Item, visible: boolean): TemplateResult => {
   *  switch (item.custom.kind) {
   *    case 'itemA': return html`...`;
   *    default: return html`Unknown layout object.`;
   *  }
   * });
   * ```
   * 
   * Note, on the Item instance, the `custom` property is always initialized to an empty object.
   */
  custom?: T;

  /**
   * The label to render in the layout tab.
   */
  label: string;

  /**
   * Whether the tab is pinned (cannot be closed or moved).
   */
  pinned?: boolean;

  /**
   * The tab index, 0-based.
   */
  index?: number;

  /**
   * The SVG icon template. 
   * 
   * Use the `svg` template generator from the `lit` library to generate a valid template.
   * 
   * ```javascript
   * import { svg } from 'lit';
   * 
   * const icon = svg`<svg viewBox="0 0 24 24" style="width: 100%; height: 100%;">...</svg>`;
   * ```
   */
  icon?: SVGTemplateResult;

  /**
   * A property to be used by the screen to indicate the property is being loaded
   * (from a data store, file, etc).
   */
  loading?: boolean;
  
  /**
   * Indicates the item has been changed and is out of sync with the data store.
   */
  isDirty?: boolean;

  /**
   * This filed is populated when a tab is **linked** from one panel to another.
   * This operation would result in a duplicated `key`. To mitigate this, the 
   * manager's logic creates a new `Item` on the state which is the copy of the original
   * item. This keeps the reference to the original item so when the item is moved
   * back it can be properly recognized.
   */
  linkedId?: string;
}

/**
 * An item represents a single tab inside a layout panel.
 * 
 * The item is an abstract object and is not aware of the content the tab is rendering.
 * It is used to generate tabs and to make a space for the content.
 */
export class Item extends LayoutObject implements SerializedItem {

  custom: CustomSchema = {};

  label = '';

  pinned?: boolean;

  index = 0;

  icon?: SVGTemplateResult;

  loading?: boolean;

  isDirty?: boolean;

  linkedId?: string;
  
  constructor(state: State, schema?: SerializedItem) {
    super(state, Rand.id(), LayoutObjectType.item);
    if (schema) {
      this.new(schema);
    }
  }

  override new(schema: SerializedItem): void {
    super.new(schema);
    const { custom = {}, label = '', icon, index, isDirty, loading, pinned, linkedId } = schema;
    this.label = label;
    this.custom = custom;
    this.linkedId = linkedId;
    if (icon) {
      this.icon = icon;
    } else {
      this.icon = undefined;
    }
    if (typeof pinned === 'boolean') {
      this.pinned = pinned;
    } else {
      this.pinned = undefined;
    }
    if (typeof loading === 'boolean') {
      this.loading = loading;
    } else {
      this.loading = undefined;
    }
    if (typeof isDirty === 'boolean') {
      this.isDirty = isDirty;
    } else {
      this.isDirty = undefined;
    }
    if (typeof index === 'number') {
      this.index = index;
    } else {
      this.index = 0;
    }
  }

  override toJSON(): SerializedItem {
    const { label, custom } = this;
    const result: SerializedItem = {
      ...super.toJSON(),
      label,
    };
    if (this.icon) {
      result.icon = this.icon;
    }
    if (typeof this.pinned === 'boolean') {
      result.pinned = this.pinned;
    }
    if (typeof this.loading === 'boolean') {
      result.loading = this.loading;
    }
    if (typeof this.isDirty === 'boolean') {
      result.isDirty = this.isDirty;
    }
    if (typeof this.index === 'number') {
      result.index = this.index;
    }
    if (Object.keys(custom).length) {
      result.custom = { ...custom };
    }
    if (this.linkedId) {
      result.linkedId = this.linkedId;
    }
    return result;
  }

  /**
   * Finds the parent panel of the item.
   * 
   * @returns The parent panel or null if the item was not added to a panel.
   */
  getParent(): Panel | null {
    const { layoutState, key } = this;
    for (const { type, value } of layoutState.definitions.values()) {
      if (type !== LayoutObjectType.panel) {
        continue;
      }
      const panel = value as Panel;
      const has = panel.items.some(i => i.key === key);
      if (has) {
        return panel;
      }
    }
    return null;
  }
}

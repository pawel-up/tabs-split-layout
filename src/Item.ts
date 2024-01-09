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
}

/**
 * An item represents a single tab inside a layout panel.
 * 
 * An item can be added to multiple parents. The panel state of the item (index, pinned)
 * is encoded in the `items` but the common properties are held in state's `definitions`.
 * 
 * The item is an abstract object and is not aware of the content the tab is rendering.
 * It is used to generate tabs and to make a space for the content.
 */
export class Item extends LayoutObject implements SerializedItem {

  custom: CustomSchema = {};

  label = '';

  icon?: SVGTemplateResult;

  loading?: boolean;

  isDirty?: boolean;
  
  constructor(state: State, schema?: SerializedItem) {
    super(state, Rand.id(), LayoutObjectType.item);
    if (schema) {
      this.new(schema);
    }
  }

  override new(schema: SerializedItem): void {
    super.new(schema);
    const { custom = {}, label = '', icon, isDirty, loading } = schema;
    this.label = label;
    this.custom = custom;
    if (icon) {
      this.icon = icon;
    } else {
      this.icon = undefined;
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
    if (typeof this.loading === 'boolean') {
      result.loading = this.loading;
    }
    if (typeof this.isDirty === 'boolean') {
      result.isDirty = this.isDirty;
    }
    if (Object.keys(custom).length) {
      result.custom = { ...custom };
    }
    return result;
  }

  /**
   * Finds all parent panels of the item.
   * 
   * @returns The list of parent panels of the item. Might be empty array when the item has no parents.
   */
  getParents(): Panel[] {
    const { layoutState, key } = this;
    const result: Panel[] = [];
    for (const { type, value } of layoutState.definitions.values()) {
      if (type !== LayoutObjectType.panel) {
        continue;
      }
      const panel = value as Panel;
      const has = panel.items.some(i => i.key === key);
      if (has) {
        result.push(panel);
      }
    }
    return result;
  }
}

import { LayoutObject, SerializedLayoutObject } from "./LayoutObject.js";
import { PanelObject } from "./PanelObject.js";
import { Rand } from "./lib/Rand.js";
import { LayoutDirection, LayoutObjectType, PanelState } from "./Enum.js";
import type { Item } from "./Item.js";
import type { State } from "./State.js";

export interface SerializedPanel extends SerializedLayoutObject {
  /**
   * The direction the panel splits.
   * It only has meaning when the panel is holding other panels.
   */
  direction?: LayoutDirection;

  /**
   * The current state of the panel.
   */
  state?: PanelState;

  /**
   * The `key` of the item being rendered in the panel.
   * Only one item can be rendered in a panel that holds items.
   */
  selected?: string;

  /**
   * The items or panels held by this panel.
   */
  items?: PanelObject[];
}

/**
 * A panel represents a section in the layout that hosts tabs.
 * The layout can have multiple panes deeply embedded in either horizontal or vertical direction.
 * 
 * Characteristics:
 * 
 * - A panel can either hold items or panels, never both.
 * - Only one item can be rendered in a panel that holds items.
 * - All panels are rendered in a panel that holds panels.
 */
export class Panel extends LayoutObject {
  /**
   * The direction the panel splits.
   * It only has meaning when the panel is holding other panels.
   */
  direction: LayoutDirection = LayoutDirection.horizontal;

  /**
   * The current state of the panel.
   */
  state: PanelState = PanelState.idle;

  /**
   * The `key` of the item being rendered in the panel.
   * Only one item can be rendered in a panel that holds items.
   */
  selected?: string;

  /**
   * The items or panels held by this panel.
   */
  items: PanelObject[] = [];

  /**
   * Checks whether this panel has other panels on it.
   * If so, this also means that the `hasItems` is `false`.
   */
  get hasPanels(): boolean {
    return this.items.some(i => i.type === LayoutObjectType.panel);
  }

  /**
   * Checks whether this panel has items on it.
   * If so, this also means that the `hasPanels` is `false`.
   */
  get hasItems(): boolean {
    return this.items.some(i => i.type === LayoutObjectType.item);
  }

  constructor(state: State, schema?: SerializedPanel) {
    super(state, Rand.id(), LayoutObjectType.panel);
    if (schema) {
      this.new(schema);
    }
  }

  override new(schema: SerializedPanel): void {
    super.new(schema);
    const { direction = LayoutDirection.horizontal, items, selected } = schema;
    this.direction = direction;
    if (Array.isArray(items)) {
      this.items = items.map(i => ({ ...i }));
    } else {
      this.items = [];
    }
    if (selected) {
      this.selected = selected;
    } else {
      this.selected = undefined;
    }
    this.state = PanelState.idle;
  }

  override toJSON(): SerializedPanel {
    const result: SerializedPanel = {
      ...super.toJSON(),
    };
    if (Array.isArray(this.items) && this.items.length) {
      result.items = this.items.map(i => ({ ...i }));
    }
    if (this.selected) {
      result.selected = this.selected;
    }
    if (this.direction) {
      result.direction = this.direction;
    }
    return result;
  }

  /**
   * Finds and returns a parent panel of this panel.
   * It returns `null` when the panel is the root panel (at the top of the state)
   * or when the panel was removed from the state.
   * 
   * @returns The parent panel of this panel or null otherwise.
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

  /**
   * Checks whether this panel contains an item
   * @param key The key of the item to test.
   * @returns true if the panel contains an item
   */
  hasItem(key: string): boolean {
    return this.items.some(i => i.key === key);
  }

  /**
   * @returns Returns a **copy** of the items array sorted by index.
   */
  sortedItems(): Item[] {
    const { items, layoutState } = this;
    const splitItems: Item[] = [];
    items.forEach((i) => {
      if (i.type === LayoutObjectType.item) {
        const value = layoutState.item(i.key as string);
        if (value) {
          splitItems.push(value);
        }
      }
    });
    return [...splitItems].sort((a, b) => (a.index || 0) - (b.index || 0));
  }

  /**
   * @returns True when the panel accepts drop events.
   */
  canDrop(): boolean {
    // return !!this.items.length;
    return !this.hasPanels;
  }

  /**
   * @returns `true` when this panel has sibling panels.
   */
  hasSiblings(): boolean {
    const parent = this.getParent();
    if (!parent) {
      return false;
    }
    return parent.items.length > 1;
  }

  /**
   * @param other The key of the other panel.
   * @returns `true` if the `other` is a sibling of this panel.
   */
  isSibling(other: string): boolean {
    const parent = this.getParent();
    if (!parent) {
      return false;
    }
    return parent.items.some(i => i.key === other);
  }

  /**
   * Finds the index of an item on the items array
   * after ordering them according to the `sortedItems()`.
   * This can be used to read the position of the rendered tab
   * in the view.
   * @returns 0-based position of an item. It returns -1 when no item found.
   */
  itemIndex(key: string): number {
    const items = this.sortedItems();
    return items.findIndex(i => i.key === key);
  }

  /**
   * The default iterator for the panel. Yields items in order.
   */
  * [Symbol.iterator](): Generator<Item> {
    const items = this.sortedItems();
    for (const item of items) {
      yield item;
    }
  }
}

/**
 * An enum describing the direction of the layout.
 */
export enum LayoutDirection {
  horizontal = 'horizontal',
  vertical = 'vertical',
}

/**
 * Used to determine the type of an Item.
 */
export enum LayoutObjectType {
  panel = "panel",
  item = "item",
}

export enum SplitRegion {
  center = 'center',
  east = 'east',
  west = 'west',
  north = 'north',
  south = 'south',
}

export enum PanelState {
  idle = 'idle',
  busy = 'busy',
}

export enum TabCloseDirection {
  left = 'left', 
  right = 'right', 
  both = 'both',
}

export enum SplitPanelTarget {
  /**
   * Items are added to the first panel
   */
  first,
  /**
   * Items are added to the other, created panel
   */
  other,
}

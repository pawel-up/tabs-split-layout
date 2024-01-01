import type SplitView from "../SplitView.js";
import { SplitRegion } from "../Enum.js";

export default class {
  /**
   * Finds a `SplitView` from which the event originated.
   * 
   * @param e The event to find the layout for.
   * @param localName The local name of the registered element.
   * @returns The SplitView element from which the event originated.
   */
  static findLayout(e: Event, localName: string): SplitView | null {
    const path = e.composedPath();
    while (path.length) {
      const node = path.shift() as Element;
      
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      if (node.localName === localName) {
        return node as SplitView;
      }
    }
    return null;
  }

  /**
   * Splits UI regions of an element into 4 areas (north, south, west, east)
   * and returns the region for where the event ocurred.
   * 
   * @param element The element to test for the drop region
   * @param e The drop event
   * @returns The region on which the drop ocurred.
   */
  static getDropRegion(element: HTMLElement, e: MouseEvent): SplitRegion | null {
    const { pageX, pageY } = e;
    const rect = element.getBoundingClientRect();
    if (pageX < rect.left || pageX > rect.right) {
      return null;
    }
    if (pageY < rect.top || pageY > rect.bottom) {
      return null;
    }
    const quarterWidth = rect.width / 4;
    const quarterHeight = rect.height / 4;
    if (pageX < rect.left + quarterWidth) {
      return SplitRegion.west;
    }
    if (pageX > rect.right - quarterWidth) {
      return SplitRegion.east;
    }
    if (pageY < rect.top + quarterHeight) {
      return SplitRegion.north;
    }
    if (pageY > rect.bottom - quarterHeight) {
      return SplitRegion.south;
    }
    return SplitRegion.center;
    // const withingCenterX = (pageX >= rect.left + quarterWidth) && (pageX <= rect.right - quarterWidth);
    // const withingCenterY = (pageY >= rect.top + quarterHeight) && (pageY <= rect.bottom - quarterHeight);
    // if (withingCenterX && withingCenterY) {
    //   return SplitRegion.center;
    // }
    // return null;
  }

  /**
   * A combination of `findLayout()` and `getDropRegion()`, for convenience.
   * @param e The originating mouse event.
   * @param localName The element's local name to find the SplitView.
   * @returns The split region of a split view.
   */
  static getDropRegionFromEvent(e: MouseEvent, localName: string): SplitRegion | null {
    const layout = this.findLayout(e, localName);
    if (!layout) {
      return null;
    }
    return this.getDropRegion(layout, e);
  }

  /**
   * Finds a `tab` ([role=tab]) in the event path.
   * @param e The event to get the path from.
   */
  static findTab(e: Event): HTMLElement | null {
    const path = e.composedPath();
    while (path.length) {
      const node = path.shift() as Element;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const role = node.getAttribute('role');
      if (role === 'tab') {
        return node as HTMLElement;
      }
    }
    return null;
  }
}

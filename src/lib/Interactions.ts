export default class {
  /**
   * Checks whether a middle button was clicked.
   * 
   * @param e The pointer event to get the information from.
   */
  static isMiddleButton(e: PointerEvent): boolean {
    // the configuration of a middle button click which is 
    // equal to 3 fingers click on a track pad.
    return e.button === 1 && e.buttons === 4;
  }

  /**
   * When using a trackpad, 3 target touches represent an intention
   * to close a tab/window. This function is to detect those.
   * 
   * @param e The originating touch event.
   * @returns true when the target has 3 touches.
   */
  static isCloseTouch(e: TouchEvent): boolean {
    return e.targetTouches.length === 3;
  }
}

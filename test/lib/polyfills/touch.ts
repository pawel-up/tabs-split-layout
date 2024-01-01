/* eslint-disable lines-between-class-members */
if (typeof Touch === 'undefined') {
  globalThis.Touch = class Touch {
    identifier: number;
    target: EventTarget;
    clientX: number;
    clientY: number;
    force: number;
    pageX: number;
    pageY: number;
    radiusX: number;
    radiusY: number;
    rotationAngle: number;
    screenY: number;
    screenX: number;

    constructor(touchInitDict: TouchInit) {
      const { 
        identifier, target, clientX = 0, clientY = 0, 
        force = 0, pageX = 0, pageY = 0, radiusX = 0, radiusY = 0, 
        rotationAngle = 0, screenX = 0, screenY = 0,
      } = touchInitDict;
      this.identifier = identifier;
      this.target = target;
      this.clientX = clientX;
      this.clientY = clientY;
      this.force = force;
      this.pageX = pageX;
      this.pageY = pageY;
      this.radiusX = radiusX;
      this.radiusY = radiusY;
      this.rotationAngle = rotationAngle;
      this.screenX = screenX;
      this.screenY = screenY;
    }
  }
}

if (typeof TouchEvent === 'undefined') {
  class TouchList extends Array {
    constructor(touches?: Touch[]) {
      super();
      if (Array.isArray(touches)) {
        for (const item of touches) {
          this.push(item);
        }
      }
    }

    item(index: number): Touch | null {
      return this[index] || null;
    }
  }

  globalThis.TouchEvent = class TouchEvent extends Event {
    altKey: boolean;
    changedTouches: TouchList;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    targetTouches: TouchList;
    touches: TouchList;
    detail: number;
    view: Window | null;
    which: number;

    constructor(type: string, eventInitDict: TouchEventInit  = {}) {
      super(type);
      const {
        altKey = false, changedTouches = [], ctrlKey = false, metaKey = false,
        shiftKey = false, targetTouches = [], touches = [], detail = 0,
        view = null, which = 0,
      } = eventInitDict;
      this.altKey = altKey;
      this.changedTouches = new TouchList(changedTouches);
      this.ctrlKey = ctrlKey;
      this.metaKey = metaKey;
      this.shiftKey = shiftKey;
      this.targetTouches = new TouchList(targetTouches);
      this.touches = new TouchList(touches);
      this.detail = detail;
      this.view = view;
      this.which = which;
    }

    initUIEvent(): void {}
  }
}

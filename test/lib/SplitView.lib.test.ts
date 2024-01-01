import { assert, fixture, html } from '@open-wc/testing';
import SplitViewLib from '../../src/lib/SplitView.lib.js';
import '../../src/define/split-view.js';

class SyntheticEvent extends Event {
  constructor() {
    super('event');
  }

  composedPath(): EventTarget[] {
    return[];
  }
}

describe('lib', () => {
  describe('SplitView.lib', () => {
    describe('findLayout()', () => {
      it('returns the layout element', async () => {
        const layout = await fixture(html`<split-view></split-view>`);
        const text = document.createTextNode('template');
        const e = new SyntheticEvent();
        e.composedPath = (): EventTarget[] => [text, document.body, layout, window];
        const result = SplitViewLib.findLayout(e, 'split-view');
        assert.ok(result);
      });

      it('returns null when not found', async () => {
        const text = document.createTextNode('template');
        const e = new SyntheticEvent();
        e.composedPath = (): EventTarget[] => [text, document.body, window];
        const result = SplitViewLib.findLayout(e, 'split-view');
        assert.isNull(result);
      });
    });

    describe('getDropRegion()', () => {
      // Note, body margins and paddings were set to 0px in the test setup: web-test-runner.config.mjs.
      let wrapper: HTMLElement;
      let element: HTMLElement;
      let box: DOMRect;
      beforeEach(async () => {
        wrapper = await fixture(html`<div style="margin: 10px; padding: 10px;">
          <section style="width: 400px; height: 400px; margin: 10px; padding: 10px;"></section>
        </div>`);
        element = wrapper.querySelector('section')!;
        box = new DOMRect(30, 30, 420, 420);

        /*
        The produced box of the <section> element looks like the following:
        {
          x: 30,
          y: 30,
          width: 420,
          height: 420,
          top: 30,
          right: 450,
          bottom: 450,
          left: 30
        }
        */
      });

      it('returns null when outside of element box (top-left)', () => {
        const e = new MouseEvent('click', {
          clientX: 10,
          clientY: 10,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (bottom-left)', () => {
        const e = new MouseEvent('click', {
          clientX: 10,
          clientY: 500,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (top-right)', () => {
        const e = new MouseEvent('click', {
          clientX: 500,
          clientY: 10,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (bottom-right)', () => {
        const e = new MouseEvent('click', {
          clientX: 500,
          clientY: 500,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (top)', () => {
        const e = new MouseEvent('click', {
          clientX: 100,
          clientY: 0,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (bottom)', () => {
        const e = new MouseEvent('click', {
          clientX: 100,
          clientY: 500,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (left)', () => {
        const e = new MouseEvent('click', {
          clientX: 10,
          clientY: 100,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns null when outside of element box (right)', () => {
        const e = new MouseEvent('click', {
          clientX: 500,
          clientY: 100,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.isNull(result);
      });

      it('returns the west region for top-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left,
          clientY: box.top,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'west');
      });

      it('returns the west region for bottom-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left,
          clientY: box.bottom,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'west');
      });

      it('returns the west region for top-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 - 1,   // split by quarters - 1 the line
          clientY: box.top,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'west');
      });

      it('returns the west region for bottom-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 - 1,   // split by quarters - 1 the line
          clientY: box.bottom,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'west');
      });

      it('returns the east region for top-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 + 1,  // split by quarters + 1 the line
          clientY: box.y,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'east');
      });

      it('returns the east region for bottom-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 + 1, // split by quarters + 1 the line
          clientY: box.bottom,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'east');
      });

      it('returns the east region for top-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right,
          clientY: box.y,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'east');
      });

      it('returns the east region for bottom-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right,
          clientY: box.bottom,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'east');
      });

      it('returns the north region for top-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.y,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'north');
      });

      it('returns the north region for bottom-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.top + box.height / 4 - 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'north');
      });

      it('returns the north region for top-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 - 1,
          clientY: box.y,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'north');
      });

      it('returns the north region for bottom-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 - 1,
          clientY: box.top + box.height / 4 - 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'north');
      });

      it('returns the south region for top-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.bottom - box.height / 4 + 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'south');
      });

      it('returns the south region for bottom-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.bottom,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'south');
      });

      it('returns the south region for top-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 - 1,
          clientY: box.bottom - box.height / 4 + 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'south');
      });

      it('returns the south region for bottom-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 - 1,
          clientY: box.bottom,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'south');
      });

      it('returns the center region for top-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.top + box.height / 4 + 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'center');
      });

      it('returns the center region for bottom-left corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.bottom - box.height / 4 - 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'center');
      });

      it('returns the center region for top-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 - 1,
          clientY: box.top + box.height / 4 + 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'center');
      });

      it('returns the center region for bottom-right corner', () => {
        const e = new MouseEvent('click', {
          clientX: box.right - box.width / 4 - 1,
          clientY: box.bottom - box.height / 4 - 1,
        });
        const result = SplitViewLib.getDropRegion(element, e);
        assert.equal(result, 'center');
      });
    });

    describe('getDropRegionFromEvent()', () => {
      // Note, body margins and paddings were set to 0px in the test setup: web-test-runner.config.mjs.
      let wrapper: HTMLElement;
      let element: HTMLElement;
      let box: DOMRect;
      beforeEach(async () => {
        wrapper = await fixture(html`<div style="margin: 10px; padding: 10px;">
          <split-view style="width: 400px; height: 400px; margin: 10px; padding: 10px;"></split-view>
        </div>`);
        element = wrapper.querySelector('split-view')!;
        box = new DOMRect(30, 30, 420, 420);
      });

      it('returns null for a mouse event outside the element', () => {
        const e = new MouseEvent('click', {
          clientX: 10,
          clientY: 10,
        });
        e.composedPath = (): EventTarget[] => [element, wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.isNull(result);
      });

      it('returns null when the element not found', () => {
        const e = new MouseEvent('click', {
          clientX: 10,
          clientY: 10,
        });
        e.composedPath = (): EventTarget[] => [wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.isNull(result);
      });

      it('returns the west region', () => {
        // we pick a random point
        const e = new MouseEvent('click', {
          clientX: box.left + 10,
          clientY: box.top + 10,
        });
        e.composedPath = (): EventTarget[] => [element, wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.equal(result, 'west');
      });

      it('returns the east region', () => {
        // we pick a random point
        const e = new MouseEvent('click', {
          clientX: box.right - 10,
          clientY: box.bottom - 10,
        });
        e.composedPath = (): EventTarget[] => [element, wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.equal(result, 'east');
      });

      it('returns the north region', () => {
        // we pick a random point
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.top + 10,
        });
        e.composedPath = (): EventTarget[] => [element, wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.equal(result, 'north');
      });

      it('returns the south region', () => {
        // we pick a random point
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.bottom - 10,
        });
        e.composedPath = (): EventTarget[] => [element, wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.equal(result, 'south');
      });

      it('returns the center region', () => {
        // we pick a random point
        const e = new MouseEvent('click', {
          clientX: box.left + box.width / 4 + 1,
          clientY: box.top + box.height / 4 + 1,
        });
        e.composedPath = (): EventTarget[] => [element, wrapper, document.body, window];
        const result = SplitViewLib.getDropRegionFromEvent(e, 'split-view');
        assert.equal(result, 'center');
      });
    });

    describe('findTab()', () => {
      // Note, body margins and paddings were set to 0px in the test setup: web-test-runner.config.mjs.
      let wrapper: HTMLElement;
      let element: HTMLElement;
      beforeEach(async () => {
        wrapper = await fixture(html`<div>
          <button role="tab">Tab</button>
        </div>`);
        element = wrapper.querySelector('button')!;
      });

      it('returns the tab element', () => {
        const e = new Event('test');
        const txt = document.createTextNode('test');
        e.composedPath = (): EventTarget[] => [txt, wrapper, document.body, window, element];
        const result = SplitViewLib.findTab(e);
        assert.ok(result);
      });

      it('returns null when no element', () => {
        const e = new Event('test');
        const txt = document.createTextNode('test');
        e.composedPath = (): EventTarget[] => [wrapper, document.body, window, txt];
        const result = SplitViewLib.findTab(e);
        assert.isNull(result);
      });
    });
  });
});

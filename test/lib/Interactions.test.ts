import { assert } from '@open-wc/testing';
import Interactions from '../../src/lib/Interactions.js';
import './polyfills/touch.js';

describe('lib', () => {
  describe('Interactions', () => {
    describe('isMiddleButton()', () => {
      it('returns true for a middle button', () => {
        // Note, I don't remember where I saw it but I read 
        // that these are the correct buttons configuration.
        // If not, feel free to change that.
        const e = new PointerEvent('click', {
          button: 1,
          buttons: 4,
        });
        const result = Interactions.isMiddleButton(e);
        assert.isTrue(result);
      });

      it('returns false when buttons !== 4', () => {
        const e = new PointerEvent('click', {
          button: 1,
          buttons: 1,
        });
        const result = Interactions.isMiddleButton(e);
        assert.isFalse(result);
      });

      it('returns false when button !== 1', () => {
        const e = new PointerEvent('click', {
          button: 2, // middle
          buttons: 4,
        });
        const result = Interactions.isMiddleButton(e);
        assert.isFalse(result);
      });
    });

    describe('isCloseTouch()', () => {
      let hasTouchSupport: boolean;
      try {
        // eslint-disable-next-line no-new
        new Touch({ identifier: 1, target: document.body, });
        hasTouchSupport = true;
      } catch {
        hasTouchSupport = false;
      }

      (hasTouchSupport ? it : it.skip)('returns true when 3 touch points', () => {
        const e = new TouchEvent('touch', {
          targetTouches: [
            new Touch({ identifier: 1, target: document.body, }),
            new Touch({ identifier: 2, target: document.body, }),
            new Touch({ identifier: 3, target: document.body, }),
          ],
        });
        const result = Interactions.isCloseTouch(e);
        assert.isTrue(result);
      });

      (hasTouchSupport ? it : it.skip)('returns false when less than 3 touch points', () => {
        const e = new TouchEvent('touch', {
          targetTouches: [
            new Touch({ identifier: 1, target: document.body, }),
            new Touch({ identifier: 2, target: document.body, }),
          ],
        });
        const result = Interactions.isCloseTouch(e);
        assert.isFalse(result);
      });

      (hasTouchSupport ? it : it.skip)('returns false when more than 3 touch points', () => {
        const e = new TouchEvent('touch', {
          targetTouches: [
            new Touch({ identifier: 1, target: document.body, }),
            new Touch({ identifier: 2, target: document.body, }),
            new Touch({ identifier: 3, target: document.body, }),
            new Touch({ identifier: 4, target: document.body, }),
          ],
        });
        const result = Interactions.isCloseTouch(e);
        assert.isFalse(result);
      });
    });
  });
});

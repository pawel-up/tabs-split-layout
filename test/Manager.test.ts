import { TemplateResult, render } from "lit";
import { customElement } from "lit/decorators.js";
import { assert, fixture, html, nextFrame } from "@open-wc/testing";
import sinon from 'sinon';
import { State } from "../src/State.js";
import { Manager, computeManualRendering, findViewFromEvent, handleFocusIn, manageStateEvents } from "../src/Manager.js";
import type { ManagerInit, ManagerRenderOptions } from "../src/type.js";
import type { Item } from "../src/Item.js";
import ViewElement from '../src/SplitView.js';
import '../src/define/split-view.js';
import type SplitView from "../src/SplitView.js";

@customElement('split-view2')
class SplitViewElement extends ViewElement {
}

declare global {
  interface HTMLElementTagNameMap {
    'split-view2': SplitViewElement;
  }
}

describe('Manager', () => {
  function renderer(item: Item, visible: boolean): TemplateResult {
    return html`<section ?hidden="${!visible}" data-key="${item.key}" role="tabpanel" aria-label="${item.label}" tabindex="0">
      Rendering: ${item.label} ${item.key}
    </section>`;
  }

  describe('constructor()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('sets the passed state object', () => {
      const layout = new Manager(state);
      assert.deepEqual(layout.state, state);
    });

    it('sets the passed opts object as read only', () => {
      const opts: ManagerInit = {
        constrain: true,
      };
      const layout = new Manager(state, opts);
      assert.deepEqual(layout.opts, opts);
      assert.throws(() => {
        // @ts-ignore
        layout.opts.constrain = false;
      });
    });

    it('adds events to the state', () => {
      const layout = new Manager(state);
      const s1 = sinon.spy();
      const s2 = sinon.spy();
      layout.addEventListener('change', s1);
      layout.addEventListener('render', s2);
      state.notifyChange();
      state.notifyRender();
      assert.isTrue(s1.calledOnce, 'the change event was handled');
      assert.isTrue(s2.calledOnce, 'the render event was handled');
    });

    it('computes #manualRendering when no config', () => {
      const layout = new Manager(state);
      assert.isTrue(layout.manualRendering);
    });
  });

  describe('#state setter and getter', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('attaches events to the new state object', () => {
      const layout = new Manager(state);
      const s1 = sinon.spy();
      const s2 = sinon.spy();
      layout.addEventListener('change', s1);
      layout.addEventListener('render', s2);
      const otherState = new State();
      layout.state = otherState;
      state.notifyChange();
      state.notifyRender();
      otherState.notifyChange();
      otherState.notifyRender();
      assert.isTrue(s1.calledOnce, 'the change event was handled once');
      assert.isTrue(s2.calledOnce, 'the render event was handled once');
    });

    it('does nothing when setting the same state', () => {
      const layout = new Manager(state);
      const spy = sinon.spy(layout, manageStateEvents);
      layout.state = state;
      assert.isFalse(spy.called);
    });
  });

  describe('#renderRoot getter', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns null when #manualRendering', () => {
      const layout = new Manager(state);
      assert.isNull(layout.renderRoot);
    });

    it('returns a reference to the element by the css selector', async () => {
      await fixture(html`<div class="layout"></div>`);
      const layout = new Manager(state, {
        render: {
          parent: '.layout',
          renderer,
        }
      });
      assert.ok(layout.renderRoot);
    });

    it('returns a reference to passed element', async () => {
      const element = await fixture(html`<div class="layout"></div>`) as HTMLElement;
      const layout = new Manager(state, {
        render: {
          parent: element,
          renderer,
        }
      });
      assert.ok(layout.renderRoot);
    });

    it('caches the result', async () => {
      await fixture(html`<div class="layout"></div>`) as HTMLElement;
      const layout = new Manager(state, {
        render: {
          parent: '.layout',
          renderer,
        }
      });
      assert.ok(layout.renderRoot);
      const spy = sinon.spy(document, 'querySelector');
      assert.ok(layout.renderRoot);
      spy.restore();
      assert.isFalse(spy.called);
    });
  });

  describe('connect()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
    });

    it('registers the focusin event on the default node', () => {
      const spy = sinon.spy(layout, handleFocusIn);
      layout.connect();
      document.body.dispatchEvent(new Event('focusin'));
      assert.isTrue(spy.calledOnce);
    });

    it('registers the focusin event on the passed node', async () => {
      const el = await fixture(html`<p></p>`);
      const spy = sinon.spy(layout, handleFocusIn);
      layout.connect(el);
      el.dispatchEvent(new Event('focusin'));
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('disconnect()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
    });

    it('unregisters the focusin event on the default node', () => {
      const spy = sinon.spy(layout, handleFocusIn);
      layout.connect();
      layout.disconnect();
      document.body.dispatchEvent(new Event('focusin'));
      assert.isFalse(spy.called);
    });

    it('unregisters the focusin event on the passed node', async () => {
      const el = await fixture(html`<p></p>`);
      const spy = sinon.spy(layout, handleFocusIn);
      layout.connect(el);
      layout.disconnect(el);
      el.dispatchEvent(new Event('focusin'));
      assert.isFalse(spy.called);
    });
  });

  describe('[computeManualRendering]()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns true when no "renderer" config', () => {
      const layout = new Manager(state);
      assert.isTrue(layout[computeManualRendering]());
    });

    it('returns true when missing the parent', () => {
      const layout = new Manager(state, {
        render: {
          renderer,
        } as ManagerRenderOptions,
      });
      assert.isTrue(layout[computeManualRendering]());
    });

    it('returns true when missing the render', () => {
      const layout = new Manager(state, {
        render: {
          parent: '.abc',
        } as ManagerRenderOptions,
      });
      assert.isTrue(layout[computeManualRendering]());
    });

    it('returns false when has the configuration', () => {
      const layout = new Manager(state, {
        render: {
          parent: '.abc',
          renderer,
        },
      });
      assert.isFalse(layout[computeManualRendering]());
    });
  });

  describe('[handleFocusIn]()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
      const tx = layout.transaction();
      tx.add({ key: 'abc' });
      tx.commit();
    });

    it('sets the #currentPanel when handled the view', async () => {
      const view = await fixture(html`<split-view key="abc"></split-view>`);
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [view, document.body, window];
      layout[handleFocusIn](e);
      assert.equal(state.currentPanel, 'abc');
    });

    it('ignores the view if not registered with the state', async () => {
      const view = await fixture(html`<split-view key="def"></split-view>`);
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [view, document.body, window];
      layout[handleFocusIn](e);
      assert.isUndefined(state.currentPanel);
    });

    it('ignores the call when no view in the event path', async () => {
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [document.body, window];
      layout[handleFocusIn](e);
      assert.isUndefined(state.currentPanel);
    });
  });

  describe('[findViewFromEvent]()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('finds the default view', async () => {
      const view = await fixture(html`<split-view key="abc"></split-view>`);
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [view, document.body, window];
      const layout = new Manager(state);
      const result = layout[findViewFromEvent](e);
      assert.ok(result);
    });

    it('finds the configured view', async () => {
      const view = await fixture(html`<split-view2 key="abc"></split-view2>`);
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [view, document.body, window];
      const layout = new Manager(state, { viewName: 'split-view2' });
      const result = layout[findViewFromEvent](e);
      assert.ok(result);
    });

    it('handles non-element nodes', async () => {
      const view = await fixture(html`<split-view key="abc"></split-view>`);
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [document.createTextNode('test'), document.createDocumentFragment() ,view, document.body, window];
      const layout = new Manager(state);
      const result = layout[findViewFromEvent](e);
      assert.ok(result);
    });

    it('returns undefined when the view is not found', async () => {
      const e = new Event('focusin');
      e.composedPath = (): EventTarget[] => [document.body, window];
      const layout = new Manager(state);
      const result = layout[findViewFromEvent](e);
      assert.isUndefined(result);
    });
  });

  describe('view rendering', () => {
    describe('auto rendering', () => {
      let state: State;
      let layout: Manager;
      let viewRoot: HTMLElement;
  
      beforeEach(async () => {
        viewRoot = await fixture(html`<div class="layout"></div>`) as HTMLElement;
        state = new State();
        layout = new Manager(state, {
          render: {
            renderer,
            parent: '.layout',
          }
        });
      });

      it('renders the view for a single panel', async () => {
        const tx = layout.transaction();
        const p1 = tx.add();
        const i1 = p1.addItem();
        tx.commit();
        await nextFrame();
        const vp1 = viewRoot.querySelector(`split-view[key="${p1.key}"]`)!;
        assert.ok(vp1, 'has the view layout');
        const vi1 = vp1.querySelector(`[data-key="${i1.key}"]`);
        assert.ok(vi1, 'has the view item');
      });

      it('renders horizontal panels', async () => {
        const tx = layout.transaction();
        const root = tx.add();
        const p1 = root.addPanel();
        const p2 = root.addPanel()
        const i11 = p1.addItem({ label: 'item 1.1', key: 'i11' });
        const i12 = p1.addItem({ label: 'item 1.2', key: 'i12' });
        const i21 = p2.addItem({ label: 'item 2.1', key: 'i21' });
        const i22 = p2.addItem({ label: 'item 2.2', key: 'i22' });
        tx.commit();
        await nextFrame();
        
        const vpRoot = viewRoot.querySelector(`split-view[key="${root.key}"]`)!;
        assert.ok(vpRoot, 'has the view root');
        const vp1 = vpRoot.querySelector(`split-view[key="${p1.key}"]`)!;
        const vp2 = vpRoot.querySelector(`split-view[key="${p2.key}"]`)!;
        assert.ok(vp1, 'has the panel 1');
        assert.ok(vp2, 'has the panel 1');

        const vi11 = vp1.querySelector(`[data-key="${i11.key}"]`)!;
        const vi12 = vp1.querySelector(`[data-key="${i12.key}"]`)!;
        const vi21 = vp2.querySelector(`[data-key="${i21.key}"]`)!;
        const vi22 = vp2.querySelector(`[data-key="${i22.key}"]`)!;
        assert.ok(vi11, 'has the item 1 on panel 1');
        assert.ok(vi12, 'has the item 2 on panel 1');

        assert.ok(vi21, 'has the item 1 on panel 2');
        assert.ok(vi22, 'has the item 2 on panel 2');
        // <section role="tabpanel" tabindex="0" hidden="" data-key="i11" aria-label="item 1.1" id="tlc-i11">
        assert.equal(vi11.getAttribute('data-key'), i11.key, 'uses the renderer function');
      });
    });

    describe('manual rendering', () => {
      let state: State;
      let viewRoot: HTMLElement;
  
      beforeEach(async () => {
        viewRoot = await fixture(html`<div class="layout"></div>`) as HTMLElement;
        state = new State();
      });

      it('dispatches the render event and renders the view', async () => {
        const layout = new Manager(state);
        layout.addEventListener('render', () => {
          const content = layout.render(renderer);
          render(content, viewRoot);
        });
        const tx = layout.transaction();
        const p1 = tx.add();
        const i1 = p1.addItem();
        tx.commit();
        await nextFrame();
        const vp1 = viewRoot.querySelector(`split-view[key="${p1.key}"]`)!;
        assert.ok(vp1, 'has the view layout');
        const vi1 = vp1.querySelector(`[data-key="${i1.key}"]`);
        assert.ok(vi1, 'has the view item');
      });

      it('passes the constrain config property to the view', async () => {
        const layout = new Manager(state, {
          constrain: true,
        });
        layout.addEventListener('render', () => {
          const content = layout.render(renderer);
          render(content, viewRoot);
        });
        const tx = layout.transaction();
        const p1 = tx.add();
        tx.commit();
        await nextFrame();
        const vp1 = viewRoot.querySelector(`split-view[key="${p1.key}"]`) as SplitView;
        assert.ok(vp1, 'has the view layout');
        assert.isTrue(vp1.constrain);
      });

      it('passes the dragTypes config property to the view', async () => {
        const layout = new Manager(state, {
          dragTypes: ['custom/drop'],
        });
        layout.addEventListener('render', () => {
          const content = layout.render(renderer);
          render(content, viewRoot);
        });
        const tx = layout.transaction();
        const p1 = tx.add();
        tx.commit();
        await nextFrame();
        const vp1 = viewRoot.querySelector(`split-view[key="${p1.key}"]`) as SplitView;
        assert.ok(vp1, 'has the view layout');
        assert.deepEqual(vp1.dragTypes, ['custom/drop']);
      });
    });
  });

  describe('findView()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(async () => {
      await fixture(html`<div class="layout"></div>`) as HTMLElement;
      state = new State();
      layout = new Manager(state, {
        render: {
          renderer,
          parent: '.layout',
        }
      });
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'p1' });
      p1.addPanel({ key: 'p2' });
      tx.commit();
      await nextFrame();
    });

    it('finds the view in the generated layout', () => {
      const view = layout.findView('p2');
      assert.ok(view);
    });

    it('returns null when not found', () => {
      const view = layout.findView('p3');
      assert.isNull(view);
    });
  });
});

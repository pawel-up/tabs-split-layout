import { TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { assert, fixture, html, nextFrame } from "@open-wc/testing";
import sinon from 'sinon';
import { State } from "../src/State.js";
import { Manager } from "../src/Manager.js";
import type { Item } from "../src/Item.js";
import type SplitView from "../src/SplitView.js";
import '../src/define/split-view.js';
import { DataTransfer, DragEvent } from './test-lib/MockedDataTransfer.js';

describe('SplitView', () => {
  function renderer(item: Item, visible: boolean): TemplateResult {
    const id = item.key === 'test-id' ? "test-id" : undefined;
    const dataKey = item.key === 'no-key' ? undefined : item.key;
    return html`
    <section 
      ?hidden="${!visible}" 
      data-key="${ifDefined(dataKey)}" 
      role="tabpanel" 
      aria-label="${item.label}" 
      tabindex="0"
      id="${ifDefined(id)}"
    >
      Rendering: ${item.label} ${item.key}
    </section>`;
  }

  function middleOfElement(target: HTMLElement): DOMPoint {
    const rect = target.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top + (rect.height / 2);
    return new DOMPoint(x, y);
  }

  async function emptyFixture(): Promise<SplitView> {
    return fixture(html`<split-view></split-view>`) as Promise<SplitView>;
  }

  describe('#panel', () => {
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

    it('returns the panel when set', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      p1.addItem({ key: 'i1' });
      tx.commit();
      await nextFrame();
      const view = viewRoot.querySelector('split-view')!;
      assert.ok(view.panel);
    });

    it('returns nothing when no key+manager set', async () => {
      const view = await emptyFixture();
      assert.notOk(view.panel);
    });

    it('returns nothing when no manager set', async () => {
      const view = await emptyFixture();
      view.key = 'test';
      await view.updateComplete;
      assert.notOk(view.panel);
    });

    it('returns nothing when no key set', async () => {
      const view = await emptyFixture();
      view.manager = layout;
      await view.updateComplete;
      assert.notOk(view.panel);
    });
  });

  describe('supports aria and accessibility', () => {
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

    it('adds the "id" to the content element when missing', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`#tlc-${i1.key}`);
      assert.ok(content, 'has the content with generated id');
    });

    it('makes connection between the content and the tab when auto-generated', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`);
      assert.ok(tab, 'has the tab with aria-controls');
    });

    it('ignores contents without data-key', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'no-key' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`);
      assert.notOk(tab);
    });

    it('respects the set content element id', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'test-id' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`#${i1.key}`);
      assert.ok(content, 'has the content with set id');
    });

    it('makes connection between the content and the tab when set id', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'test-id' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="${i1.key}"]`);
      assert.ok(tab, 'has the tab with aria-controls');
    });

    it('sets aria-selected to true only on the selected tab', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem();
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;

      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;

      assert.equal(tab1.getAttribute('aria-selected'), 'false', 'tab 1 has aria-selected = false');
      assert.equal(tab2.getAttribute('aria-selected'), 'false', 'tab 2 has aria-selected = false');
      assert.equal(tab3.getAttribute('aria-selected'), 'true', 'tab 3 has aria-selected = true');
    });

    it('sets tabindex to 0 only on the selected tab', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem();
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;

      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;

      assert.equal(tab1.getAttribute('tabindex'), '-1', 'tab 1 has tabindex = -1');
      assert.equal(tab2.getAttribute('tabindex'), '-1', 'tab 2 has tabindex = -1');
      assert.equal(tab3.getAttribute('tabindex'), '0', 'tab 3 has tabindex = 0');
    });

    it('adds the auto-generated id when tabs change', async () => {
      const tx1 = layout.transaction();
      const p1 = tx1.add({ key: 'root' });
      p1.addItem();
      tx1.commit();
      await nextFrame();
      const tx2 = layout.transaction();
      const p2 = tx2.state.panel(p1.key)!;
      p2.removeItem(p1.key);
      const i2 = p2.addItem();
      tx2.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`);
      assert.ok(tab, 'has the tab with aria-controls');
    });

    it('triggers the contextmenu event on a tab', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i1.key}"]`)!;
      const spy = sinon.spy();
      tab.addEventListener('contextmenu', spy);
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        shiftKey: true,
        key: 'F10',
      });
      tab.dispatchEvent(keyboardEvent);
      assert.isTrue(spy.calledOnce, 'the event was dispatched');
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      const e = spy.args[0][0] as PointerEvent;
      assert.isTrue(e.shiftKey, 'has the shiftKey');
    });

    it('selects a tab on "Enter"', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      p1.addItem({ key: 'i2' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i1.key}"]`)!;
      assert.isFalse(tab.classList.contains('selected'), 'tab 1 is not selected');
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        key: 'Enter',
      })
      tab.dispatchEvent(keyboardEvent);
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      await content.updateComplete;
      assert.isTrue(tab.classList.contains('selected'), 'tab 1 is selected');
    });

    it('closes a tab on "Delete"', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      p1.addItem({ key: 'i2' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i1.key}"]`)!;
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        key: 'Delete',
      })
      tab.dispatchEvent(keyboardEvent);
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      await content.updateComplete;
      assert.isNull(state.item(i1.key), 'tab 1 was removed');
    });

    it('selects the next tab on right arrow', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      p1.addItem({ key: 'i1' });
      const i2 = p1.addItem({ key: 'i2' });
      const i3 = p1.addItem({ key: 'i3' });
      p1.selected = i2.key;
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i3.key}"]`)!;
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        key: 'ArrowRight',
      })
      tab2.dispatchEvent(keyboardEvent);
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      await content.updateComplete;
      assert.isTrue(tab3.classList.contains('selected'), 'tab 3 is selected');
    });

    it('selects the previous tab on left arrow', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p1.addItem({ key: 'i2' });
      p1.addItem({ key: 'i3' });
      p1.selected = i2.key;
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i2.key}"]`)!;
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        key: 'ArrowLeft',
      })
      tab2.dispatchEvent(keyboardEvent);
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      await content.updateComplete;
      assert.isTrue(tab1.classList.contains('selected'), 'tab 1 is selected');
    });

    it('selects the first tab on Home key', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      p1.addItem({ key: 'i2' });
      const i3 = p1.addItem({ key: 'i3' });
      p1.selected = i3.key;
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i1.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i3.key}"]`)!;
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        key: 'Home',
      })
      tab3.dispatchEvent(keyboardEvent);
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      await content.updateComplete;
      assert.isTrue(tab1.classList.contains('selected'), 'tab 1 is selected');
    });

    it('selects the last tab on End key', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ key: 'i1' });
      p1.addItem({ key: 'i2' });
      const i3 = p1.addItem({ key: 'i3' });
      p1.selected = i1.key;
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i1.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][data-key="${i3.key}"]`)!;
      const keyboardEvent = new KeyboardEvent('keydown', {
        composed: true,
        bubbles: true,
        cancelable: true,
        key: 'End',
      })
      tab1.dispatchEvent(keyboardEvent);
      assert.isTrue(keyboardEvent.defaultPrevented, 'the keyboard event was cancelled');
      await content.updateComplete;
      assert.isTrue(tab3.classList.contains('selected'), 'tab 1 is selected');
    });

    it('passes automated a11y tests', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      p1.addItem({ key: 'i1' });
      p1.addItem({ key: 'i2' });
      p1.addItem({ key: 'i3' });
      tx.commit();
      await nextFrame();
      await assert.isAccessible(viewRoot, {
        // aXe will complain about `aria-controls` which is located in the 
        // light DOM of the element. 
        ignoredRules: ['aria-valid-attr-value'],
      });
    });
  });

  describe('tab rendering', () => {
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

    it('renders the title attribute as label', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ label: 'Test Tab' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      assert.equal(tab1.getAttribute('title')!.trim(), i1.label);
    });

    it('renders the title attribute as label when isDirty', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ label: 'Test Tab', isDirty: true });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      assert.equal(tab1.getAttribute('title')!.trim(), `${i1.label} (Unsaved changes)`);
    });

    it('renders the label on the tab', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ label: 'Test Tab' });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      assert.equal(tab1.textContent!.trim(), i1.label);
    });

    it('renders the label on the tab when isDirty', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ label: 'Test Tab', isDirty: true });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const label = tab.querySelector('.tab-label')!;
      const style = getComputedStyle(label);
      assert.equal(style.fontStyle, 'italic', 'label has the italic style');
    });

    it('adds the is-dirty class to the tab when dirty', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({ isDirty: true });
      const i2 = p1.addItem();
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      assert.isTrue(tab1.classList.contains('is-dirty'), 'tab 1 is dirty');
      assert.isFalse(tab2.classList.contains('is-dirty'), 'tab 2 is not dirty');
    });

    it('adds the pinned class to the tab when pinned', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem({}, { pinned: true });
      const i2 = p1.addItem();
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      assert.isTrue(tab1.classList.contains('pinned'), 'tab 1 is pinned');
      assert.isFalse(tab2.classList.contains('pinned'), 'tab 2 is not pinned');
    });

    it('adds the selected class to the tab when selected', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      assert.isFalse(tab1.classList.contains('selected'), 'tab 1 is selected');
      assert.isTrue(tab2.classList.contains('selected'), 'tab 2 is not selected');
    });

    it('all tabs are draggable except for pinned', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem({}, { pinned: true });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;
      assert.equal(tab1.getAttribute('draggable'), 'true', 'tab 1 is draggable');
      assert.equal(tab2.getAttribute('draggable'), 'true', 'tab 2 is draggable');
      assert.equal(tab3.getAttribute('draggable'), 'false', 'tab 3 is not draggable');
    });

    it('tabs have data-key set', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem({});
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;
      assert.equal(tab1.getAttribute('data-key'), i1.key, 'tab 1 has data-key');
      assert.equal(tab2.getAttribute('data-key'), i2.key, 'tab 2 has data-key');
      assert.equal(tab3.getAttribute('data-key'), i3.key, 'tab 3 has data-key');
    });

    it('tabs have data-index set', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem({});
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;
      assert.equal(tab1.getAttribute('data-index'), '0', 'tab 1 has data-index');
      assert.equal(tab2.getAttribute('data-index'), '1', 'tab 2 has data-index');
      assert.equal(tab3.getAttribute('data-index'), '2', 'tab 3 has data-index');
    });

    it('tabs have data-panel set', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem({});
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;
      assert.equal(tab1.getAttribute('data-panel'), p1.key, 'tab 1 has data-panel');
      assert.equal(tab2.getAttribute('data-panel'), p1.key, 'tab 2 has data-panel');
      assert.equal(tab3.getAttribute('data-panel'), p1.key, 'tab 3 has data-panel');
    });

    it('dirty tabs have data-dirty set', async () => {
      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p1.addItem({ isDirty: true });
      tx.commit();
      await nextFrame();
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i1.key}"]`)!;
      const tab2 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i2.key}"]`)!;
      const tab3 = content.shadowRoot!.querySelector(`[role="tab"][aria-controls="tlc-${i3.key}"]`)!;
      assert.equal(tab1.getAttribute('data-dirty'), 'false', 'tab 1 has data-dirty = false');
      assert.equal(tab2.getAttribute('data-dirty'), 'false', 'tab 2 has data-dirty = false');
      assert.equal(tab3.getAttribute('data-dirty'), 'true', 'tab 3 has data-dirty = true');
    });
  });

  describe('drag over event', () => {
    let state: State;
    let layout: Manager;
    let viewRoot: HTMLElement;

    beforeEach(async () => {
      viewRoot = await fixture(html`<div class="layout" style="width: 800px; height: 600px; display: flex; flex-direction: column; flex: 2;"></div>`) as HTMLElement;
      state = new State();
      layout = new Manager(state, {
        render: {
          renderer,
          parent: '.layout',
        }
      });

      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      p1.addItem({ key: 'i1' });
      p1.addItem({ key: 'i2' });
      p1.selected = 'i1';
      tx.commit();
      await nextFrame();
    });

    it('sets the drop effect to move by default - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
      });
      content.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.dropEffect, 'move', 'sets dropEffect to move');
    });

    it('sets the drop effect to link with shiftKey - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      content.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.dropEffect, 'link', 'sets dropEffect to link');
    });

    it('sets the inDrag flag - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      content.dispatchEvent(dragEvent);
      await nextFrame();
      const view = viewRoot.querySelector(`split-view`)!;
      assert.isTrue(view.inDrag);
    });

    it('sets the dragRegion property - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      content.dispatchEvent(dragEvent);
      await nextFrame();
      const view = viewRoot.querySelector(`split-view`)!;
      assert.equal(view.dragRegion, 'center');
    });

    it('does nothing when the region cannot be determined - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: 10000,
        clientY: 10000,
        dataTransfer,
        shiftKey: true,
      });
      content.dispatchEvent(dragEvent);
      await nextFrame();
      const view = viewRoot.querySelector(`split-view`)!;
      assert.isFalse(view.inDrag);
    });

    it('does nothing when the event is canceled - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      dragEvent.preventDefault();
      content.dispatchEvent(dragEvent);
      await nextFrame();
      const view = viewRoot.querySelector(`split-view`)!;
      assert.isFalse(view.inDrag);
    });

    it('does nothing when drag types are incompatible - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const view = viewRoot.querySelector(`split-view`)!;
      view.dragTypes = ['other'];
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      content.dispatchEvent(dragEvent);
      await nextFrame();
      assert.isFalse(view.inDrag);
    });

    it('allows compatible types - over content', async () => {
      const content = viewRoot.querySelector(`#tlc-i1`) as HTMLElement;
      const view = viewRoot.querySelector(`split-view`)!;
      view.dragTypes = ['item/key'];
      const center = middleOfElement(content);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      content.dispatchEvent(dragEvent);
      await nextFrame();
      assert.isTrue(view.inDrag);
    });

    it('sets the drop effect to move by default - over tablist', async () => {
      const view = viewRoot.querySelector(`split-view`)!;
      const tablist = view.shadowRoot!.querySelector('[role="tablist"]') as HTMLElement;
      const center = middleOfElement(tablist);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
      });
      tablist.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.dropEffect, 'move', 'sets dropEffect to move');
    });

    it('sets the drop effect to link with shiftKey - over tablist', async () => {
      const view = viewRoot.querySelector(`split-view`)!;
      const tablist = view.shadowRoot!.querySelector('[role="tablist"]') as HTMLElement;
      const center = middleOfElement(tablist);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      tablist.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.dropEffect, 'link', 'sets dropEffect to link');
    });

    it('does nothing when drag types are incompatible - over tablist', async () => {
      const view = viewRoot.querySelector(`split-view`)!;
      view.dragTypes = ['other'];
      const tablist = view.shadowRoot!.querySelector('[role="tablist"]') as HTMLElement;
      const center = middleOfElement(tablist);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('item/key', 'i2');
      const dragEvent = new DragEvent('dragover', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
        shiftKey: true,
      });
      tablist.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.dropEffect, 'none');
    });
  });

  describe('drag start event', () => {
    let state: State;
    let layout: Manager;
    let viewRoot: HTMLElement;

    beforeEach(async () => {
      viewRoot = await fixture(html`<div class="layout" style="width: 800px; height: 600px; display: flex; flex-direction: column; flex: 2;"></div>`) as HTMLElement;
      state = new State();
      layout = new Manager(state, {
        render: {
          renderer,
          parent: '.layout',
        }
      });

      const tx = layout.transaction();
      const p1 = tx.add({ key: 'root' });
      p1.addItem({ key: 'i1', custom: { test: true } });
      p1.addItem({ key: 'i2' });
      p1.selected = 'i1';
      tx.commit();
      await nextFrame();
    });

    it('sets the DataTransfer properties', async () => {
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="i1"]`) as HTMLElement;
      const center = middleOfElement(tab1);
      const dataTransfer = new DataTransfer();
      const dragEvent = new DragEvent('dragstart', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
      });
      tab1.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.effectAllowed, 'linkMove', 'sets dropEffect to linkMove');
      assert.equal(dataTransfer.getData('item/key'), 'i1', 'sets the item/key');
      assert.equal(dataTransfer.getData('item/source'), 'split-view', 'sets the item/source');
      assert.equal(dataTransfer.getData('item/custom'), '{"test":true}', 'sets the item/custom');
      assert.equal(dataTransfer.getData('layout/key'), 'root', 'sets the layout/key');
    });

    it('ignores when the manager is not set', async () => {
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="i1"]`) as HTMLElement;
      const center = middleOfElement(tab1);
      const dataTransfer = new DataTransfer();
      const dragEvent = new DragEvent('dragstart', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
      });
      content.manager = undefined;
      tab1.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.effectAllowed, 'uninitialized', 'does not set dropEffect');
    });

    it('ignores when the key is not set', async () => {
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="i1"]`) as HTMLElement;
      const center = middleOfElement(tab1);
      const dataTransfer = new DataTransfer();
      const dragEvent = new DragEvent('dragstart', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
      });
      content.key = undefined;
      tab1.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.effectAllowed, 'uninitialized', 'does not set dropEffect');
    });

    it('ignores when the data-key on the tab is not set', async () => {
      const content = viewRoot.querySelector(`split-view`)!;
      const tab1 = content.shadowRoot!.querySelector(`[role="tab"][data-key="i1"]`) as HTMLElement;
      const center = middleOfElement(tab1);
      const dataTransfer = new DataTransfer();
      const dragEvent = new DragEvent('dragstart', {
        composed: true,
        cancelable: true,
        bubbles: true,
        clientX: center.x,
        clientY: center.y,
        dataTransfer,
      });
      delete tab1.dataset.key;
      tab1.dispatchEvent(dragEvent);
      assert.equal(dataTransfer.effectAllowed, 'uninitialized', 'does not set dropEffect');
    });
  });

  describe('drop event', () => {
    describe('over tablist', () => {
      let state: State;
      let layout: Manager;
      let viewRoot: HTMLElement;

      beforeEach(async () => {
        viewRoot = await fixture(html`<div class="layout" style="width: 800px; height: 600px; display: flex; flex-direction: column; flex: 2;"></div>`) as HTMLElement;
        state = new State();
        layout = new Manager(state, {
          render: {
            renderer,
            parent: '.layout',
          }
        });

        const tx = layout.transaction();
        const root = tx.add({ key: 'root' });
        const p1 = root.addPanel({ key: 'p1' });
        const p2 = root.addPanel({ key: 'p2' });
        p1.addItem({ key: 'i1', custom: { panel: 1 } });
        p1.addItem({ key: 'i2' });
        p2.addItem({ key: 'i3', custom: { panel: 2 } });
        p2.addItem({ key: 'i4' });
        tx.commit();
        await nextFrame();
      });

      it('moves a tab within a panel', async () => {
        // switch tabs in positions
        const view = viewRoot.querySelector(`split-view[key="p1"]`) as SplitView;
        const tabList = view.shadowRoot!.querySelector(`[role="tablist"]`) as HTMLElement;
        const tab2 = tabList.querySelector(`[role="tab"][data-key="i2"]`) as HTMLElement;
        const center = middleOfElement(tab2);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('item/source', 'split-view');
        dataTransfer.setData('item/key', 'i1');
        dataTransfer.setData('layout/key', 'p1');
        dataTransfer.setData('item/custom', JSON.stringify(state.item('i1')!.custom));
        const dragEvent = new DragEvent('drop', {
          composed: true,
          cancelable: true,
          bubbles: true,
          clientX: center.x,
          clientY: center.y,
          dataTransfer,
        });
        tabList.dispatchEvent(dragEvent);
        const item = state.item('i1')!;
        const [parent] = item.getParents();
        assert.equal(parent.items[0].key, 'i1', 'item 1 is set');
        assert.equal(parent.items[1].key, 'i2', 'item 2 is set');
        assert.equal(parent.items[0].index, 1, 'item 1 has new index');
        assert.equal(parent.items[1].index, 0, 'item 2 has new index');
      });

      it('moves a tab within a panel with shiftKey', async () => {
        // switch tabs in positions
        const view = viewRoot.querySelector(`split-view[key="p1"]`) as SplitView;
        const tabList = view.shadowRoot!.querySelector(`[role="tablist"]`) as HTMLElement;
        const tab2 = tabList.querySelector(`[role="tab"][data-key="i2"]`) as HTMLElement;
        const center = middleOfElement(tab2);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('item/source', 'split-view');
        dataTransfer.setData('item/key', 'i1');
        dataTransfer.setData('layout/key', 'p1');
        dataTransfer.setData('item/custom', JSON.stringify(state.item('i1')!.custom));
        const dragEvent = new DragEvent('drop', {
          composed: true,
          cancelable: true,
          bubbles: true,
          clientX: center.x,
          clientY: center.y,
          dataTransfer,
          shiftKey: true,
        });
        tabList.dispatchEvent(dragEvent);
        const item = state.item('i1')!;
        const [parent] = item.getParents();
        assert.equal(parent.items[0].key, 'i1', 'item 1 is set');
        assert.equal(parent.items[1].key, 'i2', 'item 2 is set');
        assert.equal(parent.items[0].index, 1, 'item 1 has new index');
        assert.equal(parent.items[1].index, 0, 'item 2 has new index');
      });

      it('moves a tab from one panel to another', async () => {
        // moves p2.i1 to p1
        const view1 = viewRoot.querySelector(`split-view[key="p1"]`) as SplitView;
        const tabList1 = view1.shadowRoot!.querySelector(`[role="tablist"]`) as HTMLElement;
        const tab2 = tabList1.querySelector(`[role="tab"][data-key="i2"]`) as HTMLElement;
        const center = middleOfElement(tab2);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('item/source', 'split-view');
        dataTransfer.setData('item/key', 'i3');
        dataTransfer.setData('layout/key', 'p2');
        dataTransfer.setData('item/custom', JSON.stringify(state.item('i3')!.custom));
        const dragEvent = new DragEvent('drop', {
          composed: true,
          cancelable: true,
          bubbles: true,
          clientX: center.x,
          clientY: center.y,
          dataTransfer,
        });
        tabList1.dispatchEvent(dragEvent);
        const item = state.item('i3')!;
        const [parent] = item.getParents();
        assert.equal(parent.items[0].key, 'i1', 'item 1 is set');
        assert.equal(parent.items[1].key, 'i2', 'item 2 is set');
        assert.equal(parent.items[2].key, 'i3', 'item 3 is set');
        assert.equal(parent.items[0].index, 0, 'item 1 has old index');
        assert.equal(parent.items[1].index, 1, 'item 2 has old index');
        assert.equal(parent.items[2].index, 2, 'item 3 has new index');
      });

      it('links a tab from one panel to another', async () => {
        // links p2.i1 to p1
        const view1 = viewRoot.querySelector(`split-view[key="p1"]`) as SplitView;
        const tabList1 = view1.shadowRoot!.querySelector(`[role="tablist"]`) as HTMLElement;
        const tab2 = tabList1.querySelector(`[role="tab"][data-key="i2"]`) as HTMLElement;
        const center = middleOfElement(tab2);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('item/source', 'split-view');
        dataTransfer.setData('item/key', 'i3');
        dataTransfer.setData('layout/key', 'p2');
        dataTransfer.setData('item/custom', JSON.stringify(state.item('i3')!.custom));
        const dragEvent = new DragEvent('drop', {
          composed: true,
          cancelable: true,
          bubbles: true,
          clientX: center.x,
          clientY: center.y,
          dataTransfer,
          shiftKey: true,
        });
        tabList1.dispatchEvent(dragEvent);
        const item = state.item('i3')!;
        const [parent1, parent2] = item.getParents();
        assert.equal(parent1.items[0].key, 'i1', 'item 1 is set');
        assert.equal(parent1.items[1].key, 'i2', 'item 2 is set');
        assert.equal(parent1.items[2].key, 'i3', 'item 3 is set');
        assert.equal(parent1.items[0].index, 0, 'item 1 has old index');
        assert.equal(parent1.items[1].index, 1, 'item 2 has old index');
        assert.equal(parent1.items[2].index, 2, 'item 3 has new index');
        assert.equal(parent2.items[0].key, 'i3', 'item 3 is set');
        assert.equal(parent2.items[1].key, 'i4', 'item 4 is set');
        assert.equal(parent2.items[0].index, 0, 'item 3 has old index');
        assert.equal(parent2.items[1].index, 1, 'item 4 has old index');
      });

      it('creates a new item', async () => {
        const view1 = viewRoot.querySelector(`split-view[key="p1"]`) as SplitView;
        const tabList1 = view1.shadowRoot!.querySelector(`[role="tablist"]`) as HTMLElement;
        const tab2 = tabList1.querySelector(`[role="tab"][data-key="i2"]`) as HTMLElement;
        const center = middleOfElement(tab2);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('item/key', 'i5');
        dataTransfer.setData('item/custom', JSON.stringify({ external: true }));
        const dragEvent = new DragEvent('drop', {
          composed: true,
          cancelable: true,
          bubbles: true,
          clientX: center.x,
          clientY: center.y,
          dataTransfer,
          shiftKey: true,
        });
        tabList1.dispatchEvent(dragEvent);
        const item = state.item('i5')!;
        const [parent1] = item.getParents();
        assert.equal(parent1.items[0].key, 'i1', 'item 1 is set');
        assert.equal(parent1.items[1].key, 'i2', 'item 2 is set');
        assert.equal(parent1.items[2].key, 'i5', 'item 5 is set');
        assert.equal(parent1.items[0].index, 0, 'item 1 has old index');
        assert.equal(parent1.items[1].index, 1, 'item 2 has old index');
        assert.equal(parent1.items[2].index, 2, 'item 5 has new index');
        assert.deepEqual(item.custom, { external: true }, 'has the custom data');
      });
    });
  });
});

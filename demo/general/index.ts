import { html, TemplateResult } from 'lit';
import { Manager, State, SerializedState, Item, StateEvent, StateHelper, CreatedEventDetail } from '../../src/index.js';
import { TabCloseDirection } from '../../src/Enum.js';
import { DemoPage } from '../lib/DemoPage.js';
import '../../src/define/split-view.js';

const storeKey = 'tabs-layout.demo.demo1';

class ComponentDemoPage extends DemoPage {
  demoTitle = 'Demo page';

  state: State;

  layout: Manager;

  constructor() {
    super();
    const init = this.restoreValues();
    const state = new State(init);
    const layout = new Manager(state, {
      constrain: true,
      dragTypes: ['item/custom', 'item/key'],
      interactions: {
        addTab: true,
      },
    });
    this.state = state;
    this.layout = layout;
    layout.addEventListener('render', this.handlerStateChange.bind(this));
    layout.addEventListener('change', this.handlerLayoutChange.bind(this));
    layout.addEventListener('created', this.handlerStateCreated.bind(this));
    layout.connect();
  }

  restoreValues(): SerializedState | undefined {
    const data = localStorage.getItem(storeKey);
    if (!data) {
      return undefined;
    }
    try {
      return JSON.parse(data) as SerializedState;
    } catch (e) {
      // ...
    }
    return undefined;
  }

  protected async handlerLayoutChange(e: StateEvent): Promise<void> {
    const { state } = e;
    try {
      localStorage.setItem(storeKey, JSON.stringify(state));
    } catch (_) {
      // ...
    }
  }

  protected handlerStateChange(): void {
    this.render();
  }

  protected handlerStateCreated(e: CustomEvent<CreatedEventDetail>): void {
    const { item, reason } = e.detail;
    if (reason === 'user') {
      item.label = 'User item';
      return;
    }
    const custom = item.custom as { kind: string };
    if (custom.kind === 'data#itemA') {
      item.label = 'Item A';
    } else if (custom.kind === 'data#itemB') {
      item.label = 'Item B';
    } else {
      item.label = `Item ${item.key}`;
    }
  }

  protected handleDragStart(e: DragEvent): void {
    const item = e.currentTarget as HTMLElement;
    const { key, kind } = item.dataset;
    if (!key || !kind) {
      return;
    }
    const dt = e.dataTransfer as DataTransfer;
    dt.setData('item/custom', JSON.stringify({kind}));
    dt.setData('item/key', key);
    dt.effectAllowed = 'linkMove';
    console.log('drag start', key, kind);
  }

  protected handleAddItem(): void {
    const kind = 'data#item';
    const { state, layout } = this;
    let panel = state.activePanel();
    if (!panel) {
      const tx = layout.transaction();
      panel = tx.state.addPanel();
      tx.commit();
      panel = state.panel(panel.key)!;
    }
    StateHelper.createItem(layout, panel.key, { label: '', custom: { kind } });
  }

  protected handleReset(): void {
    const tx = this.layout.transaction();
    tx.reset();
    tx.commit();
  }

  protected handleClose2Left(): void {
    const tx = this.layout.transaction();
    const panel = tx.state.activePanel();
    if (!panel) {
      throw new Error(`The state has no panels.`)
    }
    if (!panel.selected) {
      throw new Error(`Nothing is selected in the panel.`);
    }
    panel.closeRelative(panel.selected, TabCloseDirection.left);
    tx.commit();
  }

  protected handleClose2Right(): void {
    const tx = this.layout.transaction();
    const panel = tx.state.activePanel();
    if (!panel) {
      throw new Error(`The state has no panels.`)
    }
    if (!panel.selected) {
      throw new Error(`Nothing is selected in the panel.`);
    }
    panel.closeRelative(panel.selected, TabCloseDirection.right);
    tx.commit();
  }

  protected handleClose(): void {
    const tx = this.layout.transaction();
    const panel = tx.state.activePanel();
    if (!panel) {
      throw new Error(`The state has no panels.`)
    }
    if (!panel.selected) {
      throw new Error(`Nothing is selected in the panel.`);
    }
    panel.removeItem(panel.selected);
    if (!panel.hasItems) {
      panel.remove();
    }
    tx.commit();
  }

  protected handleMoveLeft(): void {
    const tx = this.layout.transaction();
    const panel = tx.state.activePanel();
    if (!panel) {
      throw new Error(`The state has no panels.`)
    }
    if (!panel.selected) {
      throw new Error(`Nothing is selected in the panel.`);
    }
    let index = panel.itemIndex(panel.selected);
    if (index === -1) {
      throw new Error(`Invalid state. The items position is -1.`);
    }
    if (index === 0) {
      return;
    }
    index -= 1;
    panel.move(panel.selected, {
      index,
    });
    tx.commit();
  }

  protected handleMoveRight(): void {
    const tx = this.layout.transaction();
    const panel = tx.state.activePanel();
    if (!panel) {
      throw new Error(`The state has no panels.`)
    }
    if (!panel.selected) {
      throw new Error(`Nothing is selected in the panel.`);
    }
    let index = panel.itemIndex(panel.selected);
    if (index === -1) {
      throw new Error(`Invalid state. The items position is -1.`);
    }
    index += 1;
    if (index === panel.items.length) {
      return;
    }
    panel.move(panel.selected, {
      index,
    });
    tx.commit();
  }

  contentTemplate(): TemplateResult {
    return html`
    <a href="../">Back</a>
    <div class="demo-container">
      ${this.renderOptions()}
      <section aria-label="demo-content" class="layout-view">
        ${this.renderLayout()}
      </section>
    </div>
    `;
  }

  protected renderLayout(): TemplateResult[] {
    return this.layout.render(this.renderItem.bind(this));
  }

  protected renderItem(item: Item, visible: boolean): TemplateResult {
    const { kind } = item.custom as { kind: string };
    // id="tlc-${item.key}"
    switch (kind) {
      default: return html`
        <section 
          ?hidden="${!visible}" 
          tabindex="0"
          class="tab-content"
          data-key="${item.key}"
          role="tabpanel"
          aria-label="${item.label}"
        >Rendering: ${item.label} ${kind} ${item.key}</section>
      `;
    }
  }

  protected renderOptions(): TemplateResult {
    return html`
    <section aria-label="Demo control" class="data-control">
      <h2 class="title-medium">Data control</h2>
      
      <h3 class="title-small">Imperative API</h3>

      <h4 class="title-small">General</h4>
      <button class="outlined" @click="${this.handleReset}">Reset state</button>

      <h4 class="title-small">Current panel</h4>
      <button class="outlined" @click="${this.handleAddItem}">Add item to current</button>

      <h4 class="title-small">Current tab</h4>
      <button class="outlined" @click="${this.handleClose2Left}">Close to left</button>
      <button class="outlined" @click="${this.handleClose2Right}">Close to right</button>
      <button class="outlined" @click="${this.handleClose}">Close</button>
      
      <h4 class="title-small">Moving current tab</h4>
      <button class="outlined" @click="${this.handleMoveLeft}">Move left</button>
      <button class="outlined" @click="${this.handleMoveRight}">Move right</button>
      <form>

      </form>

      <h3 class="title-small">Declarative API</h3>
      <p>Items on the list can be dragged onto the layout.</p>
      <nav aria-label="drag and drop items">
        <ul class="draggable-items">
          <li data-kind="data#itemA" data-key="item-a" draggable="true" @dragstart="${this.handleDragStart}">Item A</li>
          <li data-kind="data#itemB" data-key="item-b" draggable="true" @dragstart="${this.handleDragStart}">Item B</li>
        </ul>
      </nav>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();

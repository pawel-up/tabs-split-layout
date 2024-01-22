/* eslint-disable lit/no-invalid-html */
/* eslint-disable lit/binding-positions */
import { TemplateResult } from "lit";
import {html, unsafeStatic} from 'lit/static-html.js';
import { classMap, ClassInfo } from "lit/directives/class-map.js";
import type { Panel } from "./Panel.js";
import type { Item } from "./Item.js";
import { PanelRenderCallback, ManagerInit } from "./type.js";
import { LayoutObjectType } from "./Enum.js";
import type { Manager } from "./Manager.js";

/**
 * A class that is responsible for rendering the layout view.
 */
export class View {
  constructor(protected readonly opts: ManagerInit) {}

  renderPanel(manager: Manager, panel: Panel, itemCallback: PanelRenderCallback): TemplateResult {
    return this.panelTemplate(manager, panel, itemCallback);
  }

  protected panelTemplate(manager: Manager, panel: Panel, itemCallback: PanelRenderCallback): TemplateResult {
    const { items, selected } = panel;
    const renderPanels = items.filter(i => i.type === LayoutObjectType.panel);
    const renderItems = items.filter(i => i.type === LayoutObjectType.item);
    const content: TemplateResult[] = [];
    if (renderPanels.length) {
      for (const item of renderPanels) {
        const targetPanel = manager.state.panel(item.key);
        if (targetPanel) {
          const tpl = this.panelTemplate(manager, targetPanel, itemCallback);
          if (tpl) {
            content.push(tpl);
          }
        }
      }
    } else {
      for (const item of renderItems) {
        const targetItem = manager.state.item(item.key);
        if (targetItem) {
          const tpl = this.itemTemplate(targetItem, targetItem.key === selected, itemCallback);
          if (tpl) {
            content.push(tpl);
          }
        }
      }
    }
    return this.renderView(manager, panel, content);
  }

  protected renderView(manager: Manager, panel: Panel, content: TemplateResult[]): TemplateResult {
    const { currentPanel } = manager.state;
    const classes: ClassInfo = {
      'split-view': true,
      active: currentPanel === panel.key,
    };  
    const { viewName = 'split-view' } = this.opts;
    return html`
    <${unsafeStatic(viewName)}
      .key="${panel.key}"
      .manager="${manager}"
      .direction="${panel.direction}"
      .dragTypes="${this.opts.dragTypes}" 
      .interactions="${this.opts.interactions}" 
      ?constrain="${this.opts.constrain}"
      class="${classMap(classes)}"
    >${content}</${unsafeStatic(viewName)}>
    `;
  }

  protected itemTemplate(item: Item, visible: boolean, itemCallback: PanelRenderCallback): TemplateResult | undefined {
    return itemCallback(item, visible);
  }
}

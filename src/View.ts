import { TemplateResult, html } from "lit";
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
    const { currentPanel } = manager.state;
    const classes: ClassInfo = {
      'split-view': true,
      active: currentPanel === panel.key,
    };

    return html`
    <split-view 
      .key="${panel.key}"
      .manager="${manager}"
      .direction="${panel.direction}"
      .dragTypes="${this.opts.dragTypes}" 
      ?constrain="${this.opts.constrain}"
      class="${classMap(classes)}"
    >${content}</split-view>
    `;
  }

  protected itemTemplate(item: Item, visible: boolean, itemCallback: PanelRenderCallback): TemplateResult | undefined {
    return itemCallback(item, visible);
  }
}

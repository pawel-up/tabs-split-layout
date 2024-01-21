import { css } from 'lit';

export default [css`
:host {
  display: flex;
  position: relative;
  flex-direction: column;
  flex: 1;

  --_tablist-background-color: var(--tabs-split-layout-tablist-background-color, #ECEFF1);
  --_tab-border-radius: var(--tabs-split-layout-tab-corner, 8px 8px 0 0);

  --_tab-color: var(--tabs-split-layout-tab-color, #1C1B1F);
  --_tab-color-hover: var(--tabs-split-layout-tab-color-hover, #1C1B1F);
  --_tab-color-focus: var(--tabs-split-layout-tab-color-focus, #1C1B1F);
  --_tab-color-selected: var(--tabs-split-layout-tab-color-selected, #1C1B1F);

  --_tab-background-color: var(--tabs-split-layout-tab-background-color, transparent);
  --_tab-background-color-hover: var(--tabs-split-layout-tab-background-color-hover, rgb(0 0 0 / 8%));
  --_tab-background-color-focus: var(--tabs-split-layout-tab-background-color-focus, rgb(0 0 0 / 10%));
  --_tab-background-color-selected: var(--tabs-split-layout-tab-background-color-selected, rgb(255 255 255 / 71%));

  --_tab-outline: none;
  --_tab-outline-color: var(--tabs-split-layout-tab-outline-color, #000);

  --_close-icon-background: var(--tabs-split-layout-tab-close-background, transparent);
  --_close-icon-background-hover: var(--tabs-split-layout-tab-close-hover-background, #CAC4D0);
  --_close-icon-color: var(--tabs-split-layout-tab-close-color, currentColor);
  --_close-icon-color-hover: var(--tabs-split-layout-tab-close-hover-color, currentColor);

  --_add-icon-background: var(--tabs-split-layout-tab-add-background, transparent);
  --_add-icon-background-hover: var(--tabs-split-layout-tab-add-hover-background, #CAC4D0);
  --_add-icon-color: var(--tabs-split-layout-tab-add-color, currentColor);
  --_add-icon-color-hover: var(--tabs-split-layout-tab-add-hover-color, currentColor);

  --_divider-color: var(--tabs-split-layout-tab-divider-color, #CAC4D0);

  --_drag-region-background: var(--tabs-split-layout-drag-region-background-color, #000000);
  --_drag-region-opacity: var(--tabs-split-layout-drag-region-opacity, 0.16);

  --_drop_zone-margin: 75%;
}

.content {
  display: flex;
  flex: 1;
}

:host([constrain]) .content {
  overflow: hidden;
}

:host([direction=horizontal]) .content {
  flex-direction: row;
}

:host([direction=vertical]) .content {
  flex-direction: column;
}

:host ::slotted(*) {
  flex: 1;
}

.constrain ::slotted(*) {
  overflow: hidden;
}

.layout-tabs {
  display: flex;
  align-items: center;
  background-color: var(--_tablist-background-color);
}

.layout-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 1 1 200px;
  max-width: 200px;
  min-width: 40px;
  width: 200px;
  height: 100%;
  font-size: 0.94rem;
  padding: 0px 12px;
  height: 40px; 
  outline: var(--_tab-outline);
  outline-offset: -2px;
  justify-content: flex-start;
  text-transform: none;
  border-radius: var(--_tab-border-radius);
  color: var(--_tab-color);
  background-color: var(--_tab-background-color);
}

.layout-tab:hover {
  --_tab-background-color: var(--_tab-background-color-hover);
  --_tab-color: var(--_tab-color-hover);
}

.layout-tab:focus {
  --_tab-background-color: var(--_tab-background-color-focus);
  --_tab-color: var(--_tab-color-focus);
  --_tab-outline: 2px var(--_tab-outline-color) solid;
}

.layout-tab.selected {
  --_tab-background-color: var(--_tab-background-color-selected);
  --_tab-color: var(--_tab-color-selected);
}

.tab-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.is-dirty .tab-label {
  font-style: italic;
}

.is-dirty .tab-label::after {
  content: '*';
  user-select: none;
}

.tab-favicon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.close-icon.icon {
  width: 16px;
  height: 16px;
  min-width: 16px;
  margin-left: auto;
  z-index: 2;
  background-color: var(--_close-icon-background);
  color: var(--_close-icon-color);
}

.close-icon:hover {
  background-color: var(--_close-icon-background-hover);
  color: var(--_close-icon-color-hover);
  border-radius: 50%;
}

.tab-divider {
  width: 1px;
  min-width: 1px;
  height: 20px;
  background-color: var(--_divider-color);
}

.tab-divider.hidden {
  background-color: transparent;
}

.drag-region {
  position: absolute;
  inset: 0;
  z-index: 10;
  border-radius: 12px;
}

.drag-region::before {
  content: '';
  background-color: var(--_drag-region-background);
  opacity: var(--_drag-region-opacity);
  inset: 0;
  z-index: 10;
  position: absolute;
  border-radius: inherit;
}

.drag-region.west {
  right: var(--_drop_zone-margin);
}

.drag-region.east {
  left: var(--_drop_zone-margin);
}

.drag-region.north {
  bottom: var(--_drop_zone-margin);
}

.drag-region.south {
  top: var(--_drop_zone-margin);
}

.icon-button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  appearance: none;
  background-color: transparent;
  border: none;
}

.add-button {
  margin-left: 4px;
  background-color: var(--_add-icon-background);
  color: var(--_add-icon-color);
  border-radius: 50%;
  outline: var(--_tab-outline);
  outline-offset: -2px;
}

.add-button:focus {
  --_tab-outline: 2px var(--_tab-outline-color) solid;
}

.add-button:hover {
  background-color: var(--_add-icon-background-hover);
  color: var(--_add-icon-color-hover);
}
`];

import { customElement } from "lit/decorators.js";
import Element from "../SplitView.js";
import styles from "../SplitView.styles.js";

@customElement('split-view')
export class SplitViewElement extends Element {
  static override styles = [styles];
}

declare global {
  interface HTMLElementTagNameMap {
    'split-view': Element;
  }
}

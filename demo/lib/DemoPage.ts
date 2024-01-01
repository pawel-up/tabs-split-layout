import { TemplateResult, html, render } from "lit";

export abstract class DemoPage {
  demoTitle?: string;

  render(): void {
    const root = document.querySelector('#app') as HTMLElement;
    render(this.pageTemplate(), root, {  host: this, });
  }

  pageTemplate(): TemplateResult {
    return html`
    ${this.headerTemplate()}
    <main>
      ${this.contentTemplate()}
    </main>`;
  }

  /**
   * Call this on the top of the `render()` method to render demo navigation
   * @returns HTML template for demo header
   */
  headerTemplate(): TemplateResult {
    const { demoTitle } = this;
    return html`
    <header>
      ${demoTitle ? html`<h1 class="demo-title">${demoTitle}</h1>` : ''}
    </header>`;
  }

  abstract contentTemplate(): TemplateResult;
}

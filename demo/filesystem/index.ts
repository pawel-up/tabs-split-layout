import { classMap, ClassInfo } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { get, set } from 'idb-keyval';
import { DemoPage } from "../lib/DemoPage.js";
import reactive from '../lib/reactive.js';
import { Item, Manager, State, StateEvent, StateHelper, TemplateResult, html, nothing } from "../../src/index.js";
import '../../src/define/split-view.js';
import { BinaryFileContent, FileToContent, ImageFileContent, RecognizedFileContent, TextFileContent, UnknownFileContent } from "./lib/FileToContent.js";

interface FileSystemNavigation {
  name: string;
  path: string;
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  type: 'file' | 'directory';
  children: FileSystemNavigation[];
  opened: boolean;
  working?: boolean;
}

function fsSort(a: FileSystemNavigation, b: FileSystemNavigation): number {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name);
  }
  if (a.type === 'directory') {
    return -1;
  }
  return 1;
}

const lastDirectoryKey = 'demo.fs.las-file-handle';

interface InitializingState {
  type: 'initializing';
}

interface RestoringHandleState {
  type: 'restoring-handle';
  handle: FileSystemDirectoryHandle;
}

interface EmptyState {
  type: 'empty';
}

interface SelectedDirectoryState {
  type: 'directory';
  handle: FileSystemDirectoryHandle;
  fileSystem: FileSystemNavigation[];
}

type CurrentState = RestoringHandleState | EmptyState | SelectedDirectoryState | InitializingState;

class ComponentDemoPage extends DemoPage {
  demoTitle = 'Filesystem demo';

  @reactive()
  state: CurrentState = {
    type: 'initializing',
  };

  @reactive()
  readingDirectory = false;

  layoutState: State;

  layout: Manager;

  openedFiles = new Map<string, RecognizedFileContent>();

  currentLayoutKey?: string;

  constructor() {
    super();
    const state = new State();
    const layout = new Manager(state, {
      constrain: true,
    });
    this.layoutState = state;
    this.layout = layout;
    layout.addEventListener('render', this.handlerStateChange.bind(this));
    layout.addEventListener('change', this.handlerLayoutChange.bind(this));
    layout.connect();
  }

  protected handlerStateChange(): void {
    this.render();
  }

  protected async handlerLayoutChange(e: StateEvent): Promise<void> {
    const { currentLayoutKey } = this;
    if (!currentLayoutKey) {
      return;
    }
    const { state } = e;
    await set(currentLayoutKey, state.toJSON());
  }

  async initialize(): Promise<void> {
    await this.restoreDirectory();
    this.render();
  }

  async createDirectoryState(handle: FileSystemDirectoryHandle): Promise<void> {
    const { name } = handle;
    this.currentLayoutKey = `layout-${name}`;
    const fileSystem = await this.setupFilesystem(handle);
    this.state = {
      type: 'directory',
      handle,
      fileSystem,
    };
    const state = await get(this.currentLayoutKey);
    if (state) {
      this.layoutState.new(state);
      for (const item of this.layoutState.itemsIterator()) {
        // eslint-disable-next-line no-await-in-loop
        await this.restoreItemData(item);
      }
      this.layoutState.notifyRender();
    } else {
      const tx = this.layoutState.transaction();
      tx.reset();
      tx.commit();
    }
  }

  async restoreItemData(layoutItem: Item): Promise<void> {
    const item = this.findFilesystemItem(layoutItem.key);
    if (!item) {
      return;
    }
    const handle = item.handle as FileSystemFileHandle;
    const file = await handle.getFile();
    if (!this.openedFiles.has(item.path)) {
      const info = await FileToContent.getInfo(file);
      this.openedFiles.set(item.path, info);
    }
  }

  async restoreDirectory(): Promise<void> {
    const handle = await get(lastDirectoryKey) as FileSystemDirectoryHandle | undefined;
    if (!handle) {
      this.state = {
        type: 'empty',
      };
      return;
    }
    // check whether the user already granted the permission and the permission is still active.
    const options: FileSystemHandlePermissionDescriptor = {
      mode: 'read',
    };
    const state = await handle.queryPermission(options);
    if (state === 'denied') {
      this.state = {
        type: 'empty',
      };
    } else if (state === 'prompt') {
      this.state = {
        type: 'restoring-handle',
        handle,
      };
    } else {
      await this.createDirectoryState(handle);
    }
  }

  async verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = {
      mode: 'read',
    };
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }

  async handleRestoreDirectory(): Promise<void> {
    const state = this.state as RestoringHandleState;
    const result = await this.verifyPermission(state.handle);
    if (result === true) {
      await this.createDirectoryState(state.handle);
    } else {
      this.state = {
        type: 'empty',
      };
    }
  }

  async setupFilesystem(handle: FileSystemDirectoryHandle, parent = '/'): Promise<FileSystemNavigation[]> {
    const result: FileSystemNavigation[] = [];
    for await (const [key, value] of handle.entries()) {
      result.push({
        children: [],
        handle: value,
        name: key,
        type: value.kind,
        opened: false,
        path: `${parent}${value.name}`,
      });
    }
    result.sort(fsSort);
    return result;
  }

  async setupDirectory(): Promise<void> {
    this.readingDirectory = true;
    let handle: FileSystemDirectoryHandle | undefined;
    try {
      handle = await window.showDirectoryPicker({ 
        mode: 'read', 
        // startIn: 'documents',
        id: 'demo',
      });
    } catch (e) {
      // 
    }
    if (!handle) {
      this.readingDirectory = false;
      return;
    }
    await set(lastDirectoryKey, handle);
    await this.createDirectoryState(handle);
    this.readingDirectory = false;
  }

  handleDirectoryDblClick(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const { path } = node.dataset;
    if (!path) {
      return;
    }
    this.toggleDirectory(path);
  }

  handleDirectoryToggleClick(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const parent = node.parentElement as HTMLElement;
    const { path } = parent.dataset;
    if (!path) {
      return;
    }
    e.preventDefault();
    this.toggleDirectory(path);
  }

  async toggleDirectory(path: string): Promise<void> {
    const item = this.findFilesystemItem(path);
    if (!item) {
      return;
    }
    item.opened = !item.opened;
    if (item.opened && !item.children.length) {
      item.working = true;
      this.render();
      item.children = await this.setupFilesystem(item.handle as FileSystemDirectoryHandle, `${path}/`);
      item.working = false;
    }
    this.render();
  }

  findFilesystemItem(path: string): FileSystemNavigation | null {
    const state = this.state as SelectedDirectoryState;
    const { fileSystem } = state;
    let current  = fileSystem;
    let selected: FileSystemNavigation | null = null;
    const parts = path.split('/');
    parts.shift(); // removes the initial "/"
    if (parts[parts.length - 1] === '/') {
      parts.pop();
    }
    while (parts.length) {
      const name = parts.shift();
      if (!name) {
        return null;
      }
      const item = current.find(i => i.name === name);
      if (!item) {
        return null;
      }
      current = item.children;
      selected = item;
    }
    return selected;
  }

  handleFileOpen(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const { path } = node.dataset;
    if (!path) {
      return;
    }
    this.openFile(path);
  }

  async openFile(path: string): Promise<void> {
    const item = this.findFilesystemItem(path);
    if (!item) {
      return;
    }
    const handle = item.handle as FileSystemFileHandle;
    const file = await handle.getFile();
    await this.appendFile(file, item);
  }

  async appendFile(file: File, item: FileSystemNavigation): Promise<void> {
    const { layoutState } = this;
    let panel = layoutState.activePanel();
    if (!panel) {
      const tx = layoutState.transaction();
      panel = tx.state.addPanel();
      tx.commit();
      panel = layoutState.panel(panel.key)!;
    }
    if (!this.openedFiles.has(item.path)) {
      const info = await FileToContent.getInfo(file);
      this.openedFiles.set(item.path, info);
    }
    StateHelper.createItem(layoutState, panel.key, { key: item.path, label: file.name });
  }

  contentTemplate(): TemplateResult {
    const { state } = this;
    let content: TemplateResult;
    switch (state.type) {
      case 'initializing': content = this.renderInitializingState(); break;
      case 'restoring-handle': content = this.renderRestoringHandleState(); break;
      case 'directory': content = this.renderDirectoryState(); break;
      default: content = this.renderEmptyState();
    }
    return html`
      <a href="../">Back</a>
      <div class="demo-container">
        ${content}
      </div>
    `;
  }

  renderInitializingState(): TemplateResult {
    return html`INIT`;
  }

  /**
   * State when the directory handle was previously stored
   * in the IDB, but, after restoring, we don't have permission to the file.
   */
  renderRestoringHandleState(): TemplateResult {
    const state = this.state as RestoringHandleState;
    const { handle } = state;
    return html`
    <div class="monit">
      <div class="content">
        <p>Would you like to use the previously selected directory <b>${handle.name}</b>?</p>
        <div class="action-buttons">
          <button class="filled" @click="${this.handleRestoreDirectory}">Use the last directory</button>
          <button class="outlined" @click="${this.setupDirectory}">Pick new directory</button>
        </div>
      </div>
    </div>
    `;
  }

  renderDirectoryState(): TemplateResult {
    const state = this.state as SelectedDirectoryState;
    const { fileSystem, handle } = state;
    const entries = this.renderFileEntries(fileSystem);
    return html`
    <section class="file-browser">
      <div class="fs-header">
        <span class="">${handle.name}</span>
        <button class="outlined" @click="${this.setupDirectory}">Change</button>
      </div>
      <div id="files" class="directory-tree" 
        role="tree" 
        aria-label="Files Explorer" 
        aria-multiselectable="true"
      >
        ${entries}
      </div>
    </section>
    <section aria-label="demo-content" class="layout-view">
      ${this.renderLayout()}
    </section>
    `;
  }

  renderEmptyState(): TemplateResult {
    return html`EMPTY`;
  }

  renderDirectoryRequest(): TemplateResult {
    return html`
    <div class="dir-request">
      <p>Drop a directory here or</p> 
      <button @click="${this.setupDirectory}">pick a directory</button>
    </div>
    `;
  }

  renderFileEntries(fileSystem: FileSystemNavigation[], level = 1): TemplateResult[] {
    return fileSystem.map(item => this.renderFsEntry(item, level));
  }

  renderFsEntry(item: FileSystemNavigation, level = 1): TemplateResult {
    if (item.type === 'directory') {
      return this.renderDirectory(item, level);
    }
    return this.renderFile(item, level);
  }

  renderDirectory(item: FileSystemNavigation, level = 1): TemplateResult {
    const { opened, name, path } = item;
    const classes: ClassInfo = {
      'fs-entry': true,
      directory: true,
      opened,
    };
    let content: TemplateResult[] | typeof nothing;
    if (opened) {
      content = this.renderFileEntries(item.children, level + 1);
    } else {
      content = nothing
    }
    const padding = 4 + level * 8;
    return html`
    <div 
      class="${classMap(classes)}" 
      role="treeitem" 
      aria-selected="false" 
      aria-label="${name}" 
      aria-level="${level}"
      aria-expanded="${opened ? 'true' : 'false'}"
      data-path="${path}"
      style="${styleMap({ paddingLeft: `${padding}px` })}"
      @dblclick="${this.handleDirectoryDblClick}"
    >
      <button class="icon-button text material-symbols-outlined dir-toggle" @click="${this.handleDirectoryToggleClick}">chevron_right</button>
      <span class="material-symbols-outlined">folder</span>
      <span class="label">${name}</span>
    </div>
    ${content}
    `;
  }

  renderFile(item: FileSystemNavigation, level = 1): TemplateResult {
    const padding = 12 + level * 8;
    return html`
    <div 
      class="fs-entry file" 
      role="treeitem" 
      aria-selected="false" 
      aria-label="${item.name}" 
      aria-level="${level}"
      style="${styleMap({ paddingLeft: `${padding}px` })}"
      data-path="${item.path}"
      @dblclick="${this.handleFileOpen}"
    >
      <span class="material-symbols-outlined">draft</span>
      <span class="label">${item.name}</span>
    </div>
    `;
  }

  renderDirectoryLoader(): TemplateResult {
    return html`
    <p class="info">Reading directory</p>
    `;
  }

  protected renderLayout(): TemplateResult[] {
    return this.layout.render(this.renderLayoutItem.bind(this));
  }

  protected renderLayoutItem(item: Item, visible: boolean): TemplateResult {
    const info = this.openedFiles.get(item.key);
    if (!info) {
      return this.renderMissingOpenedFile(item, visible);
    }
    let content: TemplateResult;
    switch (info.type) {
      case 'image': content = this.renderImageFile(info as ImageFileContent); break;
      case 'binary': content = this.renderBinaryFile(info as BinaryFileContent); break;
      case 'text': 
      case 'svg': 
        content = this.renderTextFile(info as TextFileContent); 
        break;
      default: content = this.renderUnknownFile(info as UnknownFileContent);
    }
    return this.renderTabContentWrapper(item, visible, content);
  }

  protected renderMissingOpenedFile(item: Item, visible: boolean): TemplateResult {
    return this.renderTabContentWrapper(item, visible, html`
      <p>File ${item.key} is no longer available.</p>
    `);
  }

  protected renderUnknownFile(info: UnknownFileContent): TemplateResult {
    return html`
    <div>
      <p>The file ${info.file.name} is not supported.</p>
      <p>It has size of ${info.file.size} bytes.</p>
    </div>
    `;
  }

  protected renderTextFile(info: TextFileContent): TemplateResult {
    return html`
    <pre class="text-file"><code>${info.value}</code></pre>
    `;
  }

  protected renderImageFile(info: ImageFileContent): TemplateResult {
    return html`
    <img src="${info.value}" alt="read value of the file"/>
    `;
  }

  protected renderBinaryFile(info: BinaryFileContent): TemplateResult {
    return html`
    <div>
      <p>The file is a binary file. Unable to open such file.</p>
      <p>It has size of ${info.file.size} bytes.</p>
    </div>
    `;
  }

  protected renderTabContentWrapper(item: Item, visible: boolean, content: TemplateResult): TemplateResult {
    return html`
    <section 
      ?hidden="${!visible}" 
      tabindex="0"
      class="tab-content"
      data-key="${item.key}"
      role="tabpanel"
      aria-label="${item.label}"
    >
      ${content}
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.initialize();

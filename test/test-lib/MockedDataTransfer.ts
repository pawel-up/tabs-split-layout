class DataTransferItemImpl implements DataTransferItem {
  kind: 'string' | 'file';

  type: string;

  value: File | string

  constructor(kind: 'string' | 'file', type: string, value: File | string) {
    this.kind = kind;
    this.type = type;
    this.value = value;
  }
  
  getAsFile(): File | null {
    if (this.kind === 'file') {
      return this.value as File;
    }
    return null;
  }

  getAsString(callback: FunctionStringCallback | null): void {
    const result = this.kind === 'string' ? this.value as string : '';
    callback && callback(result);
  }

  webkitGetAsEntry(): FileSystemEntry | null {
    throw new Error("Method not implemented.");
  }

  getAsFileSystemHandle(): Promise<FileSystemHandle | null> {
    throw new Error("Method not implemented.");
  }
}

class DataTransferItemListImpl extends Array<DataTransferItemImpl> implements DataTransferItemList {
  add(data: string, type: string): DataTransferItemImpl | null;

  add(data: File): DataTransferItemImpl | null;

  add(data: string | File, type?: string): DataTransferItemImpl | null {
    const isString = typeof data === 'string';
    const kind = isString ? 'string' : 'file';
    let effectiveType = type;
    if (!isString && !effectiveType) {
      effectiveType = (data as File).type;
    }
    const item = new DataTransferItemImpl(kind, effectiveType!, data);
    this.push(item);
    return item;
  }

  clear(): void {
    this.splice(0, this.length);
  }

  remove(index: number): void {
    this.splice(index, 1);
  }
}

class DataTransferImpl implements DataTransfer {
  
  dropEffect: "none" | "copy" | "link" | "move" = 'none';

  effectAllowed: "none" | "copy" | "copyLink" | "copyMove" | "link" | "linkMove" | "move" | "all" | "uninitialized" = 'uninitialized';

  // this is not used in the app
  readonly files: FileList;

  items: DataTransferItemListImpl = new DataTransferItemListImpl();

  #types: string[] = [];

  get types(): readonly string[]  {
    return this.#types;
  }

  clearData(format?: string | undefined): void {
    if (!format) {
      this.items.clear();
    } else {
      const { items } = this;
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.type === format) {
          items.remove(i);
        }
      }
    }
  }

  getData(format: string): string {
    const item = this.items.find(i => i.type === format);
    if (!item) {
      return '';
    }
    if (item.kind === 'file') {
      return '';
    }
    return item.value as string;
  }

  setData(format: string, data: string): void {
    this.#types.push(format);
    this.items.add(data, format);
  }

  setDragImage(image: Element, x: number, y: number): void {
    this.draggedImage = {
      image,
      x,
      y,
    }
  }

  draggedImage?: { image: Element, x: number, y: number };
}

class DragEventImpl extends MouseEvent implements DragEvent {
  #dataTransfer: DataTransferImpl | null = null;

  get dataTransfer(): DataTransferImpl | null {
    return this.#dataTransfer;
  }

  constructor(type: string, eventInitDict: DragEventInit = {}) {
    super(type, eventInitDict);
    if (eventInitDict.dataTransfer) {
      // @ts-ignore
      this.#dataTransfer = eventInitDict.dataTransfer;
    }
  }
}

export {
  DataTransferImpl as DataTransfer,
  DragEventImpl as DragEvent,
};


export interface FileContent {
  file: File;
}

export interface TextFileContent extends FileContent {
  type: 'text';
  value: string;
}

export interface BinaryFileContent extends FileContent {
  type: 'binary';
  value: ArrayBuffer;
}

export interface ImageFileContent extends FileContent {
  type: 'image';
  value: string;
}

export interface SvgFileContent extends FileContent {
  type: 'svg';
  value: string;
}

export interface UnknownFileContent extends FileContent {
  type: 'unknown';
  value: ArrayBuffer;
}

export type RecognizedFileContent = TextFileContent | BinaryFileContent | ImageFileContent | SvgFileContent | UnknownFileContent;

export class FileToContent {
  static async getInfo(file: File): Promise<RecognizedFileContent> {
    const { type, name } = file;
    if (type) {
      return this.getInfoType(type, file);
    }
    return this.getInfoName(name, file);
  }

  private static async getInfoType(type: string, file: File): Promise<RecognizedFileContent> {
    switch (type) {
      case 'image/svg+xml': return this.createSvg(file);
      case 'image/png': return this.createImage(file);
      case 'text/css':
      case 'application/json':
      case 'text/javascript':
      case 'text/html':
      case 'text/x-sh':
      case 'text/xml':
      case 'text/plain':
      case 'application/x-x509-ca-cert':
      case 'application/postscript':
          return this.createText(file);
      case 'application/zip':
          return this.createBinary(file);
      default: return this.createUnknown(file);
    }
  }

  private static async getInfoName(type: string, file: File): Promise<RecognizedFileContent> {
    const index = type.lastIndexOf('.');
    if (index === -1) {
      return this.createUnknown(file);
    }
    const ext = type.substring(index + 1);
    if (ext.endsWith('rc')) {
      return this.createText(file);
    }
    switch (ext) {
      case 'png': 
        return this.createImage(file);
      case 'zip':
      case 'psd':
        return this.createBinary(file);
      case 'json':
      case 'jsonld':
      case 'md':
      case 'ts':
      case 'sample':
      case 'raml':
      case 'yaml':
      case 'cmd':
      case 'sh':
      case 'editorconfig':
      case 'gitignore':
      case 'eslintrc':
      case 'mjs':
      case 'info':
      case 'xsd':
      case 'crt':
      case 'csr':
      case 'key':
      case 'pem':
      case 'css':
      case 'java':
      case 'txt':
        return this.createText(file);
      default: return this.createUnknown(file);
    }
  }

  private static async createSvg(file: File): Promise<SvgFileContent> {
    const text = await file.text();
    const result: SvgFileContent = {
      file,
      type: 'svg',
      value: text,
    };
    return result;
  }

  private static async createUnknown(file: File): Promise<UnknownFileContent> {
    const value = await file.arrayBuffer();
    const result: UnknownFileContent = {
      file,
      type: 'unknown',
      value,
    };
    return result;
  }

  private static async createImage(file: File): Promise<ImageFileContent> {
    const value = await this.toDataUrl(file);
    const result: ImageFileContent = {
      file,
      type: 'image',
      value,
    };
    return result;
  }

  private static async createText(file: File): Promise<TextFileContent> {
    const value = await file.text();
    const result: TextFileContent = {
      file,
      type: 'text',
      value,
    };
    return result;
  }

  private static async createBinary(file: File): Promise<BinaryFileContent> {
    const value = await file.arrayBuffer();
    const result: BinaryFileContent = {
      file,
      type: 'binary',
      value,
    };
    return result;
  }

  private static toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        resolve(reader.result as string);
      });
      reader.addEventListener('error', () => {
        reject(new Error(`Unable to read image data: ${file.name}`));
      });
      reader.readAsDataURL(file);
    });
  }
}

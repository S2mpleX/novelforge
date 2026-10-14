declare module 'mammoth' {
  export interface MammothMessage {
    type: 'warning' | 'error';
    message: string;
  }

  export interface ConversionResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: any;
    path?: string;
    styleMap?: string[] | string;
    includeDefaultStyleMap?: boolean;
  }

  export function convertToHtml(input: MammothOptions): Promise<ConversionResult>;
  export function extractRawText(input: MammothOptions): Promise<ConversionResult>;
}

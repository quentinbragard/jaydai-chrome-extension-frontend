export interface Block {
  id: number;
  type: string;
  content: string;
  title?: Record<string, string>;
}

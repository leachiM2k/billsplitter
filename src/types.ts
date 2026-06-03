export interface ReceiptItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Receipt {
  storeName: string;
  items: ReceiptItem[];
  subtotal: number;
  tip: number;
  total: number;
}

export interface Person {
  id: string;
  name: string;
}

// key: `${itemId}:${unitIndex}` → personId (or '' for unassigned)
export type ItemAssignments = Record<string, string>;

export type SplitMode = 'items' | 'percentage';

export type AppStep = 'upload' | 'review' | 'people' | 'assign' | 'summary';

export interface AppState {
  step: AppStep;
  imageDataUrl: string | null;
  receipt: Receipt | null;
  people: Person[];
  splitMode: SplitMode;
  assignments: ItemAssignments;
  percentages: Record<string, number>;
}

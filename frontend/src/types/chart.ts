export interface ChartOption {
  id: string;
  label: string;
  description?: string;
  multiplier?: Record<string, number>;
}

export interface MultiSelectQuestion {
  id: string;
  question: string;
  type: "single_select" | "multi_select";
  options: ChartOption[];
}

export interface ChartQuestion {
  id: string;
  type: "single_select" | "single_select_by_category" | "multi_input";
  question?: string;
  options?: ChartOption[];
  options_by_category?: Record<string, ChartOption[]>;
  questions?: MultiSelectQuestion[];
}

export interface ChartData {
  version: string;
  questions: ChartQuestion[];
}

export interface Q3Selections {
  complexity: string;
  priority: string[];
  context_amount: string;
}

export interface DiagnoseSelections {
  q1?: string;
  q2?: string;
  q3?: Q3Selections;
}

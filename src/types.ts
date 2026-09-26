
export interface Installment {
  id: string;
  type: string;
  quantity: number;
  value: number;
  startDate: string; // YYYY-MM-DD format
  isFinancing: boolean;
}

export interface ScheduleItem {
  installmentNumber: string;
  type: string;
  paymentDate: string; // Formatted date
  value: number;
}

export interface ProposalInfo {
  project: string;
  clientName: string;
  unit: string;
  unitType: string;
  floor: string;
  area: number;
}

export type ExportFormat = 'pdf' | 'xlsx' | 'csv';

export interface SavedProposal {
  proposalInfo: ProposalInfo;
  proposedValue: number;
  installments: Installment[];
  interestRate: number;
  term: number;
}

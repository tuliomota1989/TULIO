
import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import type { ScheduleItem, ProposalInfo, Installment } from '../types';
import { exportToPDF, exportToXLSX, exportToCSV } from '../utils/export';
import { formatCurrency } from '../utils/formatting';

const getDatesSummary = (inst: Installment): string => {
  if (!inst.startDate) return '';
  try {
    const start = new Date(inst.startDate.replace(/-/g, '/'));
    
    // For "Anual" with 2 installments, show both dates.
    if (inst.type.toLowerCase() === 'anual' && inst.quantity === 2) {
      const end = addMonths(start, 12);
      return `${format(start, 'MM/yyyy')} e ${format(end, 'MM/yyyy')}`;
    }

    // For all other cases, show the start date.
    return format(start, 'MM/yyyy');

  } catch (e) {
    console.error("Invalid date:", inst.startDate);
    return 'Data inválida';
  }
};

interface ResultsProps {
  totalPaid: number;
  schedule: ScheduleItem[];
  proposalInfo: ProposalInfo;
  proposedValue: number;
  installments: Installment[];
}

const Results: React.FC<ResultsProps> = ({ totalPaid, schedule, proposalInfo, proposedValue, installments }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: 'pdf' | 'xlsx' | 'csv') => {
    const exportData = { schedule, proposalInfo, proposedValue };
    if (format === 'pdf') exportToPDF(exportData);
    if (format === 'xlsx') exportToXLSX(exportData);
    if (format === 'csv') exportToCSV(exportData);
    setIsExportMenuOpen(false);
  };
  
  return (
    <>
      <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="card-title text-xl font-semibold mb-5 text-gray-800">Resumo do Fluxo</h2>
        <div className="space-y-2 text-gray-700 font-mono text-sm md:text-base">
            {installments.map(inst => (
            <p key={inst.id}>
                <span className="font-semibold">{inst.type}{inst.quantity > 1 && !inst.isFinancing ? ` (${inst.quantity})` : ''}:</span>
                {inst.isFinancing ? (
                ` ${formatCurrency(inst.value * inst.quantity)}`
                ) : (
                ` ${inst.quantity}× ${formatCurrency(inst.value)}`
                )}
                {' — '}
                {getDatesSummary(inst)}
            </p>
            ))}
            <div className="pt-3 mt-3 border-t">
              <p className="font-bold text-lg text-gray-800">
                  Valor total do fluxo: {formatCurrency(totalPaid)}
              </p>
            </div>
        </div>
      </div>

      <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
          <h2 className="card-title text-xl font-semibold text-gray-800 m-0 text-center md:text-left">Cronograma de Pagamentos</h2>
          <div className="relative" ref={exportMenuRef}>
            <button className="export-btn w-full bg-green-700 text-white rounded-lg px-6 py-3 text-base font-semibold cursor-pointer transition-colors hover:bg-green-800" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
              Exportar
            </button>
            {isExportMenuOpen && (
              <div className="export-menu absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                <div className="export-option p-3 hover:bg-gray-100 cursor-pointer" onClick={() => handleExport('pdf')}>Exportar PDF</div>
                <div className="export-option p-3 hover:bg-gray-100 cursor-pointer" onClick={() => handleExport('xlsx')}>Exportar Excel</div>
                <div className="export-option p-3 hover:bg-gray-100 cursor-pointer" onClick={() => handleExport('csv')}>Exportar CSV</div>
              </div>
            )}
          </div>
        </div>
        <div className="table-wrapper overflow-x-auto">
          <table className="cronograma-table w-full border-collapse mt-4 min-w-[600px]">
            <thead>
              <tr>
                <th className="p-3 text-left border-b border-gray-200 bg-gray-100 font-semibold text-gray-700">Parcela</th>
                <th className="p-3 text-left border-b border-gray-200 bg-gray-100 font-semibold text-gray-700">Tipo</th>
                <th className="p-3 text-left border-b border-gray-200 bg-gray-100 font-semibold text-gray-700">Data de Pagamento</th>
                <th className="p-3 text-left border-b border-gray-200 bg-gray-100 font-semibold text-gray-700">Valor</th>
              </tr>
            </thead>
            <tbody>
              {schedule.length > 0 ? schedule.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 text-left border-b border-gray-200">{item.installmentNumber}</td>
                  <td className="p-3 text-left border-b border-gray-200">{item.type}</td>
                  <td className="p-3 text-left border-b border-gray-200">{item.paymentDate}</td>
                  <td className="p-3 text-left border-b border-gray-200">{formatCurrency(item.value)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 border-b border-gray-200">
                    Nenhum cronograma para exibir. Adicione parcelas para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Results;
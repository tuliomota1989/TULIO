import React from 'react';
import { formatCurrency } from '../utils/formatting';

const InfoInput: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; type?: string; suffix?: string }> = ({ label, value, onChange, placeholder, type = 'text', suffix }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1.5 text-gray-700">{label}</label>
    <div className="relative">
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className="px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-blue-500 w-full" 
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
    </div>
  </div>
);

const ResultDisplay: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="text-center p-4 bg-gray-100 rounded-lg h-full flex flex-col justify-center">
    <div className="text-sm text-gray-500 mb-2">{label}</div>
    <div className="text-xl font-bold text-gray-800">{value}</div>
  </div>
);


interface FinancingDetailsProps {
    financedAmount: number;
    interestRate: number;
    term: number;
    setInterestRate: (rate: number) => void;
    setTerm: (term: number) => void;
    monthlyPayment: number;
}

const FinancingDetails: React.FC<FinancingDetailsProps> = ({
    financedAmount,
    interestRate,
    term,
    setInterestRate,
    setTerm,
    monthlyPayment,
}) => {
    if (financedAmount <= 0) {
        return null;
    }

    return (
        <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="card-title text-xl font-semibold mb-5 text-gray-800">Detalhes do Financiamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="md:col-span-2 space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col sm:col-span-1">
                            <label className="text-sm font-medium mb-1.5 text-gray-700">Valor Financiado</label>
                            <div className="px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-600 h-full flex items-center">
                                {formatCurrency(financedAmount)}
                            </div>
                        </div>
                        <InfoInput 
                            label="Taxa de Juros Anual" 
                            value={interestRate || ''} 
                            onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)} 
                            placeholder="Ex: 9.5"
                            type="number"
                            suffix="%"
                        />
                        <InfoInput 
                            label="Prazo em Meses" 
                            value={term || ''} 
                            onChange={(e) => setTerm(parseInt(e.target.value) || 0)} 
                            placeholder="Ex: 360"
                            type="number"
                        />
                    </div>
                </div>
                {/* Results */}
                <div className="md:col-span-1 grid grid-cols-1 gap-4">
                    <ResultDisplay label="Pagamento Mensal" value={formatCurrency(monthlyPayment)} />
                </div>
            </div>
        </div>
    );
};

export default FinancingDetails;

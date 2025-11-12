
import React, { useState, useMemo, useCallback } from 'react';
import { addMonths, format } from 'date-fns';
import type { Installment, ScheduleItem, ProposalInfo } from './types';
import FlowBuilder from './components/FlowBuilder';
import Results from './components/Results';
import FinancingDetails from './components/FinancingDetails';
import { formatCurrency, parseCurrency } from './utils/formatting';

const Header: React.FC = () => (
  <header className="text-center mb-10">
    <img src="https://picsum.photos/180/60" alt="Logo" className="mx-auto w-48 h-auto mb-5 rounded" />
    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Simulador de Proposta</h1>
    <p className="text-md md:text-lg text-gray-500">Construa e visualize fluxos de pagamento de forma simples.</p>
  </header>
);

const InfoInput: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; type?: string }> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1.5 text-gray-700">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-blue-500" />
  </div>
);

const App: React.FC = () => {
  const [proposalInfo, setProposalInfo] = useState<ProposalInfo>({
    project: '', clientName: '', unit: '', unitType: '', floor: '', area: 0,
  });
  const [proposedValue, setProposedValue] = useState<number>(0);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);

  const handleProposalInfoChange = (field: keyof ProposalInfo, value: string | number) => {
    setProposalInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateInstallment = useCallback((id: string, updates: Partial<Installment> & { percentage?: number }) => {
    setInstallments(prev =>
      prev.map(inst => {
        if (inst.id !== id) return inst;

        const newInst: Installment = { ...inst, ...updates };
        
        if (updates.percentage !== undefined && proposedValue > 0) {
          const quantity = newInst.quantity > 0 ? newInst.quantity : 1;
          newInst.value = ((updates.percentage / 100) * proposedValue) / quantity;
        }

        if (updates.type?.toLowerCase().includes('financiamento')) {
          newInst.isFinancing = true;
        } else if (updates.type !== undefined) {
          newInst.isFinancing = false;
        }

        return newInst;
      })
    );
  }, [proposedValue]);

  const addInstallment = () => {
    const newInstallment: Installment = {
      id: crypto.randomUUID(),
      type: 'Sinal',
      quantity: 1,
      value: 0,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      isFinancing: false,
    };
    setInstallments(prev => [...prev, newInstallment]);
  };

  const removeInstallment = (id: string) => {
    setInstallments(prev => prev.filter(inst => inst.id !== id));
  };

  const financedAmount = useMemo(() => 
    installments
      .filter(inst => inst.isFinancing)
      .reduce((sum, inst) => sum + inst.value * inst.quantity, 0)
  , [installments]);

  const financingCalculations = useMemo(() => {
    if (financedAmount <= 0 || term <= 0) {
        return { monthlyPayment: 0, totalInterest: 0, totalFinancedCost: financedAmount };
    }
    
    if (interestRate <= 0) {
        const monthlyPayment = financedAmount / term;
        return { monthlyPayment, totalInterest: 0, totalFinancedCost: financedAmount };
    }

    const monthlyInterestRate = interestRate / 12 / 100;
    const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, term);
    const denominator = Math.pow(1 + monthlyInterestRate, term) - 1;

    if (denominator === 0) {
      return { monthlyPayment: 0, totalInterest: 0, totalFinancedCost: financedAmount };
    }

    const monthlyPayment = financedAmount * (numerator / denominator);
    const totalFinancedCost = monthlyPayment * term;
    const totalInterest = totalFinancedCost - financedAmount;

    return { monthlyPayment, totalInterest, totalFinancedCost };
  }, [financedAmount, interestRate, term]);


  const { totalPaid, schedule } = useMemo(() => {
    const total = installments.reduce((acc, inst) => acc + inst.value * inst.quantity, 0);

    const newSchedule: ScheduleItem[] = [];
    installments.forEach(inst => {
      for (let i = 0; i < inst.quantity; i++) {
        const paymentDate = addMonths(new Date(inst.startDate.replace(/-/g, '/')), i);
        newSchedule.push({
          installmentNumber: `${i + 1}/${inst.quantity}`,
          type: inst.type,
          paymentDate: format(paymentDate, 'dd/MM/yyyy'),
          value: inst.value,
        });
      }
    });

    return { totalPaid: total, schedule: newSchedule };
  }, [installments]);

  const valuePerSqm = useMemo(() => {
    if (proposalInfo.area > 0 && proposedValue > 0) {
        return proposedValue / proposalInfo.area;
    }
    return 0;
  }, [proposedValue, proposalInfo.area]);

  const totalConfigured = totalPaid;
  // Round to 2 decimal places to handle floating point issues
  const difference = parseFloat((proposedValue - totalConfigured).toFixed(2));
  const configuredPercentage = proposedValue > 0 ? (totalConfigured / proposedValue) * 100 : 0;

  const getDifferenceInfo = () => {
    if (difference < 0) {
      return { label: 'Excedente:', color: 'text-amber-600' };
    }
    if (difference === 0 && proposedValue > 0) {
      return { label: 'Completo:', color: 'text-green-600' };
    }
    return { label: 'Diferença:', color: 'text-red-600' };
  };
  const differenceInfo = getDifferenceInfo();

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-10">
      <Header />

      <div className="space-y-6">
        <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="card-title text-xl font-semibold mb-5 text-gray-800 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </div>
                Dados do Imóvel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <InfoInput label="Proponente" value={proposalInfo.clientName} onChange={(e) => handleProposalInfoChange('clientName', e.target.value)} placeholder="Nome do cliente" />
                </div>
                <div className="md:col-span-2">
                    <InfoInput label="Empreendimento" value={proposalInfo.project} onChange={(e) => handleProposalInfoChange('project', e.target.value)} placeholder="Nome do empreendimento" />
                </div>
                
                <InfoInput label="Unidade" value={proposalInfo.unit} onChange={(e) => handleProposalInfoChange('unit', e.target.value)} placeholder="Ex: 101" />
                <InfoInput label="Andar" value={proposalInfo.floor} onChange={(e) => handleProposalInfoChange('floor', e.target.value)} placeholder="Ex: 10º" />
                <InfoInput label="Tipo" value={proposalInfo.unitType} onChange={(e) => handleProposalInfoChange('unitType', e.target.value)} placeholder="Ex: 2 dorm" />
                <InfoInput label="Metragem (m²)" value={proposalInfo.area || ''} onChange={(e) => handleProposalInfoChange('area', parseFloat(e.target.value) || 0)} placeholder="Ex: 65.50" type="number" />

                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 text-gray-700">Valor Total do Imóvel (R$)</label>
                    <input 
                        type="text" 
                        className="px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-blue-500 w-full"
                        placeholder="R$ 500.000,00"
                        value={proposedValue > 0 ? formatCurrency(proposedValue) : ''}
                        onChange={(e) => setProposedValue(parseCurrency(e.target.value))}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 text-gray-700">Valor por m² (R$)</label>
                    <input type="text" value={valuePerSqm > 0 ? formatCurrency(valuePerSqm) : ''} placeholder="Calculado automaticamente" className="px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-600 w-full" disabled />
                </div>
            </div>
        </div>

        {proposedValue > 0 && (
          <>
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-center">
                <div className="text-sm uppercase tracking-wide">Valor Total</div>
                <div className="text-4xl font-bold mt-1">{formatCurrency(proposedValue)}</div>
            </div>
            
            <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="card-title text-xl font-semibold mb-4 text-gray-800">Resumo dos Pagamentos</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Total Configurado:</span>
                        <span className="font-semibold">{formatCurrency(totalConfigured)} ({configuredPercentage.toFixed(1)}%)</span>
                    </div>
                    <div className={`flex justify-between items-center ${differenceInfo.color}`}>
                        <span>{differenceInfo.label}</span>
                        <span className="font-semibold">{formatCurrency(difference)} ({(100 - configuredPercentage).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(configuredPercentage, 100)}%` }}></div>
                    </div>
                </div>
            </div>
          </>
        )}

        <FlowBuilder
          installments={installments}
          proposedValue={proposedValue}
          addInstallment={addInstallment}
          removeInstallment={removeInstallment}
          updateInstallment={updateInstallment}
          setInstallments={setInstallments}
        />
        
        <FinancingDetails
          financedAmount={financedAmount}
          interestRate={interestRate}
          term={term}
          setInterestRate={setInterestRate}
          setTerm={setTerm}
          monthlyPayment={financingCalculations.monthlyPayment}
        />

        <Results
          totalPaid={totalPaid}
          schedule={schedule}
          proposalInfo={proposalInfo}
          proposedValue={proposedValue}
          installments={installments}
        />
      </div>
    </div>
  );
};

export default App;

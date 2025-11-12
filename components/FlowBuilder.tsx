import React from 'react';
import type { Installment } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency, parseCurrency } from '../utils/formatting';

// DragHandle Icon Component
const DragHandleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 cursor-grab active:cursor-grabbing">
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
    <circle cx="5" cy="5" r="1"></circle>
    <circle cx="5" cy="12" r="1"></circle>
    <circle cx="5" cy="19" r="1"></circle>
    <circle cx="19" cy="5" r="1"></circle>
    <circle cx="19" cy="12" r="1"></circle>
    <circle cx="19" cy="19" r="1"></circle>
  </svg>
);


interface InstallmentRowProps {
  installment: Installment;
  proposedValue: number;
  updateInstallment: (id: string, updates: Partial<Installment> & { percentage?: number }) => void;
  removeInstallment: (id: string) => void;
}

const SortableInstallmentRow: React.FC<InstallmentRowProps> = (props) => {
  const { id, type, quantity, value, startDate, isFinancing } = props.installment;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    boxShadow: isDragging ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : 'none',
  };

  const percentage = props.proposedValue > 0 ? ((value * quantity) / props.proposedValue) * 100 : 0;
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.updateInstallment(id, { value: parseCurrency(e.target.value) });
  };
  
  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.updateInstallment(id, { percentage: parseFloat(e.target.value) || 0 });
  };

  const predefinedTypes = ["Sinal", "Ato", "Mensal", "Anual", "Semestral", "Trimestral", "Financiamento", "Única"];
  const selectOptions = [...predefinedTypes, "Outro"];
  // A type is "custom" if it's not one of the predefined ones. An empty string also triggers custom mode.
  const isCustomMode = !predefinedTypes.includes(type);

  const baseClasses = "grid gap-3 p-3 border border-gray-200 rounded-lg mb-3 bg-white items-center transition-colors hover:bg-gray-50";
  const mobileClasses = "grid-cols-2 sm:grid-cols-[auto_2fr_1fr_1.5fr_1fr_1.5fr_40px]";
  const financingClasses = isFinancing ? 'bg-green-50 hover:bg-green-100 border-green-200' : '';

  return (
    <div ref={setNodeRef} style={style} className={`${baseClasses} ${mobileClasses} ${financingClasses}`}>
      <div {...attributes} {...listeners} className="hidden sm:flex items-center justify-center">
        <DragHandleIcon />
      </div>
      
      {/* Mobile labels */}
      <label className="sm:hidden text-xs text-gray-500">Tipo Parcela</label>
      <div className="col-span-1">
        {isCustomMode ? (
          <div className="relative w-full">
            <input
              type="text"
              value={type}
              onChange={(e) => props.updateInstallment(id, { type: e.target.value })}
              placeholder="Nome da Parcela"
              className="parcela-input w-full px-2 py-2 border border-gray-300 rounded-md text-sm pr-8"
              aria-label="Tipo de parcela personalizado"
            />
            <button 
              onClick={() => props.updateInstallment(id, { type: 'Sinal' })}
              className="absolute right-0 top-0 h-full px-2 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              aria-label="Voltar para seleção"
              title="Voltar para seleção"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>
        ) : (
          <select 
            value={type} 
            onChange={(e) => {
              const selectedType = e.target.value;
              // If user selects "Outro", set type to empty string to trigger custom mode
              props.updateInstallment(id, { type: selectedType === 'Outro' ? '' : selectedType });
            }} 
            className="parcela-input w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
            aria-label="Tipo de parcela"
          >
            {selectOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>
      
      <label className="sm:hidden text-xs text-gray-500">Qtd</label>
      <input type="number" min="1" value={quantity} onChange={(e) => props.updateInstallment(id, { quantity: parseInt(e.target.value) || 1 })} className="parcela-input w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
      
      <label className="sm:hidden text-xs text-gray-500">Valor (R$)</label>
      <input type="text" value={value ? formatCurrency(value) : ''} onChange={handleValueChange} className="parcela-input w-full px-2 py-2 border border-gray-300 rounded-md text-sm" placeholder="R$ 0,00" />
      
      <label className="sm:hidden text-xs text-gray-500">%</label>
      <div className="relative">
        <input type="number" step="0.01" value={Number(percentage.toFixed(2))} onChange={handlePercentageChange} className="parcela-input w-full px-2 py-2 border border-gray-300 rounded-md text-sm pr-6" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
      </div>
      
      <label className="sm:hidden text-xs text-gray-500">Data Início</label>
      <input type="date" value={startDate} onChange={(e) => props.updateInstallment(id, { startDate: e.target.value })} className="parcela-input w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />

      <label className="sm:hidden text-xs text-gray-500"></label>
      <button onClick={() => props.removeInstallment(id)} className="remove-btn bg-red-500 text-white rounded-md w-full h-10 sm:w-8 sm:h-8 flex items-center justify-center text-lg transition-colors hover:bg-red-700">
        &times;
      </button>
    </div>
  );
};


interface FlowBuilderProps {
  installments: Installment[];
  proposedValue: number;
  addInstallment: () => void;
  removeInstallment: (id: string) => void;
  updateInstallment: (id: string, updates: Partial<Installment> & { percentage?: number }) => void;
  setInstallments: React.Dispatch<React.SetStateAction<Installment[]>>;
}

const FlowBuilder: React.FC<FlowBuilderProps> = ({ installments, proposedValue, addInstallment, removeInstallment, updateInstallment, setInstallments }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setInstallments((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  
  return (
    <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="card-title text-xl font-semibold mb-5 text-gray-800">Construtor de Fluxo de Pagamento</h2>
      <div className="parcela-header hidden sm:grid grid-cols-[auto_2fr_1fr_1.5fr_1fr_1.5fr_40px] gap-3 px-3 font-semibold text-gray-600 text-xs">
        <div>{/* Handle */}</div>
        <div>Tipo Parcela</div>
        <div>Qtd</div>
        <div>Valor (R$)</div>
        <div>%</div>
        <div>Data Início</div>
        <div></div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={installments}
          strategy={verticalListSortingStrategy}
        >
          {installments.map(installment => (
            <SortableInstallmentRow
              key={installment.id}
              installment={installment}
              proposedValue={proposedValue}
              updateInstallment={updateInstallment}
              removeInstallment={removeInstallment}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button className="add-btn bg-blue-500 text-white rounded-lg px-6 py-3 text-base font-semibold cursor-pointer transition-colors hover:bg-blue-600 mt-3 w-full sm:w-auto" onClick={addInstallment}>
        Adicionar Nova Parcela
      </button>
    </div>
  );
};

export default FlowBuilder;
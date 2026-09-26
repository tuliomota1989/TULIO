import React, { useState } from 'react';
import type { SavedProposal } from '../types';

// ponytail: propostas ficam no localStorage deste navegador; outro computador não vê. Backend quando precisar compartilhar.
const STORAGE_KEY = 'propostas-salvas';

const readAll = (): Record<string, SavedProposal> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

interface SavedProposalsProps {
  current: SavedProposal;
  defaultName: string;
  onLoad: (proposal: SavedProposal) => void;
}

const SavedProposals: React.FC<SavedProposalsProps> = ({ current, defaultName, onLoad }) => {
  const [saved, setSaved] = useState(readAll);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');

  const persist = (next: Record<string, SavedProposal>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
      return true;
    } catch {
      setMessage('Não foi possível salvar neste navegador.');
      return false;
    }
  };

  const handleSave = () => {
    const finalName = (name || defaultName).trim();
    if (!finalName) {
      setMessage('Dê um nome para a proposta.');
      return;
    }
    if (saved[finalName] && !confirm(`Já existe "${finalName}". Substituir?`)) return;
    if (persist({ ...saved, [finalName]: current })) {
      setSelected(finalName);
      setName(finalName);
      setMessage(`Proposta "${finalName}" salva.`);
    }
  };

  const handleLoad = (key: string) => {
    setSelected(key);
    if (!saved[key]) return;
    onLoad(saved[key]);
    setName(key);
    setMessage(`Proposta "${key}" carregada.`);
  };

  const handleDelete = () => {
    if (!selected || !confirm(`Excluir a proposta "${selected}"?`)) return;
    const { [selected]: _removed, ...rest } = saved;
    if (persist(rest)) {
      setMessage(`Proposta "${selected}" excluída.`);
      setSelected('');
    }
  };

  const names = Object.keys(saved).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="card-title text-xl font-semibold mb-4 text-gray-800">Propostas Salvas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName || 'Nome da proposta'}
            aria-label="Nome da proposta"
            className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 text-sm font-semibold">
            Salvar
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={(e) => handleLoad(e.target.value)}
            aria-label="Abrir proposta salva"
            className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="">{names.length ? 'Abrir proposta salva…' : 'Nenhuma proposta salva'}</option>
            {names.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button
            onClick={handleDelete}
            disabled={!selected}
            className="bg-red-500 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-md px-4 text-sm font-semibold"
          >
            Excluir
          </button>
        </div>
      </div>
      {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
    </div>
  );
};

export default SavedProposals;

export const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    value = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  if (typeof value !== 'string' || !value) return 0;

  // Keep only the digits from the string
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly === '') return 0;

  // Convert the digits string to a number, assuming the last two are decimal places
  const numberValue = parseInt(digitsOnly, 10) / 100;
  
  return isNaN(numberValue) ? 0 : numberValue;
};
// Meses entre parcelas consecutivas de um mesmo tipo.
const MONTH_STEP: Record<string, number> = { anual: 12, semestral: 6, trimestral: 3 };
export const monthStep = (type: string): number => MONTH_STEP[type.trim().toLowerCase()] ?? 1;

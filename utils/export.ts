import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ScheduleItem, ProposalInfo } from '../types';
import { formatCurrency } from './formatting';

interface ExportData {
    schedule: ScheduleItem[];
    proposalInfo: ProposalInfo;
    proposedValue: number;
}

const generateFileName = (info: ProposalInfo, extension: string) => {
    const clientName = info.clientName.replace(/\s+/g, '_') || 'proposta';
    const projectName = info.project.replace(/\s+/g, '_') || 'empreendimento';
    return `${clientName}_${projectName}.${extension}`;
}

export const exportToPDF = ({ schedule, proposalInfo, proposedValue }: ExportData) => {
    const doc = new jsPDF();
    const tableData = schedule.map(item => [item.installmentNumber, item.type, item.paymentDate, formatCurrency(item.value)]);
    
    doc.setFontSize(18);
    doc.text("Cronograma de Pagamentos", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    let startY = 30;
    const addInfo = (label: string, value: string | number) => {
      if(value){
        doc.text(`${label}: ${value}`, 14, startY);
        startY += 7;
      }
    }
    
    addInfo('Empreendimento', proposalInfo.project);
    addInfo('Unidade', `${proposalInfo.unit} (${proposalInfo.unitType})`);
    addInfo('Cliente', proposalInfo.clientName);
    addInfo('Valor da Proposta', formatCurrency(proposedValue));
    startY += 5;

    autoTable(doc, {
        startY: startY,
        head: [['Parcela', 'Tipo', 'Data de Pagamento', 'Valor']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(generateFileName(proposalInfo, 'pdf'));
};

const createSheet = (data: ExportData) => {
    const header = [
        "Parcela",
        "Tipo",
        "Data de Pagamento",
        "Valor"
    ];

    const body = data.schedule.map(item => ({
        Parcela: item.installmentNumber,
        Tipo: item.type,
        "Data de Pagamento": item.paymentDate,
        Valor: item.value
    }));
    
    const info = [
        {"Cronograma de Pagamentos": ""},
        {Empreendimento: data.proposalInfo.project},
        {Unidade: `${data.proposalInfo.unit} (${data.proposalInfo.unitType})`},
        {Cliente: data.proposalInfo.clientName},
        {"Valor da Proposta": data.proposedValue},
        {}, // Spacer
    ];

    const worksheet = XLSX.utils.json_to_sheet(info, {skipHeader: true});
    XLSX.utils.sheet_add_json(worksheet, body, {origin: -1});

    // Format value column as currency
    worksheet['!cols'] = [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}];
    for(let i = 0; i < body.length; i++) {
        const cellRef = XLSX.utils.encode_cell({c: 3, r: i + info.length}); // Column D
        if(worksheet[cellRef]) {
            worksheet[cellRef].t = 'n';
            worksheet[cellRef].z = 'R$ #,##0.00';
        }
    }
    const proposedValueRef = XLSX.utils.encode_cell({c: 1, r: 4});
    if(worksheet[proposedValueRef]) {
        worksheet[proposedValueRef].t = 'n';
        worksheet[proposedValueRef].z = 'R$ #,##0.00';
    }


    return worksheet;
};

export const exportToXLSX = (data: ExportData) => {
    const worksheet = createSheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cronograma");
    XLSX.writeFile(workbook, generateFileName(data.proposalInfo, 'xlsx'));
};

export const exportToCSV = (data: ExportData) => {
    const worksheet = createSheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", generateFileName(data.proposalInfo, 'csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
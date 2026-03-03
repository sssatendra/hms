'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './utils';

export class ReportService {
    static async generateLabReport(patient: any, order: any) {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('MedOrbit - CLINICAL LABORATORY REPORT', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Patient Name: ${patient.first_name} ${patient.last_name}`, 14, 40);
        doc.text(`MRN: ${patient.mrn}`, 14, 45);
        doc.text(`Date: ${formatDate(new Date().toISOString())}`, 14, 50);
        doc.text(`Order ID: #${order.id.slice(-6).toUpperCase()}`, 14, 55);

        // Results Table
        autoTable(doc, {
            startY: 65,
            head: [['Test Name', 'Result', 'Unit', 'Reference Range', 'Status']],
            body: order.items.map((item: any) => [
                item.lab_test.name,
                item.result_value || 'PENDING',
                item.lab_test.unit || '-',
                item.lab_test.reference_range || '-',
                item.status
            ]),
            headStyles: { fillStyle: 'F', fillColor: [6, 78, 59] }, // Emerald-900
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text('Electronically signed by:', 14, finalY);
        doc.text('Laboratory In-charge', 14, finalY + 10);

        doc.save(`LabReport_${patient.mrn}_${order.id.slice(-6)}.pdf`);
    }

    static async generateInvoice(patient: any, invoice: any) {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text('MedOrbit - MEDICAL INVOICE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Bill To: ${patient.first_name} ${patient.last_name}`, 14, 40);
        doc.text(`MRN: ${patient.mrn}`, 14, 45);
        doc.text(`Invoice Number: ${invoice.invoice_number}`, 14, 50);
        doc.text(`Date: ${formatDate(invoice.created_at)}`, 14, 55);

        autoTable(doc, {
            startY: 65,
            head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
            body: invoice.items.map((item: any) => [
                item.description,
                item.quantity,
                item.unit_price,
                (item.quantity * item.unit_price).toFixed(2)
            ]),
            foot: [['', '', 'Grand Total', invoice.total_amount]],
            headStyles: { fillStyle: 'F', fillColor: [30, 41, 59] }, // Slate-800
        });

        doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    }
}

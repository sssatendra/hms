'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    X, User, FlaskConical, Clock, CheckCircle,
    AlertCircle, Upload, FileText, ExternalLink,
    ChevronRight, Loader2, Save, MoreVertical,
    Beaker, Microscope, ShieldCheck, Maximize2
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import FileViewer from './FileViewer';

interface LabOrderDetailModalProps {
    orderId: string;
    onClose: () => void;
}

export default function LabOrderDetailModal({ orderId, onClose }: LabOrderDetailModalProps) {
    const queryClient = useQueryClient();
    const [results, setResults] = useState<Record<string, { val: string, note: string }>>({});
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    const { data: order, isLoading } = useQuery<any>({
        queryKey: ['lab', 'orders', orderId],
        queryFn: () => coreApi.get<any>(`/lab/orders/${orderId}`),
    });

    useEffect(() => {
        if (order?.data?.items) {
            const initialResults: any = {};
            order.data.items.forEach((item: any) => {
                initialResults[item.id] = {
                    val: item.results || '',
                    note: item.result_notes || ''
                };
            });
            setResults(initialResults);
            setClinicalNotes(order.data.clinical_notes || '');
        }
    }, [order]);

    const updateStatusMutation = useMutation({
        mutationFn: ({ status }: { status: string }) =>
            coreApi.patch(`/lab/orders/${orderId}/status`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] }),
        onError: (error: any) => {
            alert(`Failed to update status: ${error.message || 'Unknown error'}`);
        }
    });

    const updateResultsMutation = useMutation({
        mutationFn: (payload: { items?: any[], clinical_notes?: string }) =>
            coreApi.patch(`/lab/orders/${orderId}/results`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] });
            queryClient.invalidateQueries({ queryKey: ['lab', 'orders', orderId] });
            setIsUpdating(false);
        },
        onError: (error: any) => {
            alert(`Execution failed: ${error.message || 'Unauthorized or Server Error'}`);
        }
    });

    const handleStatusTransition = (newStatus: string) => {
        if (newStatus === 'COMPLETED') {
            const items = Object.entries(results).map(([id, resultData]: [string, any]) => ({
                lab_order_item_id: id,
                results: resultData.val,
                result_notes: resultData.note
            }));
            updateResultsMutation.mutate({ items, clinical_notes: clinicalNotes }, {
                onSuccess: () => {
                    updateStatusMutation.mutate({ status: newStatus });
                }
            });
        } else {
            updateStatusMutation.mutate({ status: newStatus });
        }
    };

    const handleResultChange = (itemId: string, field: 'val' | 'note', value: string) => {
        setResults(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || { val: '', note: '' }),
                [field]: value
            }
        }));
    };

    const saveResults = () => {
        const items = Object.entries(results).map(([id, resultData]: [string, any]) => ({
            lab_order_item_id: id,
            results: resultData.val,
            result_notes: resultData.note
        }));
        updateResultsMutation.mutate({ items, clinical_notes: clinicalNotes });
    };

    const submitSingleItem = (itemId: string) => {
        const itemResult = results[itemId];
        if (!itemResult) return;

        updateResultsMutation.mutate({
            items: [{
                lab_order_item_id: itemId,
                results: itemResult.val,
                result_notes: itemResult.note
            }]
        });
    };

    const printReport = () => {
        const data = order?.data;
        if (!data) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Lab Report - ${data.order_number}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
                        .hospital-name { font-size: 24px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: -0.025em; }
                        .report-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; background: #f8fafc; padding: 25px; rounded: 12px; }
                        .info-section h4 { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin: 0 0 8px 0; letter-spacing: 0.05em; }
                        .info-section p { margin: 0; font-size: 14px; font-weight: 700; }
                        table { width: 100%; border-collapse: collapse; margin-block: 30px; }
                        th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
                        td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
                        .signature { margin-top: 40px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="hospital-name">MedOrbit Laboratory</div>
                            <div class="report-title">Diagnostic Investigation Report</div>
                        </div>
                        <div style="text-align: right">
                            <div style="font-weight: 900; font-size: 18px;">#${data.order_number}</div>
                            <div style="font-size: 12px; color: #64748b;">${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-section">
                            <h4>Patient Information</h4>
                            <p>${data.patient?.first_name} ${data.patient?.last_name}</p>
                            <p style="font-weight: 400; font-size: 12px; margin-top: 4px;">MRN: ${data.patient?.mrn} | ${data.patient?.gender} | ${data.patient?.age} Years</p>
                        </div>
                        <div class="info-section">
                            <h4>Ordering Clinician</h4>
                            <p>Dr. ${data.doctor?.last_name}</p>
                            <p style="font-weight: 400; font-size: 12px; margin-top: 4px;">Dept: ${data.department?.name || 'General Medicine'}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Test Investigation</th>
                                <th>Results / Findings</th>
                                <th>Interpretive Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.items || []).map((item: any) => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 700">${item.lab_test?.name}</div>
                                        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">CODE: ${item.lab_test?.code}</div>
                                    </td>
                                    <td style="font-weight: 700; color: #0f172a">${item.results || 'Pending Authentication'}</td>
                                    <td style="color: #475569; font-style: italic">${item.result_notes || 'No significant remarks'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    ${data.clinical_notes ? `
                        <div style="margin-top: 30px; padding: 20px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
                            <h4 style="font-size: 10px; text-transform: uppercase; color: #b45309; margin: 0 0 10px 0;">Clinical History / Notes</h4>
                            <p style="margin: 0; font-size: 13px; color: #92400e;">${data.clinical_notes}</p>
                        </div>
                    ` : ''}

                    <div class="signature">
                        <div style="width: 200px; border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 12px; font-weight: 700;">Pathologist / Lab In-charge</p>
                    </div>

                    <div class="footer">
                        <div>MedOrbit Health Information Systems</div>
                        <div>Generated on ${new Date().toLocaleString()}</div>
                    </div>

                    ${(data.files && data.files.length > 0) ? `
                        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #e2e8f0;">
                            <h4 style="font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 15px; letter-spacing: 0.1em;">Attached Diagnostic Artifacts</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                ${data.files.map((file: any) => `
                                    <div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                        <div style="width: 32px; height: 32px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px;">📁</div>
                                        <div>
                                            <div style="font-size: 12px; font-weight: 700;">${file.file_name}</div>
                                            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">${file.file_type} • Uploaded ${new Date(file.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <p style="font-size: 9px; color: #94a3b8; margin-top: 10px; font-style: italic;">* Digital copies available in the clinical portal.</p>
                        </div>
                    ` : ''}
                    
                    <script>
                        window.onload = () => { 
                            setTimeout(() => {
                                window.print(); 
                                // window.close(); // Optional: close after print
                            }, 500);
                        }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (isLoading || !order?.data) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-4xl rounded-3xl border border-border shadow-2xl p-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Hydrating Investigation Data...</p>
                </div>
            </div>
        );
    }

    const data = order.data;
    const status = data.status;

    const getStatusIcon = (s: string) => {
        switch (s) {
            case 'PENDING': return <Clock className="h-4 w-4" />;
            case 'SAMPLE_COLLECTED': return <Microscope className="h-4 w-4" />;
            case 'IN_PROGRESS': return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };


    return (
        <>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 overflow-y-auto">
                <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl flex flex-col my-4 max-h-[94vh]">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <FlaskConical className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black tracking-tight">{data.order_number}</h2>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest flex items-center gap-1.5",
                                        {
                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20': status === 'PENDING',
                                            'bg-sky-500/10 text-sky-500 border-sky-500/20': status === 'SAMPLE_COLLECTED',
                                            'bg-purple-500/10 text-purple-500 border-purple-500/20': status === 'IN_PROGRESS',
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20': status === 'COMPLETED',
                                            'bg-rose-500/10 text-rose-500 border-rose-500/20': status === 'CANCELLED',
                                        }
                                    )}>
                                        {getStatusIcon(status)}
                                        {status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-[8.5px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 opacity-60 font-fira-code">Created on {formatDateTime(data.created_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={printReport}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-muted transition-all font-fira-code text-foreground"
                            >
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                Extract Report
                            </button>
                            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                        {/* Main Panel */}
                        <div className="lg:col-span-2 p-4 px-6 space-y-5">
                            {/* Patient Card */}
                            <div className="bg-muted/10 rounded-xl p-3.5 border border-border/50 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-background border-2 border-border text-primary flex items-center justify-center text-lg font-black">
                                    {data.patient?.first_name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 opacity-50 font-fira-code">PATIENT RECIPIENT</p>
                                    <h3 className="text-base font-black leading-tight">{data.patient?.first_name} {data.patient?.last_name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">MRN: {data.patient?.mrn}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{data.patient?.gender} • {data.patient?.age} Y</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8.5px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-0.5 font-fira-code">ORIGIN</p>
                                    <p className="text-[10px] font-black uppercase">Dr. {data.doctor?.last_name}</p>
                                </div>
                            </div>

                            {/* Attached Artifacts - Elevated for Completed Reports */}
                            {data.files?.length > 0 && (
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-3 px-1 font-fira-code text-primary">
                                        <FileText className="h-3.5 w-3.5 text-primary" />
                                        Imaging & Diagnostic Artifacts
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                        {data.files.map((file: any) => (
                                            <div
                                                key={file.id}
                                                onClick={() => setActiveFileId(file.id)}
                                                className="relative aspect-square bg-card border border-border rounded-xl flex flex-col items-center justify-center p-3 group cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform text-primary">
                                                    {file.file_type === 'PDF' ? <FileText className="h-4 w-4" /> : <Microscope className="h-4 w-4" />}
                                                </div>
                                                <p className="text-[8px] font-black uppercase tracking-tighter text-center truncate w-full font-fira-code px-1 text-foreground/70">{file.file_name}</p>
                                                <div className="absolute top-1.5 right-1.5 p-1 bg-primary/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Maximize2 className="h-2.5 w-2.5 text-primary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Test Items & Results */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 font-fira-code">
                                        <Beaker className="h-3.5 w-3.5 text-primary" />
                                        Investigation results
                                    </h3>
                                    {status !== 'CANCELLED' && status !== 'COMPLETED' && (
                                        <button
                                            onClick={saveResults}
                                            disabled={updateResultsMutation.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:opacity-95 transition-all font-fira-code shadow-lg shadow-emerald-500/10 active:scale-95"
                                        >
                                            {updateResultsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin text-white" /> : <Save className="h-3 w-3 text-white" />}
                                            Sync Results
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {data.items?.map((item: any) => (
                                        <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden group">
                                            <div className="p-3 bg-muted/5 flex items-center justify-between border-b border-border/50">
                                                <div>
                                                    <span className="text-[8.5px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded-md uppercase tracking-tighter mb-0.5 inline-block font-fira-code">
                                                        {item.lab_test?.code}
                                                    </span>
                                                    <h4 className="text-xs font-black">{item.lab_test?.name}</h4>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-[8.5px] font-black text-muted-foreground uppercase tracking-widest opacity-50 font-fira-code">Status</p>
                                                        <p className={cn("text-[9px] font-black uppercase tracking-tighter font-fira-code",
                                                            item.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'
                                                        )}>{item.status}</p>
                                                    </div>
                                                    {status !== 'COMPLETED' && status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                                                        <button
                                                            onClick={() => submitSingleItem(item.id)}
                                                            className="h-7 px-3 bg-primary text-primary-foreground rounded-lg text-[8px] font-black uppercase tracking-widest opacity-90 hover:opacity-100 transition-all flex items-center gap-1 active:scale-95 shadow-lg shadow-primary/10"
                                                        >
                                                            <CheckCircle size={10} />
                                                            Submit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[8.5px] font-black uppercase text-muted-foreground tracking-widest block mb-1 opacity-60 font-fira-code">Findings</label>
                                                    <input
                                                        type="text"
                                                        value={results[item.id]?.val ?? ''}
                                                        onChange={(e) => handleResultChange(item.id, 'val', e.target.value)}
                                                        placeholder="Qualitative finding..."
                                                        readOnly={status === 'COMPLETED'}
                                                        className={cn(
                                                            "w-full px-2.5 py-1.5 bg-muted/10 border border-border rounded-lg text-xs font-bold outline-none focus:border-primary transition-all text-foreground",
                                                            status === 'COMPLETED' && "bg-emerald-500/5 border-emerald-500/20 opacity-80 cursor-not-allowed text-emerald-500"
                                                        )}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[8.5px] font-black uppercase text-muted-foreground tracking-widest block mb-1 opacity-60 font-fira-code">Interpretive Notes</label>
                                                    <input
                                                        type="text"
                                                        value={results[item.id]?.note ?? ''}
                                                        onChange={(e) => handleResultChange(item.id, 'note', e.target.value)}
                                                        placeholder="Clinical remarks..."
                                                        readOnly={status === 'COMPLETED'}
                                                        className={cn(
                                                            "w-full px-2.5 py-1.5 bg-muted/40 border border-border rounded-lg text-xs font-bold outline-none focus:border-primary transition-all text-foreground",
                                                            status === 'COMPLETED' && "bg-transparent border-border/50 opacity-80 cursor-not-allowed"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>


                        </div>

                        {/* Sidebar */}
                        <div className="p-4 px-6 space-y-6 bg-muted/5">
                            {/* Status Pipeline */}
                            <div>
                                <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 font-fira-code">Lifecycle Matrix</h3>
                                <div className="space-y-2">
                                    {[
                                        { id: 'SAMPLE_COLLECTED', label: 'Collect Sample', activeWhen: 'PENDING', icon: CheckCircle },
                                        { id: 'IN_PROGRESS', label: 'Start Analysis', activeWhen: 'SAMPLE_COLLECTED', icon: Microscope },
                                        { id: 'COMPLETED', label: 'Authenticate Results', activeWhen: 'IN_PROGRESS', icon: ShieldCheck },
                                    ].map((action) => (
                                        <button
                                            key={action.id}
                                            disabled={status !== action.activeWhen || updateStatusMutation.isPending}
                                            onClick={() => handleStatusTransition(action.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 px-4 rounded-xl border transition-all",
                                                status === action.activeWhen
                                                    ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/5"
                                                    : "border-border text-muted-foreground opacity-30 grayscale pointer-events-none"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <action.icon className="h-3.5 w-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.1em] font-fira-code">{action.label}</span>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Instructions / Clinical Context */}
                            <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 font-fira-code">Clinical Frame</p>
                                            {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                                                <button
                                                    onClick={() => updateResultsMutation.mutate({ clinical_notes: clinicalNotes })}
                                                    className="px-2 py-0.5 bg-amber-500 text-white rounded text-[8.5px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-sm"
                                                >
                                                    Save Insights
                                                </button>
                                            )}
                                        </div>
                                        <textarea
                                            value={clinicalNotes}
                                            onChange={(e) => setClinicalNotes(e.target.value)}
                                            readOnly={status === 'COMPLETED'}
                                            placeholder="Add contextual insights here..."
                                            className={cn(
                                                "w-full bg-card/50 border border-amber-500/20 rounded-lg p-2 text-[10px] font-medium text-foreground outline-none focus:border-amber-500/40 min-h-[80px] resize-none transition-all placeholder:text-muted-foreground/30",
                                                status === 'COMPLETED' && "bg-transparent border-transparent cursor-default italic px-0 py-0"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Audit */}
                            <div className="pt-4 border-t border-border mt-auto">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[8.5px] font-black uppercase tracking-widest text-muted-foreground mt-0.5 font-fira-code">Audit Matrix</span>
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[8.5px] font-bold text-muted-foreground uppercase opacity-60 font-fira-code">Initialization • {formatDateTime(data.created_at)}</p>
                                    {data.sample_collected_at && <p className="text-[8.5px] font-bold text-emerald-600 uppercase font-fira-code">Sample Secured • {formatDateTime(data.sample_collected_at)}</p>}
                                    {data.completed_at && <p className="text-[8.5px] font-bold text-blue-600 uppercase tracking-widest font-fira-code">Authenticated • {formatDateTime(data.completed_at)}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {activeFileId && (
                <FileViewer
                    orderId={orderId}
                    fileId={activeFileId}
                    onClose={() => setActiveFileId(null)}
                />
            )}
        </>
    );
}

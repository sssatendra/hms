'use client';

import { useState } from 'react';
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
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    const { data: order, isLoading } = useQuery({
        queryKey: ['lab', 'orders', orderId],
        queryFn: () => coreApi.get<any>(`/lab/orders/${orderId}`),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ status }: { status: string }) =>
            coreApi.patch(`/lab/orders/${orderId}/status`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] }),
        onError: (error: any) => {
            alert(`Failed to update status: ${error.message || 'Unknown error'}`);
        }
    });

    const updateResultsMutation = useMutation({
        mutationFn: (items: any[]) =>
            coreApi.patch(`/lab/orders/${orderId}/results`, { items }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] });
            setIsUpdating(false);
        }
    });

    const handleStatusTransition = (status: string) => {
        updateStatusMutation.mutate({ status });
    };

    const handleResultChange = (itemId: string, field: 'val' | 'note', value: string) => {
        setResults(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const saveResults = () => {
        const items = Object.entries(results).map(([id, data]) => ({
            lab_order_item_id: id,
            results: data.val,
            result_notes: data.note
        }));
        updateResultsMutation.mutate(items);
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
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-card w-full max-w-5xl rounded-3xl border border-border shadow-2xl flex flex-col my-8 max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <FlaskConical className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black tracking-tight">{data.order_number}</h2>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-widest flex items-center gap-1.5",
                                        {
                                            'bg-yellow-50 text-yellow-700 border-yellow-200': status === 'PENDING',
                                            'bg-blue-50 text-blue-700 border-blue-200': status === 'SAMPLE_COLLECTED',
                                            'bg-purple-50 text-purple-700 border-purple-200': status === 'IN_PROGRESS',
                                            'bg-emerald-50 text-emerald-700 border-emerald-200': status === 'COMPLETED',
                                            'bg-red-50 text-red-700 border-red-200': status === 'CANCELLED',
                                        }
                                    )}>
                                        {getStatusIcon(status)}
                                        {status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">Created on {formatDateTime(data.created_at)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                        {/* Main Panel */}
                        <div className="lg:col-span-2 p-6 space-y-8">
                            {/* Patient Card */}
                            <div className="bg-muted/10 rounded-2xl p-5 border border-border/50 flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-background border-2 border-border text-primary flex items-center justify-center text-2xl font-black">
                                    {data.patient?.first_name[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">PATIENT RECIPIENT</p>
                                    <h3 className="text-xl font-black">{data.patient?.first_name} {data.patient?.last_name}</h3>
                                    <div className="flex items-center gap-4 mt-1.5">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">MRN: {data.patient?.mrn}</span>
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{data.patient?.gender} • {data.patient?.age} Y</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">ORDERING PRACTITIONER</p>
                                    <p className="text-xs font-black">Dr. {data.doctor?.first_name} {data.doctor?.last_name}</p>
                                </div>
                            </div>

                            {/* Test Items & Results */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <Beaker className="h-4 w-4 text-primary" />
                                        Investigation results
                                    </h3>
                                    {status !== 'COMPLETED' && (
                                        <button
                                            onClick={saveResults}
                                            disabled={updateResultsMutation.isPending}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            {updateResultsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                            Sync Results
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {data.items?.map((item: any) => (
                                        <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden group">
                                            <div className="p-4 bg-muted/5 flex items-center justify-between border-b border-border/50">
                                                <div>
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-tighter mb-1 inline-block">
                                                        {item.lab_test?.code}
                                                    </span>
                                                    <h4 className="text-sm font-black">{item.lab_test?.name}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Status</p>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-tighter",
                                                        item.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'
                                                    )}>{item.status}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5 opacity-60">Result Value / Findings</label>
                                                    <input
                                                        type="text"
                                                        defaultValue={item.results}
                                                        onChange={(e) => handleResultChange(item.id, 'val', e.target.value)}
                                                        placeholder="Numeric value or qualitative finding..."
                                                        className="w-full px-3 py-2 bg-muted/10 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5 opacity-60">Result Interpretation / Notes</label>
                                                    <input
                                                        type="text"
                                                        defaultValue={item.result_notes}
                                                        onChange={(e) => handleResultChange(item.id, 'note', e.target.value)}
                                                        placeholder="Interpretive notes or clinical remarks..."
                                                        className="w-full px-3 py-2 bg-muted/10 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Attached Artifacts */}
                            {data.files?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Archive className="h-4 w-4 text-primary" />
                                        Clinical documents & Imaging
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {data.files.map((file: any) => (
                                            <div
                                                key={file.id}
                                                onClick={() => setActiveFileId(file.id)}
                                                className="relative aspect-square bg-muted/20 border-2 border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-4 group cursor-pointer hover:border-primary transition-all"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                    {file.file_type === 'PDF' ? <FileText className="h-5 w-5 text-red-500" /> : <Microscope className="h-5 w-5 text-blue-500" />}
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-tighter text-center truncate w-full">{file.file_name}</p>
                                                <button className="absolute top-2 right-2 p-1.5 bg-background border border-border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Maximize2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="p-6 space-y-8 bg-muted/5">
                            {/* Status Pipeline */}
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Lifecycle Management</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'SAMPLE_COLLECTED', label: 'Collect Sample', activeWhen: 'PENDING', icon: CheckCircle },
                                        { id: 'IN_PROGRESS', label: 'Start Processing', activeWhen: 'SAMPLE_COLLECTED', icon: Microscope },
                                        { id: 'COMPLETED', label: 'Complete Order', activeWhen: 'IN_PROGRESS', icon: ShieldCheck },
                                    ].map((action) => (
                                        <button
                                            key={action.id}
                                            disabled={status !== action.activeWhen || updateStatusMutation.isPending}
                                            onClick={() => handleStatusTransition(action.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                                status === action.activeWhen
                                                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                                                    : "border-border text-muted-foreground opacity-40 grayscale pointer-events-none"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <action.icon className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                                <div className="flex items-start gap-4">
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5">Clinical Notes</p>
                                        <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed italic uppercase">
                                            "{data.clinical_notes || 'No clinical context provided'}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Audit */}
                            <div className="pt-6 border-t border-border mt-auto">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Audit Trail</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Created by System Admin • {formatDateTime(data.created_at)}</p>
                                    {data.sample_collected_at && <p className="text-[9px] font-bold text-emerald-600 uppercase">Sample collected • {formatDateTime(data.sample_collected_at)}</p>}
                                    {data.completed_at && <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Order authenticated • {formatDateTime(data.completed_at)}</p>}
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

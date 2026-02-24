'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X, Download, ExternalLink, Loader2,
    FileText, Microscope, AlertCircle, Maximize2
} from 'lucide-react';
import { coreApi } from '@/lib/api';

interface FileViewerProps {
    orderId: string;
    fileId: string;
    onClose: () => void;
}

export default function FileViewer({ orderId, fileId, onClose }: FileViewerProps) {
    const { data: fileUrl, isLoading, error } = useQuery({
        queryKey: ['lab', 'order', orderId, 'file', fileId],
        queryFn: () => coreApi.get<any>(`/lab/orders/${orderId}/file-url/${fileId}`),
    });

    const data = fileUrl?.data;
    const isImage = data?.file_type?.match(/JPG|JPEG|PNG/i);
    const isPdf = data?.file_type === 'PDF';
    const isDicom = data?.file_type === 'DCM' || data?.file_type === 'DICOM';

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        {isPdf ? <FileText className="h-5 w-5" /> : <Microscope className="h-5 w-5" />}
                    </div>
                    <div>
                        <h2 className="text-white font-black text-sm">{data?.file_name || 'Loading File...'}</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{data?.file_type || 'Investigation Artifact'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {data?.signed_url && (
                        <a
                            href={data.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    )}
                    <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-6xl bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden relative group">
                {isLoading ? (
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-white opacity-20 mx-auto mb-4" />
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Acquiring Signed URL...</p>
                    </div>
                ) : error ? (
                    <div className="text-center p-8 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-sm">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                        <p className="text-white font-black text-xs uppercase tracking-widest mb-2">Acquisition Failed</p>
                        <p className="text-red-400 text-[10px] font-bold uppercase leading-relaxed">The file could not be retrieved from the cloud storage. Please verify laboratory service status.</p>
                    </div>
                ) : (
                    <>
                        {isPdf && (
                            <iframe
                                src={`${data.signed_url}#toolbar=0`}
                                className="w-full h-full border-none rounded-3xl"
                            />
                        )}
                        {isImage && (
                            <img
                                src={data.signed_url}
                                alt="Lab Result"
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                            />
                        )}
                        {isDicom && (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                                    <Microscope className="h-10 w-10" />
                                </div>
                                <h3 className="text-white font-black text-lg mb-2">DICOM Image Artifact</h3>
                                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-relaxed max-w-xs mx-auto mb-8">
                                    DICOM imaging requires a specialized workstation client for full diagnostic interpretation (Windowing, 3D Reconstruction).
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <a
                                        href={data.signed_url}
                                        download
                                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download DICOM (.dcm)
                                    </a>
                                </div>
                            </div>
                        )}
                        {!(isPdf || isImage || isDicom) && (
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">Incompatible Direct Preview</p>
                                <a
                                    href={data.signed_url}
                                    download
                                    className="px-8 py-3 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Artifact
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>

            <p className="mt-4 text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Secure Clinical Archive Access • HIPPA COMPLIANT LOGGING ACTIVE</p>
        </div>
    );
}

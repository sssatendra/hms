'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Search, Microscope, FlaskConical,
    ChevronLeft, Edit3, Trash2, Check, X,
    Loader2, Tag, Info, IndianRupee
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/error-boundary';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function LabTestCatalogPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingTest, setEditingTest] = useState<any>(null);
    const [testToDelete, setTestToDelete] = useState<any>(null);

    const { data: tests, isLoading } = useQuery({
        queryKey: ['lab', 'tests', search],
        queryFn: () => coreApi.get<any[]>(`/lab/tests?search=${search}`),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => coreApi.post('/lab/tests', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab', 'tests'] });
            setIsAdding(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => coreApi.put(`/lab/tests/${editingTest.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab', 'tests'] });
            setEditingTest(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => coreApi.delete(`/lab/tests/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab', 'tests'] });
            setTestToDelete(null);
        }
    });

    const testList = tests?.data || [];

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            code: formData.get('code'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price') as string),
            is_active: true
        };

        if (editingTest) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-xl transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Test Catalog</h1>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Laboratory Investigation Registry</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingTest(null);
                        setIsAdding(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    Register New Test
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/10 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search tests by name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        {testList.length} Total Investigations
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {testList.map((test: any) => (
                            <div key={test.id} className="p-4 hover:bg-muted/10 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Microscope className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black">{test.name}</h3>
                                            <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-tighter">
                                                {test.code}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60 italic">{test.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">Investigation Cost</p>
                                        <p className="text-sm font-black text-primary flex items-center justify-end gap-1">
                                            <IndianRupee className="h-3 w-3" />
                                            {test.price}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingTest(test)}
                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setTestToDelete(test)}
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(isAdding || editingTest) && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-primary" />
                                {editingTest ? 'Update Investigation' : 'Register New Investigation'}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingTest(null);
                                }}
                                className="p-2 hover:bg-muted rounded-xl transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5 ml-1">Test Name</label>
                                    <input
                                        name="name"
                                        required
                                        defaultValue={editingTest?.name}
                                        placeholder="e.g. Complete Blood Count"
                                        className="w-full px-4 py-3 bg-muted/10 border-2 border-border rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5 ml-1">Internal Code</label>
                                    <input
                                        name="code"
                                        required
                                        defaultValue={editingTest?.code}
                                        placeholder="e.g. CBC-01"
                                        className="w-full px-4 py-3 bg-muted/10 border-2 border-border rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5 ml-1">Category</label>
                                    <select
                                        name="category"
                                        required
                                        defaultValue={editingTest?.category}
                                        className="w-full px-4 py-3 bg-muted/10 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-primary outline-none transition-all"
                                    >
                                        <option value="HAEMATOLOGY">Haematology</option>
                                        <option value="BIOCHEMISTRY">Biochemistry</option>
                                        <option value="IMMUNOLOGY">Immunology</option>
                                        <option value="MICROBIOLOGY">Microbiology</option>
                                        <option value="RADIOLOGY">Radiology</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1.5 ml-1">Standard Price (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            name="price"
                                            type="number"
                                            required
                                            defaultValue={editingTest?.price}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 bg-muted/10 border-2 border-border rounded-xl text-xs font-bold focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingTest(null);
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    {editingTest ? 'Update Registry' : 'Confirm Registry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!testToDelete}
                onClose={() => setTestToDelete(null)}
                onConfirm={() => deleteMutation.mutate(testToDelete.id)}
                title="Delete Investigation?"
                description={`This will permanently deactivate "${testToDelete?.name}". This action cannot be undone and may affect pending lab orders.`}
                confirmText="Delete Test"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

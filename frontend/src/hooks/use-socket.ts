'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('Connected to MedOrbit Real-time Stream');
        });

        // Global Listeners
        newSocket.on('inventory.low_stock', (data) => {
            toast.warning(`Low Stock: ${data.name}`, {
                description: `Current quantity: ${data.quantity}. Reorder recommended.`,
            });
        });

        newSocket.on('lab.complete', (data) => {
            toast.success(`Lab Result Ready: ${data.patientName}`, {
                description: `Test: ${data.testName}. You can now view the results.`,
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return socket;
}

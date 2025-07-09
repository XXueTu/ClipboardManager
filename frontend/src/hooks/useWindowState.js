import { useState, useEffect } from 'react';
import { GetWindowState } from '../../wailsjs/go/main/App';

/**
 * 窗口状态管理 Hook
 */
export const useWindowState = () => {
    const [windowState, setWindowState] = useState({});

    const updateWindowState = async () => {
        try {
            const state = await GetWindowState();
            setWindowState(state);
        } catch (error) {
            console.error('获取窗口状态失败:', error);
        }
    };

    useEffect(() => {
        updateWindowState();
        
        const interval = setInterval(updateWindowState, 3000);
        return () => clearInterval(interval);
    }, []);

    return {
        windowState,
        updateWindowState
    };
};
import { useEffect, useState } from 'react';
import { GetWindowState } from '../../wailsjs/go/main/App';
import { WindowGetSize } from '../../wailsjs/runtime/runtime';

/**
 * 窗口状态管理 Hook
 */
export const useWindowState = () => {
    const [windowState, setWindowState] = useState({});
    const [windowSize, setWindowSize] = useState({ w: 500, h: 600 }); // 默认尺寸

    const updateWindowState = async () => {
        try {
            const state = await GetWindowState();
            setWindowState(state);
        } catch (error) {
            console.error('获取窗口状态失败:', error);
        }
    };

    const updateWindowSize = async () => {
        try {
            const size = await WindowGetSize();
            setWindowSize(size);
        } catch (error) {
            console.error('获取窗口尺寸失败:', error);
        }
    };

    useEffect(() => {
        updateWindowState();
        updateWindowSize();
        
        const interval = setInterval(() => {
            updateWindowState();
            updateWindowSize();
        }, 3000);
        
        return () => clearInterval(interval);
    }, []);

    return {
        windowState,
        windowSize,
        updateWindowState,
        updateWindowSize
    };
};
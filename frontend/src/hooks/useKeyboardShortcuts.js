import { useEffect } from 'react';
import { HideWindow } from '../../wailsjs/go/main/App';

/**
 * 键盘快捷键管理 Hook
 */
export const useKeyboardShortcuts = () => {
    const handleHideWindow = () => {
        HideWindow();
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleHideWindow();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        handleHideWindow
    };
};
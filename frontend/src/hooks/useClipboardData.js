import { useState, useEffect } from 'react';
import {
    GetClipboardItems, GetTrashItems, GetStatistics, GetSettings
} from '../../wailsjs/go/main/App';

/**
 * 剪切板数据管理 Hook
 */
export const useClipboardData = () => {
    const [clipboardItems, setClipboardItems] = useState([]);
    const [trashItems, setTrashItems] = useState([]);
    const [favoriteItems, setFavoriteItems] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [settings, setSettings] = useState(null);

    const loadClipboardItems = async (retryCount = 0) => {
        try {
            const items = await GetClipboardItems(50, 0);
            setClipboardItems(items || []);
        } catch (error) {
            console.error('加载剪切板数据失败:', error);
            if (retryCount < 2) {
                // 重试最多2次
                setTimeout(() => loadClipboardItems(retryCount + 1), 1000);
            } else {
                console.error('加载剪切板数据失败，请检查应用状态');
                setClipboardItems([]); // 设置为空数组防止崩溃
            }
        }
    };

    const loadTrashItems = async () => {
        try {
            const items = await GetTrashItems(50, 0);
            setTrashItems(items || []);
        } catch (error) {
            console.error('加载回收站数据失败:', error);
        }
    };

    const loadFavoriteItems = async () => {
        try {
            const items = await GetClipboardItems(200, 0);
            const favorites = items ? items.filter(item => item.is_favorite) : [];
            setFavoriteItems(favorites);
        } catch (error) {
            console.error('加载收藏数据失败:', error);
        }
    };

    const loadStatistics = async () => {
        try {
            const stats = await GetStatistics();
            setStatistics(stats);
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const config = await GetSettings();
            setSettings(config);
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    };

    const loadInitialData = async (retryCount = 0) => {
        try {
            const [items, stats, config] = await Promise.all([
                GetClipboardItems(50, 0).catch(e => {
                    console.warn('获取剪切板项目失败:', e);
                    return [];
                }),
                GetStatistics().catch(e => {
                    console.warn('获取统计信息失败:', e);
                    return null;
                }),
                GetSettings().catch(e => {
                    console.warn('获取设置失败:', e);
                    return null;
                })
            ]);
            
            setClipboardItems(items || []);
            setStatistics(stats);
            setSettings(config);
        } catch (error) {
            console.error('加载数据失败:', error);
            if (retryCount < 2) {
                setTimeout(() => loadInitialData(retryCount + 1), 2000);
            } else {
                console.error('初始化失败，某些功能可能不可用');
                // 设置默认值防止崩溃
                setClipboardItems([]);
                setStatistics(null);
                setSettings(null);
            }
        }
    };

    return {
        // 数据状态
        clipboardItems,
        trashItems,
        favoriteItems,
        statistics,
        settings,
        
        // 数据更新状态
        setClipboardItems,
        setTrashItems,
        setFavoriteItems,
        setStatistics,
        setSettings,
        
        // 加载方法
        loadClipboardItems,
        loadTrashItems,
        loadFavoriteItems,
        loadStatistics,
        loadSettings,
        loadInitialData
    };
};
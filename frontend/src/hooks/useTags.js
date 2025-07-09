import { useCallback, useEffect, useState } from 'react';
import {
    AutoGenerateTags,
    CleanupUnusedTags,
    CreateTag,
    CreateTagGroup,
    DeleteTag,
    DeleteTagGroup,
    GetMostUsedTags,
    GetRecentTags,
    GetTagGroups,
    GetTags,
    GetTagStatistics,
    MergeTags,
    SearchTags,
    SuggestTags,
    UpdateItemTags,
    UpdateTag,
    UpdateTagGroup
} from '../../wailsjs/go/main/App';

// 标签管理钩子
export const useTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await GetTags();
      setTags(result || []);
    } catch (err) {
      setError(err);
      console.error('加载标签失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (name, description = '', color = '#3B82F6', groupId = '') => {
    try {
      const newTag = await CreateTag(name, description, color, groupId);
      await loadTags(); // 重新加载标签列表
      return newTag;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadTags]);

  const updateTag = useCallback(async (tag) => {
    try {
      await UpdateTag(tag);
      await loadTags();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadTags]);

  const deleteTag = useCallback(async (tagId) => {
    try {
      await DeleteTag(tagId);
      await loadTags();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadTags]);

  const searchTags = useCallback(async (query) => {
    try {
      const result = await SearchTags(query);
      return result || [];
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    loading,
    error,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    searchTags
  };
};

// 标签分组管理钩子
export const useTagGroups = () => {
  const [tagGroups, setTagGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTagGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await GetTagGroups();
      setTagGroups(result || []);
    } catch (err) {
      setError(err);
      console.error('加载标签分组失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTagGroup = useCallback(async (name, description = '', color = '#3B82F6', sortOrder = 0) => {
    try {
      const newGroup = await CreateTagGroup(name, description, color, sortOrder);
      await loadTagGroups();
      return newGroup;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadTagGroups]);

  const updateTagGroup = useCallback(async (group) => {
    try {
      await UpdateTagGroup(group);
      await loadTagGroups();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadTagGroups]);

  const deleteTagGroup = useCallback(async (groupId) => {
    try {
      await DeleteTagGroup(groupId);
      await loadTagGroups();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadTagGroups]);

  useEffect(() => {
    loadTagGroups();
  }, [loadTagGroups]);

  return {
    tagGroups,
    loading,
    error,
    loadTagGroups,
    createTagGroup,
    updateTagGroup,
    deleteTagGroup
  };
};

// 标签统计钩子
export const useTagStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, mostUsed, recent] = await Promise.all([
        GetTagStatistics(),
        GetMostUsedTags(10),
        GetRecentTags(10)
      ]);
      
      setStatistics(stats);
      setMostUsedTags(mostUsed || []);
      setRecentTags(recent || []);
    } catch (err) {
      setError(err);
      console.error('加载标签统计失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    mostUsedTags,
    recentTags,
    loading,
    error,
    loadStatistics
  };
};

// 智能标签建议钩子
export const useTagSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSuggestions = useCallback(async (content, limit = 5) => {
    if (!content) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await SuggestTags(content, limit);
      setSuggestions(result || []);
      return result || [];
    } catch (err) {
      setError(err);
      console.error('获取标签建议失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAutoTags = useCallback(async (content, contentType = 'text') => {
    if (!content) return [];

    setLoading(true);
    setError(null);
    try {
      const result = await AutoGenerateTags(content, contentType);
      return result || [];
    } catch (err) {
      setError(err);
      console.error('自动生成标签失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
    generateAutoTags
  };
};

// 条目标签管理钩子
export const useItemTags = () => {
  const updateItemTags = useCallback(async (itemId, tagNames) => {
    try {
      await UpdateItemTags(itemId, tagNames);
    } catch (err) {
      console.error('更新条目标签失败:', err);
      throw err;
    }
  }, []);

  return {
    updateItemTags
  };
};

// 标签维护钩子
export const useTagMaintenance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cleanupUnusedTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await CleanupUnusedTags();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const mergeTags = useCallback(async (sourceTagName, targetTagName) => {
    setLoading(true);
    setError(null);
    try {
      await MergeTags(sourceTagName, targetTagName);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    cleanupUnusedTags,
    mergeTags
  };
};
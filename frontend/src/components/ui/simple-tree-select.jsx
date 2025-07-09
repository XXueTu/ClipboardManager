import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from './button';

/**
 * 简单的树形标签选择器
 */
export const SimpleTreeSelect = ({
  value = [],
  onChange,
  placeholder = "请选择",
  className = "",
  size = "sm"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const { GetTagGroups, GetTags } = await import('../../../wailsjs/go/main/App');
        const [groupsData, tagsData] = await Promise.all([
          GetTagGroups(),
          GetTags()
        ]);
        
        setGroups(groupsData || []);
        setTags(tagsData || []);
        
        // 默认展开所有分组
        const allGroupIds = (groupsData || []).map(g => g.id);
        setExpandedGroups(new Set([...allGroupIds, 'ungrouped']));
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    
    loadData();
  }, []);

  // 切换分组展开状态
  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // 切换标签选择
  const toggleTag = (tagName) => {
    if (value.includes(tagName)) {
      onChange(value.filter(v => v !== tagName));
    } else {
      onChange([...value, tagName]);
    }
  };

  // 获取分组下的标签
  const getTagsForGroup = (groupId) => {
    return tags.filter(tag => tag.group_id === groupId);
  };

  // 获取未分组的标签
  const getUngroupedTags = () => {
    return tags.filter(tag => !tag.group_id);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.tree-select-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`tree-select-container relative ${className}`}>
      {/* 标签输入框样式的触发器 */}
      <div
        className="relative min-h-[28px] w-full min-w-32 max-w-80 px-2 py-1 text-xs border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap items-center gap-1 min-h-[20px]">
          {/* 显示选中的标签 */}
          {value.length > 0 ? (
            value.map((tagName) => {
              // 找到对应的标签对象获取颜色
              const tag = tags.find(t => t.name === tagName);
              return (
                <span
                  key={tagName}
                  className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded border"
                  style={{ 
                    borderLeftColor: tag?.color || '#3b82f6',
                    borderLeftWidth: '2px'
                  }}
                >
                  {tagName}
                  <X 
                    className="ml-1 h-2.5 w-2.5 cursor-pointer hover:text-red-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTag(tagName);
                    }}
                  />
                </span>
              );
            })
          ) : (
            <span className="text-gray-400 text-xs py-0.5">{placeholder}</span>
          )}
          
          {/* 下拉箭头 */}
          <ChevronDown className={`ml-auto h-3 w-3 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {/* 头部 */}
          <div className="sticky top-0 p-2 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                选择标签 {value.length > 0 && `(${value.length})`}
              </span>
              {value.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange([])}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                  title="清空所有选择"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* 树形内容 */}
          <div className="p-1">
            {/* 渲染分组 */}
            {groups.map(group => {
              const groupTags = getTagsForGroup(group.id);
              const isExpanded = expandedGroups.has(group.id);
              
              if (groupTags.length === 0) return null;

              return (
                <div key={group.id} className="mb-1">
                  {/* 分组标题 */}
                  <div 
                    className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => toggleGroup(group.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
                    )}
                    <span className="text-sm font-medium" style={{ color: group.color || '#333' }}>
                      {group.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({groupTags.length})
                    </span>
                  </div>

                  {/* 分组标签 */}
                  {isExpanded && (
                    <div className="ml-4">
                      {groupTags.map(tag => (
                        <div
                          key={tag.id}
                          className={`flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer rounded ${
                            value.includes(tag.name) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleTag(tag.name)}
                        >
                          <div className="w-3 mr-2 flex justify-center">
                            {value.includes(tag.name) && (
                              <Check className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                          <span className={`text-sm ${
                            value.includes(tag.name) ? 'text-blue-700 font-medium' : 'text-gray-700'
                          }`}>
                            {tag.name}
                          </span>
                          {tag.color && (
                            <div 
                              className="w-2 h-2 rounded-full ml-auto"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 渲染未分组标签 */}
            {(() => {
              const ungroupedTags = getUngroupedTags();
              const isExpanded = expandedGroups.has('ungrouped');
              
              if (ungroupedTags.length === 0) return null;

              return (
                <div className="mb-1">
                  {/* 未分组标题 */}
                  <div 
                    className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => toggleGroup('ungrouped')}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-500 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-500 mr-1" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      未分组
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({ungroupedTags.length})
                    </span>
                  </div>

                  {/* 未分组标签 */}
                  {isExpanded && (
                    <div className="ml-4">
                      {ungroupedTags.map(tag => (
                        <div
                          key={tag.id}
                          className={`flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer rounded ${
                            value.includes(tag.name) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleTag(tag.name)}
                        >
                          <div className="w-3 mr-2 flex justify-center">
                            {value.includes(tag.name) && (
                              <Check className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                          <span className={`text-sm ${
                            value.includes(tag.name) ? 'text-blue-700 font-medium' : 'text-gray-700'
                          }`}>
                            {tag.name}
                          </span>
                          {tag.color && (
                            <div 
                              className="w-2 h-2 rounded-full ml-auto"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 无数据提示 */}
            {groups.length === 0 && tags.length === 0 && (
              <div className="text-center text-gray-500 py-4 text-sm">
                暂无标签数据
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
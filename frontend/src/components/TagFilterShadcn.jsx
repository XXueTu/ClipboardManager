import { Clock, Filter, Folder, Search, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// shadcn/ui 组件
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import {
    GetMostUsedTags,
    GetRecentTags,
    GetTagGroups,
    GetTags,
    SearchTags
} from '../../wailsjs/go/main/App';

const TagFilterShadcn = ({ 
  value = [], 
  onChange, 
  onGroupChange,
  selectedGroup = '',
  tagMode = 'any', // any, all, none
  onTagModeChange,
  placeholder = '按标签过滤...',
  showModeSelector = true,
  showGroupFilter = true,
  showQuickFilters = true,
  className = ''
}) => {
  const [tags, setTags] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTags(),
        loadTagGroups(),
        loadMostUsedTags(),
        loadRecentTags()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const result = await GetTags();
      setTags(result || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const loadTagGroups = async () => {
    try {
      const result = await GetTagGroups();
      setTagGroups(result || []);
    } catch (error) {
      console.error('加载标签分组失败:', error);
    }
  };

  const loadMostUsedTags = async () => {
    try {
      const result = await GetMostUsedTags(10);
      setMostUsedTags(result || []);
    } catch (error) {
      console.error('加载热门标签失败:', error);
    }
  };

  const loadRecentTags = async () => {
    try {
      const result = await GetRecentTags(10);
      setRecentTags(result || []);
    } catch (error) {
      console.error('加载最近标签失败:', error);
    }
  };

  const handleTagToggle = (tagName) => {
    if (value.includes(tagName)) {
      onChange?.(value.filter(t => t !== tagName));
    } else {
      onChange?.([...value, tagName]);
    }
  };

  const handleGroupSelect = (groupId) => {
    onGroupChange?.(groupId);
  };

  const handleTagModeChange = (mode) => {
    onTagModeChange?.(mode);
  };

  const handleClearAll = () => {
    onChange?.([]);
    onGroupChange?.('');
  };

  const handleSearch = async (searchValue) => {
    setSearchText(searchValue);
    if (searchValue) {
      try {
        const result = await SearchTags({
          query: searchValue,
          limit: 50,
          offset: 0
        });
        setTags(result || []);
      } catch (error) {
        console.error('搜索标签失败:', error);
      }
    } else {
      loadTags();
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getFilterSummary = () => {
    let summary = [];
    
    if (value.length > 0) {
      summary.push(`${value.length} 个标签`);
    }
    
    if (selectedGroup) {
      const group = tagGroups.find(g => g.id === selectedGroup);
      if (group) {
        summary.push(`分组: ${group.name}`);
      }
    }
    
    if (tagMode !== 'any') {
      const modeText = {
        'all': '全部匹配',
        'none': '排除标签'
      };
      summary.push(modeText[tagMode]);
    }
    
    return summary.join(', ');
  };

  const hasActiveFilters = value.length > 0 || selectedGroup;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* 过滤按钮 */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={hasActiveFilters ? "border-blue-500 bg-blue-50" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              标签过滤
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
                  {value.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4">
              {/* 标题和清空按钮 */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium">标签过滤</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearAll}
                  className="h-6 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  清空
                </Button>
              </div>

              {/* 搜索框 */}
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索标签..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* 标签匹配模式 */}
              {showModeSelector && (
                <div>
                  <Label className="text-sm font-medium">匹配模式</Label>
                  <RadioGroup 
                    value={tagMode} 
                    onValueChange={handleTagModeChange}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="any" id="any" />
                      <Label htmlFor="any" className="text-sm">任意匹配</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="text-sm">全部匹配</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none" className="text-sm">排除标签</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* 分组过滤 */}
              {showGroupFilter && (
                <div>
                  <Label className="text-sm font-medium">按分组过滤</Label>
                  <Select value={selectedGroup} onValueChange={handleGroupSelect}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="选择分组" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有分组</SelectItem>
                      {tagGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" style={{ color: group.color }} />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* 快速选择和标签列表 */}
              <Tabs defaultValue="quick" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="quick">快速选择</TabsTrigger>
                  <TabsTrigger value="all">所有标签</TabsTrigger>
                </TabsList>
                
                <TabsContent value="quick" className="space-y-4">
                  {/* 热门标签 */}
                  {mostUsedTags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        热门标签
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mostUsedTags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant={value.includes(tag.name) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => handleTagToggle(tag.name)}
                          >
                            {tag.name} ({tag.use_count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 最近使用 */}
                  {recentTags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        最近使用
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recentTags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant={value.includes(tag.name) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => handleTagToggle(tag.name)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="all">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredTags.map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={tag.id}
                            checked={value.includes(tag.name)}
                            onCheckedChange={() => handleTagToggle(tag.name)}
                          />
                          <Label htmlFor={tag.id} className="cursor-pointer">
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          </Label>
                        </div>
                        {tag.use_count > 0 && (
                          <span className="text-xs text-gray-500">
                            {tag.use_count} 次
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </PopoverContent>
        </Popover>

        {/* 当前过滤状态显示 */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span>过滤: {getFilterSummary()}</span>
          </div>
        )}
      </div>

      {/* 已选标签显示 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map(tagName => {
            const tag = tags.find(t => t.name === tagName);
            return (
              <Badge
                key={tagName}
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {tagName}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                  onClick={() => handleTagToggle(tagName)}
                />
              </Badge>
            );
          })}
        </div>
      )}

      {/* 分组过滤显示 */}
      {selectedGroup && (
        <div className="mt-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Folder className="w-3 h-3 mr-1" />
            {tagGroups.find(g => g.id === selectedGroup)?.name || '未知分组'}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
              onClick={() => handleGroupSelect('')}
            />
          </Badge>
        </div>
      )}
    </div>
  );
};

export default TagFilterShadcn;
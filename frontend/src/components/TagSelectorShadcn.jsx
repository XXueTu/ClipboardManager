import { Clock, Lightbulb, Plus, Search, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// shadcn/ui 组件
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';

import {
    AutoGenerateTags,
    CreateTag,
    GetMostUsedTags,
    GetRecentTags,
    GetTags,
    SuggestTags,
    UpdateItemTags
} from '../../wailsjs/go/main/App';

const TagSelectorShadcn = ({ 
  value = [], 
  onChange, 
  itemId, 
  content = '', 
  contentType = 'text',
  placeholder = '选择标签...',
  showSuggestions = true,
  showAutoGenerate = true,
  disabled = false,
  className = ''
}) => {
  const { toast } = useToast();
  const [tags, setTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [mostUsedTags, setMostUsedTags] = useState([]);
  const [recentTags, setRecentTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 新标签表单状态
  const [newTagForm, setNewTagForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadTags();
    if (showSuggestions) {
      loadMostUsedTags();
      loadRecentTags();
    }
  }, []);

  useEffect(() => {
    if (content && showSuggestions) {
      loadContentSuggestions();
    }
  }, [content, contentType]);

  const loadTags = async () => {
    try {
      const result = await GetTags();
      setTags(result || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const loadContentSuggestions = async () => {
    if (!content) return;
    try {
      const result = await SuggestTags(content, 6);
      setSuggestions(result || []);
    } catch (error) {
      console.error('加载内容建议失败:', error);
    }
  };

  const loadMostUsedTags = async () => {
    try {
      const result = await GetMostUsedTags(6);
      setMostUsedTags(result || []);
    } catch (error) {
      console.error('加载热门标签失败:', error);
    }
  };

  const loadRecentTags = async () => {
    try {
      const result = await GetRecentTags(6);
      setRecentTags(result || []);
    } catch (error) {
      console.error('加载最近标签失败:', error);
    }
  };

  const handleAutoGenerate = async () => {
    if (!content) {
      toast.error('没有内容可以分析');
      return;
    }

    setLoading(true);
    try {
      const autoTags = await AutoGenerateTags(content, contentType);
      const newTags = [...new Set([...value, ...autoTags])];
      
      onChange?.(newTags);
      
      if (itemId) {
        await UpdateItemTags(itemId, newTags);
      }
      
      toast.success(`自动生成了 ${autoTags.length} 个标签`);
    } catch (error) {
      toast.error('自动生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagForm.name.trim()) {
      toast.error('请输入标签名称');
      return;
    }

    try {
      await CreateTag(
        newTagForm.name.trim(), 
        newTagForm.description || '', 
        newTagForm.color || '#3B82F6', 
        ''
      );
      
      await loadTags();
      
      const newTags = [...value, newTagForm.name.trim()];
      onChange?.(newTags);
      
      if (itemId) {
        await UpdateItemTags(itemId, newTags);
      }
      
      toast.success('标签创建成功');
      setCreateModalOpen(false);
      setNewTagForm({ name: '', description: '', color: '#3B82F6' });
    } catch (error) {
      toast.error('创建失败');
    }
  };

  const handleQuickAdd = (tagName) => {
    if (value.includes(tagName)) {
      toast.error('标签已存在');
      return;
    }
    
    const newTags = [...value, tagName];
    onChange?.(newTags);
    
    if (itemId) {
      UpdateItemTags(itemId, newTags);
    }
  };

  const handleRemoveTag = (tagName) => {
    const newTags = value.filter(tag => tag !== tagName);
    onChange?.(newTags);
    
    if (itemId) {
      UpdateItemTags(itemId, newTags);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getTagColor = (tagName) => {
    const tag = tags.find(t => t.name === tagName);
    return tag?.color || '#3B82F6';
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* 标签显示 */}
        {value.map(tagName => (
          <Badge
            key={tagName}
            variant="secondary"
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            {tagName}
            {!disabled && (
              <X 
                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                onClick={() => handleRemoveTag(tagName)}
              />
            )}
          </Badge>
        ))}
        
        {/* 添加标签按钮 */}
        {!disabled && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                添加标签
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
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

                {/* 自动生成按钮 */}
                {showAutoGenerate && content && (
                  <Button 
                    onClick={handleAutoGenerate}
                    disabled={loading}
                    className="w-full"
                    size="sm"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    {loading ? '生成中...' : '智能生成标签'}
                  </Button>
                )}

                {/* 建议标签 */}
                {showSuggestions && suggestions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      建议标签
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestions.map(tag => (
                        <Badge
                          key={tag}
                          variant={value.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleQuickAdd(tag)}
                        >
                          {tag}
                          {value.includes(tag) && ' ✓'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
                          onClick={() => handleQuickAdd(tag.name)}
                        >
                          {tag.name} ({tag.use_count})
                          {value.includes(tag.name) && ' ✓'}
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
                          onClick={() => handleQuickAdd(tag.name)}
                        >
                          {tag.name}
                          {value.includes(tag.name) && ' ✓'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* 现有标签列表 */}
                <div>
                  <Label className="text-sm font-medium">选择标签</Label>
                  <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                    {filteredTags.map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleQuickAdd(tag.name)}
                      >
                        <Badge
                          variant={value.includes(tag.name) ? "default" : "outline"}
                          style={{ backgroundColor: value.includes(tag.name) ? getTagColor(tag.name) : 'transparent' }}
                        >
                          {tag.name}
                        </Badge>
                        {tag.use_count > 0 && (
                          <span className="text-xs text-gray-500">
                            {tag.use_count} 次
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 创建新标签 */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      创建新标签
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>创建新标签</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tag-name">标签名称</Label>
                        <Input
                          id="tag-name"
                          placeholder="输入标签名称"
                          value={newTagForm.name}
                          onChange={(e) => setNewTagForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tag-description">描述（可选）</Label>
                        <Textarea
                          id="tag-description"
                          placeholder="输入描述"
                          rows={2}
                          value={newTagForm.description}
                          onChange={(e) => setNewTagForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tag-color">颜色</Label>
                        <Input
                          id="tag-color"
                          type="color"
                          value={newTagForm.color}
                          onChange={(e) => setNewTagForm(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full h-10"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleCreateTag} className="flex-1">
                          创建
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setCreateModalOpen(false)}
                          className="flex-1"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default TagSelectorShadcn;
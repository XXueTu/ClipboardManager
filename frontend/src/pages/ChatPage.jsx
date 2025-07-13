import {
    AlertTriangle,
    Bot,
    ChevronDown,
    Copy,
    Edit3,
    MessageCircle,
    Plus,
    Send,
    Trash2,
    User
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
    CreateChatSession,
    DeleteChatSession,
    GetChatMessages,
    GetChatSessions,
    SendChatMessage,
    UpdateChatSession
} from '../../wailsjs/go/main/App';
import { StreamingMarkdown } from '../components';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';

// Markdown渲染组件
const MessageContent = ({ content, isUser = false, isStreaming = false }) => {
    // 添加调试日志
    console.log('MessageContent 渲染:', {
        isUser,
        isStreaming,
        contentLength: content.length,
        hasTable: content.includes('|')
    });

    if (isUser) {
        return (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {content}
            </div>
        );
    }

    // 使用StreamingMarkdown组件
    return (
        <StreamingMarkdown 
            content={content} 
            isStreaming={isStreaming}
        />
    );
};

// 历史会话弹出组件
const SessionDropdown = ({ sessions, currentSession, onSelectSession, onCreateSession, onEditSession, onDeleteSession, isOpen, onClose }) => {
    const [editingSession, setEditingSession] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const startEdit = (session) => {
        setEditingSession(session.id);
        setEditTitle(session.title);
    };

    const saveEdit = async () => {
        if (editingSession && editTitle.trim()) {
            await onEditSession(editingSession, editTitle.trim());
            setEditingSession(null);
            setEditTitle('');
        }
    };

    const cancelEdit = () => {
        setEditingSession(null);
        setEditTitle('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
        if (e.key === 'Escape') {
            cancelEdit();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-2xl z-[9999] max-h-96 overflow-y-auto backdrop-blur-sm"
            style={{ 
                zIndex: 9999,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
        >
            <div className="p-3 border-b border-border">
                <Button onClick={onCreateSession} className="w-full" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    新建对话
                </Button>
            </div>
            
            <div className="p-2">
                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">还没有对话记录</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sessions.map(session => (
                            <div 
                                key={session.id}
                                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/60 ${
                                    currentSession?.id === session.id 
                                        ? 'bg-primary/10 border border-primary/20' 
                                        : 'hover:bg-muted/50'
                                }`}
                                onClick={() => !editingSession && onSelectSession(session)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-2">
                                        {editingSession === session.id ? (
                                            <Input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                onBlur={saveEdit}
                                                className="text-sm h-7 px-2"
                                                autoFocus
                                            />
                                        ) : (
                                            <>
                                                <h3 className="font-medium text-sm truncate mb-1">
                                                    {session.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground truncate mb-2">
                                                    {session.last_message || '开始新对话...'}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{session.message_count || 0} 条消息</span>
                                                    <span>•</span>
                                                    <span>{new Date(session.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    {!editingSession && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEdit(session);
                                                }}
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSession(session.id, session.title);
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatPage = () => {
    const { toast } = useToast();
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
        isOpen: false,
        sessionId: null,
        sessionTitle: ''
    });
    const messagesEndRef = useRef(null);

    // 监听messages变化
    useEffect(() => {
        console.log('Messages状态变化:', messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            contentLength: msg.content.length,
            isStreaming: msg.isStreaming,
            hasTable: msg.content.includes('|')
        })));
    }, [messages]);

    // 监听isStreaming变化
    useEffect(() => {
        console.log('ChatPage isStreaming状态变化:', isStreaming);
    }, [isStreaming]);

    // 加载会话列表
    const loadSessions = async () => {
        try {
            const result = await GetChatSessions();
            const sessions = result.sessions || [];
            setSessions(sessions);
            
            // 自动选择最近的会话（如果存在且当前没有选中会话）
            if (sessions.length > 0 && !currentSession) {
                // 按last_active_at排序，选择最近的会话
                const mostRecentSession = sessions.reduce((latest, session) => {
                    const latestTime = new Date(latest.last_active_at || latest.updated_at);
                    const sessionTime = new Date(session.last_active_at || session.updated_at);
                    return sessionTime > latestTime ? session : latest;
                });
                
                console.log('自动选择最近的会话:', mostRecentSession.title);
                setCurrentSession(mostRecentSession);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
            toast.error('加载会话失败');
        }
    };

    // 加载消息历史
    const loadMessages = async (sessionId) => {
        if (!sessionId) {
            console.warn('尝试加载消息但sessionId为空');
            setMessages([]);
            return;
        }

        try {
            const result = await GetChatMessages(sessionId, 100, 0);
            const messages = result.messages || [];
            console.log(`加载会话 ${sessionId} 的消息，共 ${messages.length} 条`);
            setMessages(messages);
            
            // 延迟滚动，确保DOM已更新
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('加载消息失败');
            // 出错时也要清空消息列表，避免显示错误的消息
            setMessages([]);
        }
    };

    // 创建新会话
    const createSession = async () => {
        try {
            const title = `新对话 ${new Date().toLocaleString()}`;
            const session = await CreateChatSession(title);
            setSessions(prev => [session, ...prev]);
            setCurrentSession(session);
            setMessages([]);
            setIsSessionDropdownOpen(false);
            console.log('手动创建新会话:', session.title);
            toast.success('创建新会话');
        } catch (error) {
            console.error('Failed to create session:', error);
            toast.error('创建会话失败');
        }
    };

    // 删除会话
    const deleteSession = async (sessionId, sessionTitle) => {
        // 打开确认对话框
        setDeleteConfirmDialog({
            isOpen: true,
            sessionId,
            sessionTitle
        });
    };

    // 确认删除会话
    const confirmDeleteSession = async () => {
        const { sessionId } = deleteConfirmDialog;
        
        try {
            await DeleteChatSession(sessionId);
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);
            
            // 如果删除的是当前会话，需要选择新的会话
            if (currentSession?.id === sessionId) {
                if (updatedSessions.length > 0) {
                    // 选择最近的会话
                    const mostRecentSession = updatedSessions.reduce((latest, session) => {
                        const latestTime = new Date(latest.last_active_at || latest.updated_at);
                        const sessionTime = new Date(session.last_active_at || session.updated_at);
                        return sessionTime > latestTime ? session : latest;
                    });
                    console.log('删除当前会话后，自动选择最近的会话:', mostRecentSession.title);
                    setCurrentSession(mostRecentSession);
                } else {
                    // 没有会话了，清空状态
                    console.log('删除最后一个会话，返回欢迎界面');
                    setCurrentSession(null);
                    setMessages([]);
                }
            }
            
            toast.success('删除会话成功');
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error('删除会话失败');
        } finally {
            // 关闭确认对话框
            setDeleteConfirmDialog({
                isOpen: false,
                sessionId: null,
                sessionTitle: ''
            });
        }
    };

    // 取消删除会话
    const cancelDeleteSession = () => {
        setDeleteConfirmDialog({
            isOpen: false,
            sessionId: null,
            sessionTitle: ''
        });
    };

    // 编辑会话标题
    const editSessionTitle = async (sessionId, newTitle) => {
        try {
            const updatedSession = await UpdateChatSession(sessionId, newTitle);
            setSessions(prev => prev.map(s => 
                s.id === sessionId ? { ...s, title: newTitle } : s
            ));
            if (currentSession?.id === sessionId) {
                setCurrentSession(prev => ({ ...prev, title: newTitle }));
            }
            toast.success('会话标题已更新');
        } catch (error) {
            console.error('Failed to update session:', error);
            toast.error('更新会话标题失败');
        }
    };

    // 选择会话
    const selectSession = (session) => {
        if (session.id === currentSession?.id) {
            console.log('选择的会话已经是当前会话，跳过加载');
            setIsSessionDropdownOpen(false);
            return;
        }
        
        console.log('切换到会话:', session.title);
        setCurrentSession(session);
        setIsSessionDropdownOpen(false);
        
        // 显示加载提示
        toast.success(`切换到: ${session.title}`);
    };

    // 发送消息
    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();

        // 如果没有当前会话，先创建一个
        let sessionToUse = currentSession;
        if (!sessionToUse) {
            try {
                console.log('没有当前会话，创建新会话...');
                const title = `新对话 ${new Date().toLocaleString()}`;
                sessionToUse = await CreateChatSession(title);
                setSessions(prev => [sessionToUse, ...prev]);
                setCurrentSession(sessionToUse);
                setMessages([]);
                console.log('新会话创建成功:', sessionToUse.title);
            } catch (error) {
                console.error('Failed to create session:', error);
                toast.error('创建会话失败');
                return;
            }
        }

        setInputMessage('');
        setIsLoading(true);
        setIsStreaming(true);

        console.log('开始发送消息:', userMessage);

        // 添加用户消息
        const userMsg = {
            id: Date.now(),
            content: userMessage,
            role: 'user',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);

        // 添加AI消息占位符
        const aiMsg = {
            id: Date.now() + 1,
            content: '',
            role: 'assistant',
            created_at: new Date().toISOString(),
            isStreaming: true
        };
        console.log('创建AI消息占位符:', aiMsg);
        setMessages(prev => [...prev, aiMsg]);

        // 降级到普通API
        const fallbackToNormalAPI = async () => {
            console.log('执行fallback API');
            try {
                const response = await SendChatMessage(sessionToUse.id, userMessage);
                console.log('Fallback API响应:', response);
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMsg.id 
                        ? { ...msg, content: response.content, isStreaming: false }
                        : msg
                ));
                console.log('Fallback API完成，设置isStreaming=false');
            } catch (error) {
                console.error('Failed to send message:', error);
                let errorMessage = '抱歉，AI服务暂时不可用。';
                
                // 根据错误类型提供更具体的信息
                if (error.message && error.message.includes('network')) {
                    errorMessage = '❌ 网络连接失败，请检查网络连接后重试。';
                } else if (error.message && error.message.includes('timeout')) {
                    errorMessage = '⏱️ 请求超时，AI服务响应较慢，请稍后重试。';
                } else if (error.message && (error.message.includes('unauthorized') || error.message.includes('401'))) {
                    errorMessage = '🔑 AI服务认证失败，请联系管理员检查API密钥配置。';
                } else if (error.message && (error.message.includes('quota') || error.message.includes('limit'))) {
                    errorMessage = '📊 AI服务配额不足，请稍后重试或联系管理员。';
                } else if (error.message && error.message.includes('model')) {
                    errorMessage = '🤖 AI模型加载失败，请稍后重试。';
                }
                
                // 使用本地测试响应作为备用
                const localResponse = getLocalTestResponse(userMessage);
                
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMsg.id 
                        ? { ...msg, content: localResponse, isStreaming: false }
                        : msg
                ));
                toast.error('AI服务暂时不可用，已切换到本地测试模式');
            } finally {
                setIsLoading(false);
                setIsStreaming(false);
            }
        };

        try {
            // 尝试使用流式API
            const processStream = async () => {
                console.log('尝试使用流式API');
                const response = await fetch('/api/chat/stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: sessionToUse.id,
                        message: userMessage
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let currentEvent = '';

                console.log('开始读取流式响应');

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log('流式响应读取完成');
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim() === '') {
                            // 空行表示事件结束，处理当前事件
                            continue;
                        }
                        
                        if (line.startsWith('event: ')) {
                            currentEvent = line.slice(7).trim();
                        } else if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                console.log('收到[DONE]信号');
                                setIsStreaming(false);
                                setIsLoading(false);
                                return;
                            }
                            // 直接处理事件和数据
                            handleSSEEvent(currentEvent, data);
                        }
                    }
                }
            };

            const handleSSEEvent = (eventType, data) => {
                console.log('处理SSE事件:', { eventType, data });
                switch (eventType) {
                    case 'message':
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsg.id 
                                ? { ...msg, content: msg.content + data, isStreaming: true }
                                : msg
                        ));
                        break;
                    case 'error':
                        console.error('Stream error:', data);
                        let streamErrorMessage = '抱歉，AI服务出现了问题。';
                        
                        // 尝试解析错误信息
                        try {
                            if (typeof data === 'string') {
                                if (data.includes('network') || data.includes('connection')) {
                                    streamErrorMessage = '❌ 网络连接中断，请检查网络后重试。';
                                } else if (data.includes('timeout')) {
                                    streamErrorMessage = '⏱️ 服务响应超时，请稍后重试。';
                                } else if (data.includes('unauthorized') || data.includes('401')) {
                                    streamErrorMessage = '🔑 服务认证失败，请联系管理员。';
                                } else if (data.includes('quota') || data.includes('limit')) {
                                    streamErrorMessage = '📊 服务配额不足，请稍后重试。';
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing stream error:', e);
                        }
                        
                        streamErrorMessage += '\n\n💡 建议：\n• 刷新页面重试\n• 检查网络连接\n• 稍后再试';
                        
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsg.id 
                                ? { ...msg, content: streamErrorMessage, isStreaming: false }
                                : msg
                        ));
                        setIsStreaming(false);
                        setIsLoading(false);
                        break;
                    case 'done':
                        // 流式输出完成后，切换到ReactMarkdown渲染
                        console.log('流式输出完成，设置isStreaming=false');
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsg.id 
                                ? { ...msg, isStreaming: false }
                                : msg
                        ));
                        setIsStreaming(false);
                        setIsLoading(false);
                        break;
                }
            };

            // 检查是否在 Wails 环境中
            const isWails = window.wails && window.wails.go;
            if (isWails) {
                console.log("在 Wails 环境中，直接使用普通API");
                await fallbackToNormalAPI();
            } else {
                await processStream();
            }
        } catch (error) {
            console.error('Streaming failed, falling back to normal API:', error);
            await fallbackToNormalAPI();
        }
    };

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 处理键盘事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 本地测试模式 - 当AI服务不可用时使用
    const getLocalTestResponse = (userMessage) => {
        const message = userMessage.toLowerCase();
        
        if (message.includes('你好') || message.includes('hello') || message.includes('hi')) {
            return '你好！我是AI助手。目前AI服务正在维护中，这是一个本地测试响应。\n\n✨ 功能说明：\n• 剪切板管理\n• 收藏内容\n• 标签管理\n• 数据统计';
        } else if (message.includes('帮助') || message.includes('help')) {
            return '📝 使用帮助：\n\n1. **剪切板**: 自动捕获复制的内容\n2. **收藏**: 标记重要内容\n3. **标签**: 分类管理内容\n4. **对话**: AI助手（需要网络连接）\n5. **统计**: 查看使用数据\n6. **设置**: 个性化配置\n\n💡 提示：AI服务恢复后将提供完整的智能对话功能。';
        } else if (message.includes('功能') || message.includes('feature')) {
            return '🚀 主要功能：\n\n• 📋 **智能剪切板**: 自动捕获和管理复制内容\n• ⭐ **收藏系统**: 保存重要信息\n• 🏷️ **标签管理**: 智能分类和搜索\n• 🤖 **AI对话**: 智能助手（维护中）\n• 📊 **数据统计**: 使用情况分析\n• ⚙️ **个性化设置**: 自定义体验';
        } else if (message.includes('测试') || message.includes('test')) {
            return '🧪 测试模式激活！\n\n当前状态：\n• ✅ 前端界面正常\n• ✅ 本地存储可用\n• ✅ 基础功能运行中\n• ⚠️ AI服务维护中\n\n请稍后重试AI功能，或继续使用其他功能。';
        } else {
            return `收到您的消息："${userMessage}"\n\n🔧 AI服务正在维护中，暂时无法提供智能回复。\n\n您可以：\n• 使用剪切板管理功能\n• 查看收藏和标签\n• 等待AI服务恢复\n\n💡 预计恢复时间：请关注系统通知`;
        }
    };

    // 复制消息
    const copyMessage = (content) => {
        navigator.clipboard.writeText(content);
        toast.success('已复制');
    };

    // 初始化
    useEffect(() => {
        loadSessions();
    }, []);

    // 监听当前会话变化
    useEffect(() => {
        if (currentSession) {
            loadMessages(currentSession.id);
        }
    }, [currentSession]);

    // 监听消息变化，自动滚动
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="h-full flex flex-col bg-background">
            {/* 顶部会话控制栏 */}
            <div className="flex-shrink-0 p-3 border-b border-border bg-background/95 backdrop-blur-sm relative z-50">
                <div className="flex items-center gap-2">
                    {/* 当前会话显示 */}
                    <div className="flex-1 min-w-0 relative z-50">
                        <Button
                            variant="outline"
                            className="w-full justify-between h-10 px-3"
                            onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Bot className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="truncate text-sm">
                                    {currentSession ? currentSession.title : '选择或创建会话'}
                                </span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
                        </Button>
                        
                        {/* 会话下拉菜单 */}
                        <SessionDropdown
                            sessions={sessions}
                            currentSession={currentSession}
                            onSelectSession={selectSession}
                            onCreateSession={createSession}
                            onEditSession={editSessionTitle}
                            onDeleteSession={deleteSession}
                            isOpen={isSessionDropdownOpen}
                            onClose={() => setIsSessionDropdownOpen(false)}
                        />
                    </div>

                    {/* 快捷新建按钮 */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={createSession}
                        className="flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* 主聊天区域 */}
            <div className="flex-1 flex flex-col min-h-0">
                {currentSession ? (
                    <>
                        {/* 消息列表 */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent p-3 min-h-0">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center max-w-md">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-4">
                                            <Bot className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">开始与AI对话</h3>
                                        <p className="text-sm text-muted-foreground">
                                            输入您的问题或想法，AI会为您提供智能回答和建议
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-4">
                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 ${
                                                message.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Bot className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                            
                                            <div className={`group max-w-[80%] ${
                                                message.role === 'user' 
                                                    ? 'order-2' 
                                                    : 'order-1'
                                            }`}>
                                                <div className={`p-3 rounded-lg shadow-sm border text-sm ${
                                                    message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground border-primary/20'
                                                        : 'bg-muted/50 border-border'
                                                }`}>
                                                    <MessageContent 
                                                        content={message.content} 
                                                        isUser={message.role === 'user'} 
                                                        isStreaming={message.isStreaming} 
                                                    />
                                                </div>
                                                
                                                <div className={`flex items-center gap-2 mt-1.5 text-xs text-muted-foreground ${
                                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                                }`}>
                                                    <span>
                                                        {new Date(message.created_at).toLocaleTimeString()}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => copyMessage(message.content)}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {message.role === 'user' && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <User className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">欢迎使用AI助手</h3>
                            <p className="text-muted-foreground mb-6">
                                您可以直接在下方输入框中输入问题开始对话，<br />
                                或者点击按钮手动创建新会话
                            </p>
                            <Button onClick={createSession} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                手动创建新对话
                            </Button>
                        </div>
                    </div>
                )}

                {/* 输入区域 - 固定在底部 */}
                <div className="flex-shrink-0 p-3 border-t border-border bg-background/95 backdrop-blur-sm">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={currentSession ? "输入您的问题..." : "输入问题开始新对话..."}
                                disabled={isLoading}
                                className="pr-12 text-sm h-10"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                size="sm"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    
                    {isLoading && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            AI正在思考中...
                        </div>
                    )}
                </div>
            </div>

            {/* 删除会话确认对话框 */}
            <AlertDialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => !open && cancelDeleteSession()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            确认删除会话
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除会话 "<span className="font-medium text-foreground">{deleteConfirmDialog.sessionTitle}</span>" 吗？
                            <br />
                            <span className="text-destructive/80 text-sm">此操作无法撤销，会话中的所有消息都将被永久删除。</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDeleteSession}>
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteSession}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ChatPage; 
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
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    CreateChatSession,
    DeleteChatSession,
    GetChatMessages,
    GetChatSessions,
    SendChatMessage,
    UpdateChatSession
} from '../../wailsjs/go/main/App';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';

// Markdown渲染组件
const MessageContent = ({ content, isUser = false, isStreaming = false }) => {
    if (isUser) {
        return (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {content}
            </div>
        );
    }

    // AI消息使用简化的markdown渲染
    return (
        <div className="text-sm leading-relaxed">
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="relative my-4">
                                <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg text-sm">
                                    <span>{match[1]}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                        onClick={() => {
                                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                        }}
                                    >
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="!mt-0 !rounded-t-none"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code 
                                className={`${isUser ? 'bg-primary-foreground/20' : 'bg-muted'} px-1.5 py-0.5 rounded text-sm font-mono`} 
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    pre({ children }) {
                        return <div className="overflow-x-auto">{children}</div>;
                    },
                    blockquote({ children }) {
                        return (
                            <blockquote className={`border-l-4 pl-4 py-2 my-4 italic ${
                                isUser ? 'border-primary-foreground/30' : 'border-muted-foreground/30'
                            }`}>
                                {children}
                            </blockquote>
                        );
                    },
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className="min-w-full border-collapse border border-border">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    th({ children }) {
                        return (
                            <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                                {children}
                            </th>
                        );
                    },
                    td({ children }) {
                        return (
                            <td className="border border-border px-4 py-2">
                                {children}
                            </td>
                        );
                    }
                }}
                className="prose prose-sm max-w-none dark:prose-invert"
            >
                {content}
            </ReactMarkdown>
            {isStreaming && (
                <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
            )}
        </div>
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

    // 加载会话列表
    const loadSessions = async () => {
        try {
            const result = await GetChatSessions();
            setSessions(result.sessions || []);
        } catch (error) {
            console.error('Failed to load sessions:', error);
            toast.error('加载会话失败');
        }
    };

    // 加载消息历史
    const loadMessages = async (sessionId) => {
        try {
            const result = await GetChatMessages(sessionId, 100, 0);
            setMessages(result.messages || []);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('加载消息失败');
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
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSession?.id === sessionId) {
                setCurrentSession(null);
                setMessages([]);
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
        setCurrentSession(session);
        setIsSessionDropdownOpen(false);
    };

    // 发送消息
    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        if (!currentSession) {
            await createSession();
            return;
        }

        const userMessage = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);
        setIsStreaming(true);

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
        setMessages(prev => [...prev, aiMsg]);

        try {
            // 尝试使用流式API
            const processStream = async () => {
                const response = await fetch('/api/chat/stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: currentSession.id,
                        message: userMessage
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                setIsStreaming(false);
                                setIsLoading(false);
                                return;
                            }
                            try {
                                const event = JSON.parse(data);
                                handleSSEEvent(event.type, event.data);
                            } catch (e) {
                                console.error('Error parsing SSE data:', e);
                            }
                        }
                    }
                }
            };

            const handleSSEEvent = (eventType, data) => {
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
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsg.id 
                                ? { ...msg, content: '抱歉，出现了错误。', isStreaming: false }
                                : msg
                        ));
                        setIsStreaming(false);
                        setIsLoading(false);
                        break;
                    case 'done':
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

            await processStream();
        } catch (error) {
            console.error('Streaming failed, falling back to normal API:', error);
            await fallbackToNormalAPI();
        }
    };

    // 降级到普通API
    const fallbackToNormalAPI = async () => {
        try {
            const response = await SendChatMessage(currentSession.id, inputMessage);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMsg.id 
                    ? { ...msg, content: response.content, isStreaming: false }
                    : msg
            ));
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMsg.id 
                    ? { ...msg, content: '抱歉，发送消息失败。', isStreaming: false }
                    : msg
            ));
            toast.error('发送消息失败');
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
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
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent p-3">
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
                                <div className="space-y-4">
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

                        {/* 输入区域 */}
                        <div className="flex-shrink-0 p-3 border-t border-border bg-background/95 backdrop-blur-sm">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Input
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="输入您的问题..."
                                        disabled={isLoading}
                                        className="pr-12 text-sm"
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
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">欢迎使用AI助手</h3>
                            <p className="text-muted-foreground mb-6">
                                创建新对话或从历史记录中选择一个会话开始聊天
                            </p>
                            <Button onClick={createSession} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                开始新对话
                            </Button>
                        </div>
                    </div>
                )}
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
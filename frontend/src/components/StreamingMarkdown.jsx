import { Copy } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';

const StreamingMarkdown = ({ content, isStreaming = false }) => {
    const [shouldRenderMarkdown, setShouldRenderMarkdown] = useState(false);

    // 添加日志来调试
    console.log('StreamingMarkdown render:', {
        isStreaming,
        contentLength: content.length,
        shouldRenderMarkdown,
        hasTable: content.includes('|'),
        contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
    });

    // 当流式状态变化时，重置markdown渲染状态
    useEffect(() => {
        console.log('StreamingMarkdown useEffect triggered:', {
            isStreaming,
            contentLength: content.length,
            contentTrimmed: content.trim().length,
            shouldRenderMarkdown,
            hasTable: content.includes('|')
        });

        if (isStreaming) {
            console.log('设置为流式模式，禁用markdown渲染');
            setShouldRenderMarkdown(false);
        } else if (content.trim()) {
            console.log('流式输出完成，将在100ms后启用markdown渲染');
            // 流式输出完成，延迟一下再渲染markdown，确保内容稳定
            const timer = setTimeout(() => {
                console.log('延迟时间到，启用markdown渲染');
                setShouldRenderMarkdown(true);
            }, 100);
            return () => {
                console.log('清理定时器');
                clearTimeout(timer);
            };
        } else {
            console.log('内容为空，禁用markdown渲染');
            setShouldRenderMarkdown(false);
        }
    }, [isStreaming, content]);

    // 监听shouldRenderMarkdown状态变化
    useEffect(() => {
        console.log('shouldRenderMarkdown 状态变化:', {
            shouldRenderMarkdown,
            isStreaming,
            contentLength: content.length,
            hasTable: content.includes('|')
        });
    }, [shouldRenderMarkdown, isStreaming, content]);

    // 优化的markdown组件配置
    const markdownComponents = useMemo(() => ({
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
                                try {
                                    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                } catch (error) {
                                    console.error('Failed to copy to clipboard:', error);
                                }
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
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" 
                    {...props}
                >
                    {children}
                </code>
            );
        },
        table({ children, ...props }) {
            console.log('渲染表格组件:', { children, props });
            return (
                <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border rounded-lg">
                        {children}
                    </table>
                </div>
            );
        },
        thead({ children, ...props }) {
            console.log('渲染表头组件:', { children, props });
            return (
                <thead className="bg-muted/50">
                    {children}
                </thead>
            );
        },
        tbody({ children, ...props }) {
            console.log('渲染表体组件:', { children, props });
            return (
                <tbody className="divide-y divide-border">
                    {children}
                </tbody>
            );
        },
        tr({ children, ...props }) {
            return (
                <tr className="hover:bg-muted/30 transition-colors">
                    {children}
                </tr>
            );
        },
        th({ children, ...props }) {
            return (
                <th className="border border-border px-4 py-3 bg-muted font-semibold text-left text-sm">
                    {children}
                </th>
            );
        },
        td({ children, ...props }) {
            return (
                <td className="border border-border px-4 py-3 text-sm">
                    {children}
                </td>
            );
        },
        h1({ children }) {
            return <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0">{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="text-lg font-medium mb-2 mt-4 first:mt-0">{children}</h3>;
        },
        p({ children }) {
            return <p className="mb-4 last:mb-0">{children}</p>;
        },
        ul({ children }) {
            return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
        },
        li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
        },
        a({ href, children }) {
            return (
                <a 
                    href={href} 
                    className="text-blue-500 hover:text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {children}
                </a>
            );
        },
        strong({ children }) {
            return <strong className="font-semibold">{children}</strong>;
        },
        em({ children }) {
            return <em className="italic">{children}</em>;
        },
        hr() {
            return <hr className="my-6 border-t border-border" />;
        },
        blockquote({ children }) {
            return (
                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 py-2 my-4 italic">
                    {children}
                </blockquote>
            );
        },
    }), []);

    // 如果正在流式输出或者还没准备好渲染markdown，显示纯文本
    if (isStreaming || !shouldRenderMarkdown) {
        console.log('渲染纯文本模式:', {
            isStreaming,
            shouldRenderMarkdown,
            contentLength: content.length
        });
        return (
            <div className="text-sm leading-relaxed">
                <div className="whitespace-pre-wrap">
                    {content}
                </div>
                {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                )}
            </div>
        );
    }

    // 使用ReactMarkdown渲染完整内容
    console.log('渲染Markdown模式:', {
        isStreaming,
        shouldRenderMarkdown,
        contentLength: content.length,
        hasTable: content.includes('|'),
        remarkPlugins: ['remarkGfm'],
        contentSample: content.substring(0, 200)
    });

    try {
        return (
            <div className="text-sm leading-relaxed">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    className="prose prose-sm max-w-none dark:prose-invert"
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    } catch (error) {
        console.error('ReactMarkdown渲染失败:', error);
        return (
            <div className="text-sm leading-relaxed">
                <div className="whitespace-pre-wrap">
                    {content}
                </div>
                <div className="text-xs text-red-500 mt-2">
                    Markdown渲染失败，显示原始文本
                </div>
            </div>
        );
    }
};

export default StreamingMarkdown; 
import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

// shadcn/ui 组件
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

/**
 * 错误边界组件，用于捕获和处理应用错误
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // 更新 state 使下一次渲染能够显示降级后的 UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // 你同样可以将错误日志上报给服务器
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleReload = () => {
        // 重新加载页面
        window.location.reload();
    }

    handleReset = () => {
        // 重置错误状态
        this.setState({ hasError: false, error: null, errorInfo: null });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <Card className="w-full max-w-lg">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                            <CardTitle className="text-xl text-destructive">应用遇到了错误</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                抱歉，应用出现了意外错误。您可以尝试重新加载页面或重试操作。
                            </p>
                            
                            <div className="flex justify-center space-x-3">
                                <Button 
                                    onClick={this.handleReload}
                                    className="flex items-center space-x-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span>重新加载</span>
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={this.handleReset}
                                    className="flex items-center space-x-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span>重试</span>
                                </Button>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Card className="mt-6 text-left">
                                    <CardHeader>
                                        <CardTitle className="text-sm">错误详情 (开发模式)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-40 bg-muted p-3 rounded">
                                            {this.state.error.toString()}
                                            {this.state.errorInfo?.componentStack && (
                                                <>
                                                    <br />
                                                    <br />
                                                    组件堆栈:
                                                    {this.state.errorInfo.componentStack}
                                                </>
                                            )}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
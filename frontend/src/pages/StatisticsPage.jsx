import { BarChart3, TrendingUp, Activity, Calendar, FileText, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getContentTypeIcon } from '../utils';

/**
 * 统计页面组件
 * @param {Object} props - 组件属性
 * @param {Object} props.statistics - 统计数据
 */
const StatisticsPage = ({ statistics }) => {
    if (!statistics) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <div className="p-4 bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                        <BarChart3 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-muted-foreground">暂无统计数据</p>
                        <p className="text-sm text-muted-foreground">开始使用剪切板后会显示统计信息</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* 页面标题 */}
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">使用统计</h1>
                    <p className="text-sm text-muted-foreground">查看剪切板使用情况和数据分析</p>
                </div>
            </div>

            {/* 概览统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总条目</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-md">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary mb-1">
                            {statistics?.total_items || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            剪切板中的所有条目
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今日新增</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {statistics?.today_items || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            今天添加的条目数
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">本周新增</CardTitle>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                            <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {statistics?.week_items || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            本周添加的条目数
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 详细统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 内容类型分布 */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-md">
                                <Hash className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <span>内容类型分布</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                        {Object.entries(statistics?.type_stats || {}).length > 0 ? (
                            Object.entries(statistics.type_stats).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-muted-foreground/20">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 p-1 bg-background rounded-md shadow-sm">
                                            {getContentTypeIcon(type)}
                                        </div>
                                        <div>
                                            <span className="font-medium">{type || '未知'}</span>
                                            <div className="text-xs text-muted-foreground">
                                                占比: {Math.round((count / (statistics?.total_items || 1)) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                                        {count || 0}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                    <Hash className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">暂无类型统计数据</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 分类统计 */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-md">
                                <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <span>分类统计</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                        {Object.entries(statistics?.category_stats || {}).length > 0 ? (
                            Object.entries(statistics.category_stats).map(([category, count]) => (
                                <div key={category} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-muted-foreground/20">
                                    <div>
                                        <span className="font-medium">{category || '未知'}</span>
                                        <div className="text-xs text-muted-foreground">
                                            占比: {Math.round((count / (statistics?.total_items || 1)) * 100)}%
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                        {count || 0}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                    <Activity className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">暂无分类统计数据</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 使用情况统计 */}
            {(statistics?.total_items || 0) > 0 && (
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span>使用情况分析</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/30 transition-colors">
                                <div className="text-3xl font-bold text-primary mb-2">
                                    {Math.round(((statistics?.today_items || 0) / (statistics?.total_items || 1)) * 100)}%
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">今日活跃度</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {statistics?.today_items || 0}/{statistics?.total_items || 0}
                                </div>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/30 transition-colors">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                    {Object.keys(statistics?.type_stats || {}).length}
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">内容类型数</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    数据多样性
                                </div>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/30 transition-colors">
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                    {Object.keys(statistics?.category_stats || {}).length}
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">分类数量</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    组织程度
                                </div>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                    {Math.round((statistics?.week_items || 0) / 7)}
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">日均新增</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    使用频率
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 底部提示 */}
            <Card className="bg-muted/30">
                <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            📊 统计数据每小时更新一次，反映您的剪切板使用习惯
                        </p>
                        <p className="text-xs text-muted-foreground">
                            数据分析有助于优化工作流程和提高效率
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatisticsPage;
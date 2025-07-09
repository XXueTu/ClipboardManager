import { useState, useEffect } from 'react';
import { 
    Settings, 
    Shield, 
    AppWindow, 
    Database,
    Lightbulb,
    Save
} from 'lucide-react';

// shadcn/ui 组件
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/toast';

/**
 * 设置页面组件
 * @param {Object} props - 组件属性
 * @param {Object} props.settings - 设置数据
 * @param {Function} props.onUpdateSettings - 更新设置回调函数
 */
const SettingsPage = ({ settings, onUpdateSettings }) => {
    const { toast } = useToast();
    const [form, setForm] = useState(settings);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setForm(settings);
    }, [settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onUpdateSettings(form);
            toast.success('设置已保存');
        } catch (error) {
            toast.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    if (!settings) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">加载设置中...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            {/* 页面标题和保存按钮 */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">应用设置</h1>
                            <p className="text-sm text-muted-foreground">配置剪切板管理器的各项功能</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="flex items-center space-x-2 shadow-lg"
                        size="lg"
                    >
                        <Save className="h-4 w-4" />
                        <span>{loading ? '保存中...' : '保存设置'}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 系统设置 */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <CardTitle className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <AppWindow className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span>系统设置</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="monitoring">剪切板监听</Label>
                            <Select 
                                value={form?.monitoring ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('monitoring', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max-items">最大保存条目</Label>
                            <Input
                                id="max-items"
                                type="number"
                                value={form?.max_items || 1000}
                                onChange={(e) => handleInputChange('max_items', parseInt(e.target.value) || 1000)}
                                min={100}
                                max={10000}
                            />
                            <p className="text-xs text-muted-foreground">
                                设置剪切板最多保存的条目数量
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="auto-start">开机自启</Label>
                            <Select 
                                value={form?.auto_start ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('auto_start', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hotkey">全局快捷键</Label>
                            <Input
                                id="hotkey"
                                value={form?.hotkey || 'Ctrl+Shift+V'}
                                onChange={(e) => handleInputChange('hotkey', e.target.value)}
                                placeholder="例：Ctrl+Shift+V"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 安全与隐私 */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardTitle className="flex items-center space-x-2">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span>安全与隐私</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="encrypt-data">数据加密</Label>
                            <Select 
                                value={form?.encrypt_data ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('encrypt_data', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                开启后将对存储的剪切板数据进行加密
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password-protect">密码保护</Label>
                            <Select 
                                value={form?.password_protect ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('password_protect', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ignore-passwords">忽略密码字段</Label>
                            <Select 
                                value={form?.ignore_passwords ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('ignore_passwords', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                不记录密码输入框中的内容
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 智能分类 */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                        <CardTitle className="flex items-center space-x-2">
                            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <span>智能分类</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="auto-classify">自动分类</Label>
                            <Select 
                                value={form?.auto_classify ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('auto_classify', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                根据内容类型自动分类剪切板条目
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="detect-duplicates">重复检测</Label>
                            <Select 
                                value={form?.detect_duplicates ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('detect_duplicates', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                自动检测并合并重复的内容
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smart-search">智能搜索</Label>
                            <Select 
                                value={form?.smart_search ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('smart_search', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                支持模糊匹配和语义搜索
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 数据管理 */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                        <CardTitle className="flex items-center space-x-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span>数据管理</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="backup-enabled">自动备份</Label>
                            <Select 
                                value={form?.backup_enabled ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('backup_enabled', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="backup-frequency">备份频率</Label>
                            <Select 
                                value={form?.backup_frequency || 'daily'} 
                                onValueChange={(value) => handleInputChange('backup_frequency', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">每小时</SelectItem>
                                    <SelectItem value="daily">每天</SelectItem>
                                    <SelectItem value="weekly">每周</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cleanup-days">自动清理天数</Label>
                            <Input
                                id="cleanup-days"
                                type="number"
                                value={form?.cleanup_days || 30}
                                onChange={(e) => handleInputChange('cleanup_days', parseInt(e.target.value) || 30)}
                                min={1}
                                max={365}
                            />
                            <p className="text-xs text-muted-foreground">
                                自动清理超过指定天数的数据
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sync-enabled">云同步</Label>
                            <Select 
                                value={form?.sync_enabled ? "true" : "false"} 
                                onValueChange={(value) => handleInputChange('sync_enabled', value === "true")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">开启</SelectItem>
                                    <SelectItem value="false">关闭</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                在多设备间同步剪切板数据
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 底部提示信息 */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            💡 提示：修改设置后请点击右上角的保存按钮以应用更改
                        </p>
                        <p className="text-xs text-muted-foreground">
                            某些设置可能需要重启应用后才能生效
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
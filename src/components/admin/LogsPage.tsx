import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  FileText,
  Search,
  Download,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  FileSpreadsheet,
  X,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { exportLogsToCSV, exportLogsToExcel } from '../../utils/exportData';
import { toast } from 'sonner@2.0.3';

type LogLevel = 'info' | 'success' | 'warning' | 'error';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  details?: string;
}

export const LogsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const mockLogs: LogEntry[] = [
    { id: '1', timestamp: new Date('2024-01-21T14:30:00'), level: 'success', category: '촬영', message: '사진 촬영 완료', details: '템플릿: 네컷 (세로 2x2), 모드: 베이직' },
    { id: '2', timestamp: new Date('2024-01-21T14:28:15'), level: 'info', category: '시스템', message: '카메라 초기화', details: '카메라 권한 허용됨' },
    { id: '3', timestamp: new Date('2024-01-21T14:25:42'), level: 'success', category: '업로드', message: '프레임 업로드 완료', details: '프레임명: 빈티지 필름, 타입: 개별 프레임' },
    { id: '4', timestamp: new Date('2024-01-21T14:20:10'), level: 'warning', category: '촬영', message: '사진 재촬영', details: '사용자가 촬영 결과 재촬영 선택' },
    { id: '5', timestamp: new Date('2024-01-21T14:15:33'), level: 'error', category: '시스템', message: '카메라 접근 실패', details: '카메라 권한 거부됨, 데모 모드로 전환' },
    { id: '6', timestamp: new Date('2024-01-21T14:10:22'), level: 'info', category: '관리자', message: '관리자 모드 진입', details: '관리자 페이지 접속' },
    { id: '7', timestamp: new Date('2024-01-21T14:05:18'), level: 'success', category: '촬영', message: '사진 합성 완료', details: '10장 촬영 → 4장 선택 → 합성 완료' },
    { id: '8', timestamp: new Date('2024-01-21T14:00:05'), level: 'info', category: '시스템', message: '포토부스 시작', details: '앱 초기화 완료' },
  ];

  const categories = ['all', '촬영', '시스템', '업로드', '관리자'];

  const getLevelConfig = (level: LogLevel) => ({
    info: { icon: Info, bg: 'bg-sky-100', text: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-400' },
    success: { icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
    warning: { icon: AlertCircle, bg: 'bg-amber-100', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    error: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  }[level]);

  const getCategoryColor = (category: string) => ({
    '촬영': 'bg-violet-100 text-violet-700',
    '시스템': 'bg-stone-100 text-stone-600',
    '업로드': 'bg-sky-100 text-sky-700',
    '관리자': 'bg-amber-100 text-amber-700',
  }[category] || 'bg-stone-100 text-stone-600');

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const handleExportCSV = () => { exportLogsToCSV(filteredLogs); toast.success('CSV 파일이 다운로드되었습니다'); };
  const handleExportExcel = () => { exportLogsToExcel(filteredLogs); toast.success('Excel 파일이 다운로드되었습니다'); };
  const handleExportText = () => {
    const logsText = filteredLogs.map(log =>
      `[${log.timestamp.toLocaleString('ko-KR')}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${log.details ? ` - ${log.details}` : ''}`
    ).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `포토부스-로그-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('텍스트 파일이 다운로드되었습니다');
  };

  const statItems = [
    { level: 'info' as LogLevel, label: '정보' },
    { level: 'success' as LogLevel, label: '성공' },
    { level: 'warning' as LogLevel, label: '경고' },
    { level: 'error' as LogLevel, label: '오류' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-stone-900 text-2xl font-bold tracking-tight mb-1">로그 관리</h1>
          <p className="text-stone-400 text-sm font-medium">시스템 활동 기록을 확인하고 관리하세요</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              로그 내보내기
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-stone-200">
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer rounded-lg">
              <FileText className="w-4 h-4" />CSV로 내보내기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />Excel로 내보내기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportText} className="gap-2 cursor-pointer rounded-lg">
              <FileText className="w-4 h-4" />텍스트로 내보내기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map(({ level, label }) => {
          const cfg = getLevelConfig(level);
          const Icon = cfg.icon;
          const count = mockLogs.filter(l => l.level === level).length;
          return (
            <div key={level} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 ${cfg.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                </div>
                <span className="text-stone-500 text-xs font-semibold">{label}</span>
              </div>
              <p className="text-stone-900 text-2xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="로그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
            />
          </div>
          <div className="w-full lg:w-44">
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | 'all')}>
              <SelectTrigger className="rounded-xl border-stone-200 bg-stone-50">
                <Filter className="w-3.5 h-3.5 mr-2 text-stone-400" />
                <SelectValue placeholder="레벨" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 레벨</SelectItem>
                <SelectItem value="info">정보</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="warning">경고</SelectItem>
                <SelectItem value="error">오류</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full lg:w-44">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-xl border-stone-200 bg-stone-50">
                <FileText className="w-3.5 h-3.5 mr-2 text-stone-400" />
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat === 'all' ? '모든 카테고리' : cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchQuery || levelFilter !== 'all' || categoryFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 flex-wrap">
            <span className="text-stone-400 text-xs font-semibold">활성 필터:</span>
            {searchQuery && (
              <span className="flex items-center gap-1 bg-stone-100 text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {levelFilter !== 'all' && (
              <span className="flex items-center gap-1 bg-stone-100 text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                레벨: {levelFilter}
                <button onClick={() => setLevelFilter('all')} className="ml-1 hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="flex items-center gap-1 bg-stone-100 text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {categoryFilter}
                <button onClick={() => setCategoryFilter('all')} className="ml-1 hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-stone-900 text-sm font-bold">로그 목록</h2>
          <span className="text-stone-400 text-xs font-semibold">{filteredLogs.length}개</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 mx-auto mb-3 text-stone-200" />
            <p className="text-stone-400 text-sm font-medium">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredLogs.map((log) => {
              const cfg = getLevelConfig(log.level);
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-stone-50 transition-colors">
                  <div className={`w-8 h-8 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-stone-900 text-sm font-bold">{log.message}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                    </div>
                    {log.details && <p className="text-stone-500 text-xs font-medium">{log.details}</p>}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-stone-300" />
                      <p className="text-stone-300 text-xs">{log.timestamp.toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

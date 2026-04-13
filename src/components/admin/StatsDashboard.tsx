import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, TrendingUp, CreditCard, Camera, DollarSign, Image } from 'lucide-react';
import { statsAPI, DailyStats, AllTimeStats } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

export const StatsDashboard = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [dailyResponse, allTimeResponse] = await Promise.all([
        statsAPI.getDaily(),
        statsAPI.getAllTime(),
      ]);
      if (dailyResponse.success) setDailyStats(dailyResponse.stats);
      if (allTimeResponse.success) setAllTimeStats(allTimeResponse.stats);
      toast.success('통계 데이터를 불러왔습니다');
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('통계 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const iconColors: Record<string, string> = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    sky: 'bg-sky-400',
    rose: 'bg-rose-400',
    violet: 'bg-violet-400',
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'amber',
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
          <p className="text-stone-900 text-2xl font-bold break-words">{value}</p>
          {subtitle && <p className="text-stone-400 text-xs font-medium mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${iconColors[color] || iconColors.amber} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-7 h-7 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-stone-900 text-2xl font-bold tracking-tight mb-1">통계 대시보드</h1>
          <p className="text-stone-400 text-sm font-medium">포토부스 운영 통계 및 분석</p>
        </div>
        <Button
          onClick={loadStats}
          variant="outline"
          className="gap-2 bg-white border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </Button>
      </div>

      {/* Today's Stats */}
      {dailyStats && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-amber-400 rounded-full" />
            <h2 className="text-stone-900 text-base font-bold">오늘의 통계</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="총 세션"
              value={dailyStats.totalSessions}
              subtitle={`완료 ${dailyStats.completedSessions} · 취소 ${dailyStats.cancelledSessions}`}
              icon={TrendingUp}
              color="amber"
            />
            <StatCard
              title="총 매출"
              value={`₩${dailyStats.totalRevenue.toLocaleString()}`}
              subtitle="오늘 기준"
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="촬영된 사진"
              value={`${dailyStats.photosCaptured}장`}
              icon={Camera}
              color="sky"
            />
            <StatCard
              title="결제 방식"
              value={`카드 ${dailyStats.paymentMethods.card} · 현금 ${dailyStats.paymentMethods.cash}`}
              subtitle="건"
              icon={CreditCard}
              color="rose"
            />
          </div>

          {Object.keys(dailyStats.printsByCount).length > 0 && (
            <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-stone-900 text-sm font-bold mb-4">인화 매수별 통계</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(dailyStats.printsByCount).map(([count, value]) => (
                  <div key={count} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs font-medium">{count}장</p>
                      <p className="text-stone-900 text-lg font-bold">{value}건</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All-Time Stats */}
      {allTimeStats && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-violet-400 rounded-full" />
            <h2 className="text-stone-900 text-base font-bold">전체 통계</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="총 세션"
              value={allTimeStats.totalSessions}
              subtitle={`${allTimeStats.dayCount}일간 운영`}
              icon={TrendingUp}
              color="violet"
            />
            <StatCard
              title="총 매출"
              value={`₩${allTimeStats.totalRevenue.toLocaleString()}`}
              subtitle={`일평균 ₩${Math.round(allTimeStats.totalRevenue / (allTimeStats.dayCount || 1)).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="총 촬영 사진"
              value={`${allTimeStats.photosCaptured}장`}
              icon={Camera}
              color="sky"
            />
            <StatCard
              title="일평균 세션"
              value={Math.round(allTimeStats.totalSessions / (allTimeStats.dayCount || 1))}
              subtitle="세션 / 일"
              icon={TrendingUp}
              color="amber"
            />
          </div>

          {Object.keys(allTimeStats.printsByCount).length > 0 && (
            <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-stone-900 text-sm font-bold mb-4">전체 인화 매수별 통계</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(allTimeStats.printsByCount).map(([count, value]) => (
                  <div key={count} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs font-medium">{count}장</p>
                      <p className="text-stone-900 text-lg font-bold">{value}건</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Analysis */}
          <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-stone-900 text-sm font-bold mb-4">결제 방식 분석</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-sky-50 rounded-xl">
                <div className="w-10 h-10 bg-sky-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sky-600 text-xs font-semibold">카드 결제</p>
                  <p className="text-stone-900 text-2xl font-bold">{allTimeStats.paymentMethods.card}건</p>
                  <p className="text-stone-400 text-xs font-medium">
                    {Math.round((allTimeStats.paymentMethods.card / (allTimeStats.totalSessions || 1)) * 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-600 text-xs font-semibold">현금 결제</p>
                  <p className="text-stone-900 text-2xl font-bold">{allTimeStats.paymentMethods.cash}건</p>
                  <p className="text-stone-400 text-xs font-medium">
                    {Math.round((allTimeStats.paymentMethods.cash / (allTimeStats.totalSessions || 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

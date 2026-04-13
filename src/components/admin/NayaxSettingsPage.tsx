import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Save, AlertCircle, CheckCircle, RefreshCw, Zap, Settings, BookOpen } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getNayaxConfig, updateNayaxConfig, checkPaymentStatus } from '../../utils/nayaxPayment';

export const NayaxSettingsPage = () => {
  const [config, setConfig] = useState({
    apiEndpoint: '',
    apiKey: '',
    deviceId: '',
    testMode: true,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [testTransactionId, setTestTransactionId] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    const currentConfig = getNayaxConfig();
    setConfig({
      apiEndpoint: currentConfig.apiEndpoint,
      apiKey: currentConfig.apiKey === '***' ? '' : currentConfig.apiKey,
      deviceId: currentConfig.deviceId,
      testMode: currentConfig.testMode,
    });
  }, []);

  const handleSave = () => {
    updateNayaxConfig(config);
    setIsSaved(true);
    toast.success('Nayax 설정이 저장되었습니다');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    if (config.testMode) {
      toast.error('실제 연결 테스트를 위해 테스트 모드를 비활성화하세요');
      return;
    }
    if (!config.apiEndpoint || !config.apiKey || !config.deviceId) {
      toast.error('모든 설정을 입력하세요');
      return;
    }
    setTestingConnection(true);
    try {
      const testId = `TEST-${Date.now()}`;
      setTestTransactionId(testId);
      const response = await checkPaymentStatus(testId);
      if (response.success || response.error?.includes('404')) {
        toast.success('Nayax API 연결 성공!');
      } else {
        toast.error(`연결 실패: ${response.error}`);
      }
    } catch (error) {
      toast.error(`연결 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-stone-900 text-2xl font-bold tracking-tight mb-1">Nayax 결제 설정</h1>
        <p className="text-stone-400 text-sm font-medium">Nayax 결제 시스템 연동을 위한 설정입니다</p>
      </div>

      {/* Test Mode */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-stone-900 text-sm font-bold">테스트 모드</h2>
              <p className="text-stone-400 text-xs font-medium">실제 결제 없이 시뮬레이션됩니다</p>
            </div>
          </div>
          <Switch
            checked={config.testMode}
            onCheckedChange={(checked) => setConfig({ ...config, testMode: checked })}
          />
        </div>

        {config.testMode && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-bold mb-0.5">테스트 모드 활성화됨</p>
              <p className="text-amber-700 text-xs font-medium">
                실제 결제가 처리되지 않으며, 항상 승인됩니다. 운영 환경에서는 반드시 비활성화하세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-stone-600" />
          </div>
          <h2 className="text-stone-900 text-sm font-bold">API 설정</h2>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="apiEndpoint" className="text-stone-700 text-xs font-bold uppercase tracking-wider mb-2 block">
              API 엔드포인트
            </Label>
            <Input
              id="apiEndpoint"
              type="text"
              value={config.apiEndpoint}
              onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
              placeholder="https://api.nayax.com/v1/payment"
              className="rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
              disabled={config.testMode}
            />
            <p className="text-stone-400 text-xs font-medium mt-1.5">Nayax API 서버의 엔드포인트 URL</p>
          </div>

          <div>
            <Label htmlFor="apiKey" className="text-stone-700 text-xs font-bold uppercase tracking-wider mb-2 block">
              API 키
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="YOUR_API_KEY"
              className="rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
              disabled={config.testMode}
            />
            <p className="text-stone-400 text-xs font-medium mt-1.5">Nayax에서 발급받은 API 인증 키</p>
          </div>

          <div>
            <Label htmlFor="deviceId" className="text-stone-700 text-xs font-bold uppercase tracking-wider mb-2 block">
              디바이스 ID
            </Label>
            <Input
              id="deviceId"
              type="text"
              value={config.deviceId}
              onChange={(e) => setConfig({ ...config, deviceId: e.target.value })}
              placeholder="YOUR_DEVICE_ID"
              className="rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
              disabled={config.testMode}
            />
            <p className="text-stone-400 text-xs font-medium mt-1.5">등록된 Nayax 디바이스의 고유 ID</p>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <h2 className="text-stone-900 text-sm font-bold">통합 가이드</h2>
        </div>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Nayax API 문서 확인', desc: 'Nayax 담당자로부터 받은 API 문서를 확인하고, 제공된 엔드포인트, API 키, 디바이스 ID를 위 필드에 입력하세요.' },
            { step: '02', title: 'API 스펙 커스터마이징', desc: '/utils/nayaxPayment.ts 파일에서 Nayax의 실제 API 스펙에 맞춰 요청/응답 형식을 수정하세요.' },
            { step: '03', title: '결제 플로우', desc: '사용자 결제 선택 → Nayax API 호출 → 기기에서 결제 처리 → 결제 성공 시 촬영 단계 진행' },
            { step: '04', title: '연결 테스트', desc: '모든 설정 완료 후 "연결 테스트" 버튼으로 API 연결을 확인하세요.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">{step}</span>
              </div>
              <div>
                <p className="text-stone-900 text-sm font-bold mb-0.5">{title}</p>
                <p className="text-stone-500 text-xs font-medium leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl py-3 text-sm font-bold transition-colors shadow-sm"
        >
          {isSaved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              저장됨
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              설정 저장
            </>
          )}
        </button>

        {!config.testMode && (
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center gap-2 px-5 py-3 border border-stone-200 bg-white text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {testingConnection ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                테스트 중...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                연결 테스트
              </>
            )}
          </button>
        )}
      </div>

      {/* Production Warning */}
      {!config.testMode && (
        <div className="flex items-start gap-3 bg-red-50 rounded-2xl p-5">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-red-900 text-sm font-bold mb-1">실제 결제 모드</h3>
            <p className="text-red-700 text-xs font-medium leading-relaxed">
              테스트 모드가 비활성화되어 있습니다. 모든 결제가 실제로 처리되며 Nayax 시스템과 실제 통신합니다. API 설정이 정확한지 반드시 확인하세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

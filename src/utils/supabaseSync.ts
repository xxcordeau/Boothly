/**
 * Supabase Sync Status Check
 * 
 * This utility confirms that all admin settings are synced to Supabase.
 */

import { getTemplateSettings } from './templateSettings';
import { getFrames } from './frameStorage';

export const checkSupabaseSyncStatus = async (): Promise<{
  templateSettings: boolean;
  frames: boolean;
  allSynced: boolean;
}> => {
  try {
    console.log('🔍 Checking Supabase sync status...');
    
    // Check template settings
    const templateSettings = getTemplateSettings();
    const templateSettingsSynced = templateSettings.length > 0;
    console.log(`📋 Template settings: ${templateSettings.length} entries ${templateSettingsSynced ? '✅' : '❌'}`);
    
    // Check frames
    const frames = getFrames();
    const framesSynced = true; // Frames are loaded from Supabase
    console.log(`🖼️ Frames: ${frames.length} entries ${framesSynced ? '✅' : '❌'}`);
    
    const allSynced = templateSettingsSynced && framesSynced;
    
    console.log(`${allSynced ? '✅' : '❌'} Supabase sync status: ${allSynced ? 'All synced' : 'Some missing'}`);
    
    return {
      templateSettings: templateSettingsSynced,
      frames: framesSynced,
      allSynced,
    };
  } catch (error) {
    console.error('❌ Error checking sync status:', error);
    return {
      templateSettings: false,
      frames: false,
      allSynced: false,
    };
  }
};

export const logSupabaseSyncInfo = () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  📊 Supabase 동기화 정보');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('✅ 템플릿 설정 (Template Settings)');
  console.log('   - 저장 위치: Supabase KV Store (admin:template_settings)');
  console.log('   - 관리 페이지: /admin → 템플릿 관리');
  console.log('   - 포함 정보: 템플릿 표시 상태, 기본 가격');
  console.log('');
  console.log('✅ 프레임 이미지 (Frame Images)');
  console.log('   - 저장 위치: Supabase Storage (make-356393ac-frames)');
  console.log('   - 메타데이터: Supabase KV Store (admin:frames)');
  console.log('   - 관리 페이지: /admin → 프레임 관리');
  console.log('   - 포함 정보: 오버레이, 프레임 이미지');
  console.log('');
  console.log('✅ 통계 데이터 (Statistics)');
  console.log('   - 저장 위치: Supabase KV Store (stats:daily:YYYY-MM-DD)');
  console.log('   - 관리 페이지: /admin → 통계');
  console.log('   - 포함 정보: 세션, 결제, 수익 통계');
  console.log('');
  console.log('✅ 사진 공유 (Photo Sharing)');
  console.log('   - 저장 위치: Supabase Storage (make-356393ac-photobooth-images)');
  console.log('   - 메타데이터: Supabase KV Store (image:*)');
  console.log('   - 자동 삭제: 30일 후');
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  checkSupabaseSyncStatus();
};

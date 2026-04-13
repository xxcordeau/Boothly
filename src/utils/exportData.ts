/**
 * Data Export Utilities
 * 
 * Provides functions to export data in CSV and Excel formats
 */

import * as XLSX from 'xlsx';

/**
 * Convert array of objects to CSV string
 */
export const arrayToCSV = (data: any[], headers?: string[]): string => {
  if (data.length === 0) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.map(h => `"${h}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Handle different data types
      if (value === null || value === undefined) return '""';
      if (value instanceof Date) return `"${value.toLocaleString('ko-KR')}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (data: any[], filename: string, headers?: string[]) => {
  const csv = arrayToCSV(data, headers);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Korean
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Download Excel file (XLSX format)
 */
export const downloadExcel = (
  data: any[], 
  filename: string, 
  sheetName: string = 'Sheet1',
  headers?: string[]
) => {
  // Prepare data with headers
  let exportData = data;
  
  if (headers) {
    // Map data to use custom headers
    exportData = data.map(row => {
      const newRow: any = {};
      headers.forEach((header, index) => {
        const originalKey = Object.keys(row)[index];
        newRow[header] = row[originalKey];
      });
      return newRow;
    });
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Auto-size columns
  const colWidths = Object.keys(exportData[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...exportData.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = colWidths;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Download Excel file with multiple sheets
 */
export const downloadExcelMultiSheet = (
  sheets: { name: string; data: any[]; headers?: string[] }[],
  filename: string
) => {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(({ name, data, headers }) => {
    let exportData = data;
    
    if (headers && data.length > 0) {
      exportData = data.map(row => {
        const newRow: any = {};
        headers.forEach((header, index) => {
          const originalKey = Object.keys(row)[index];
          newRow[header] = row[originalKey];
        });
        return newRow;
      });
    }
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns
    if (exportData.length > 0) {
      const colWidths = Object.keys(exportData[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = colWidths;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export logs to CSV
 */
export const exportLogsToCSV = (logs: any[]) => {
  const formattedLogs = logs.map(log => ({
    '날짜': log.timestamp.toLocaleDateString('ko-KR'),
    '시간': log.timestamp.toLocaleTimeString('ko-KR'),
    '레벨': log.level,
    '카테고리': log.category,
    '메시지': log.message,
    '상세정보': log.details || '',
  }));
  
  const filename = `포토부스-로그-${new Date().toISOString().split('T')[0]}`;
  downloadCSV(formattedLogs, filename);
};

/**
 * Export logs to Excel
 */
export const exportLogsToExcel = (logs: any[]) => {
  const formattedLogs = logs.map(log => ({
    '날짜': log.timestamp.toLocaleDateString('ko-KR'),
    '시간': log.timestamp.toLocaleTimeString('ko-KR'),
    '레벨': log.level,
    '카테고리': log.category,
    '메시지': log.message,
    '상세정보': log.details || '',
  }));
  
  const filename = `포토부스-로그-${new Date().toISOString().split('T')[0]}`;
  downloadExcel(formattedLogs, filename, '로그');
};

/**
 * Export statistics to Excel with multiple sheets
 */
export const exportStatisticsToExcel = (stats: {
  dailyStats: any[];
  templateStats: any[];
  modeStats: any[];
  overview: any;
}) => {
  const sheets = [
    {
      name: '개요',
      data: [
        { '항목': '총 촬영 수', '값': stats.overview.totalPhotos },
        { '항목': '오늘 촬영 수', '값': stats.overview.todayPhotos },
        { '항목': '총 사용자 수', '값': stats.overview.totalUsers },
        { '항목': '인기 템플릿', '값': stats.overview.popularTemplate },
        { '항목': '평균 일일 촬영', '값': stats.overview.averagePerDay },
        { '항목': '주간 증가율', '값': stats.overview.weeklyGrowth },
      ],
    },
    {
      name: '일별 통계',
      data: stats.dailyStats.map(day => ({
        '날짜': day.date,
        '촬영 수': day.count,
      })),
    },
    {
      name: '템플릿별 통계',
      data: stats.templateStats.map(template => ({
        '템플릿명': template.name,
        '사용 횟수': template.count,
        '비율': `${template.percentage}%`,
      })),
    },
    {
      name: '모드별 통계',
      data: stats.modeStats.map(mode => ({
        '모드': mode.name,
        '사용 횟수': mode.count,
        '비율': `${mode.percentage}%`,
      })),
    },
  ];
  
  const filename = `포토부스-통계-${new Date().toISOString().split('T')[0]}`;
  downloadExcelMultiSheet(sheets, filename);
};

/**
 * Export statistics to CSV (combined data)
 */
export const exportStatisticsToCSV = (stats: {
  dailyStats: any[];
  templateStats: any[];
  modeStats: any[];
  overview: any;
}) => {
  // Combine all data into one CSV
  const csvData = [
    '=== 개요 ===',
    `총 촬영 수,${stats.overview.totalPhotos}`,
    `오늘 촬영 수,${stats.overview.todayPhotos}`,
    `총 사용자 수,${stats.overview.totalUsers}`,
    `인기 템플릿,${stats.overview.popularTemplate}`,
    `평균 일일 촬영,${stats.overview.averagePerDay}`,
    `주간 증가율,${stats.overview.weeklyGrowth}`,
    '',
    '=== 일별 통계 ===',
    '날짜,촬영 수',
    ...stats.dailyStats.map(d => `${d.date},${d.count}`),
    '',
    '=== 템플릿별 통계 ===',
    '템플릿명,사용 횟수,비율',
    ...stats.templateStats.map(t => `${t.name},${t.count},${t.percentage}%`),
    '',
    '=== 모드별 통계 ===',
    '모드,사용 횟수,비율',
    ...stats.modeStats.map(m => `${m.name},${m.count},${m.percentage}%`),
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `포토부스-통계-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

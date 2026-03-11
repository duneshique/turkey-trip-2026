/**
 * 터키 여행 일정표 - 구글 캘린더 동기화 스크립트
 *
 * ⚠️ 사전 설정 필수:
 * Apps Script 편집기 → 왼쪽 메뉴 "서비스(+)" → "Google Calendar API" 추가 (식별자: Calendar)
 *
 * 기능:
 * 1. 시트 데이터 → 캘린더 이벤트 생성 (이벤트별 타임존 지원)
 * 2. Asia/Seoul ↔ Europe/Istanbul 자동 처리
 * 3. 디버그 로그 시트 자동 생성
 *
 * 사용법:
 * 1. setup-sheets.gs 먼저 실행
 * 2. 이 코드를 같은 Apps Script 프로젝트에 추가
 * 3. "서비스" 에서 Google Calendar API 활성화
 * 4. syncToCalendar() 실행
 */

// ============================================================
// 설정
// ============================================================
const CONFIG = {
  // 캘린더 ID (여행용 캘린더)
  CALENDAR_ID: '1b68e743242553cdf3d1ea4bd9f6574e2e65c45e84134e6b59e1f2d24767415a@group.calendar.google.com',

  // 시트 이름
  SCHEDULE_SHEET: '일정표',
  LOG_SHEET: '동기화로그',

  // 카테고리별 캘린더 색상 (Google Calendar color IDs: 1~11)
  CATEGORY_COLORS: {
    '✈️항공': '9',    // 블루베리 (진한 파랑)
    '🚎이동': '8',    // 그래파이트 (회색)
    '🚗이동': '8',
    '🚗렌트': '8',
    '🚶이동': '8',
    '🏨숙소': '2',    // 세이지 (초록)
    '🍽️식사': '6',    // 탠저린 (주황)
    '🍽️체험': '6',
    '🕌관광': '3',    // 그레이프 (보라)
    '🌅관광': '3',
    '🌃관광': '3',
    '🚶관광': '3',
    '🛌휴식': '8',    // 그래파이트
    '🏖️휴식': '7',    // 피콕 (청록)
    '🛍️쇼핑': '11',   // 토마토 (빨강)
    '☕카페': '5',     // 바나나 (노랑)
    '🛀체험': '7',     // 피콕
    '🎭체험': '3',     // 그레이프
  },

  // 허용 타임존
  TIMEZONES: {
    'Asia/Seoul': 'Asia/Seoul',
    'Europe/Istanbul': 'Europe/Istanbul'
  }
};

// ============================================================
// 메인 함수들
// ============================================================

/**
 * 캘린더 동기화 (메인 실행 함수)
 * Calendar Advanced Service 사용 → 이벤트별 타임존 지원
 */
function syncToCalendar() {
  const debugLog = new DebugLogger();

  try {
    debugLog.log('INFO', '동기화 시작', '캘린더 ID: ' + CONFIG.CALENDAR_ID);

    // 0. Calendar Advanced Service 확인
    if (typeof Calendar === 'undefined') {
      debugLog.log('ERROR', 'Calendar API 미활성',
        '⚠️ Calendar Advanced Service가 활성화되지 않았습니다.\n\n' +
        '해결 방법:\n' +
        '1. Apps Script 편집기 왼쪽 메뉴 "서비스" 옆 [+] 클릭\n' +
        '2. "Google Calendar API" 선택\n' +
        '3. 식별자를 "Calendar"로 확인\n' +
        '4. "추가" 클릭\n' +
        '5. 다시 syncToCalendar() 실행');
      debugLog.writeToSheet();
      SpreadsheetApp.getUi().alert(
        '⚠️ Calendar API가 활성화되지 않았습니다.\n\n' +
        '왼쪽 메뉴 "서비스" → [+] → "Google Calendar API" 추가 후 다시 실행하세요.');
      return;
    }

    // 1. 캘린더 확인
    let calendarInfo;
    try {
      calendarInfo = Calendar.Calendars.get(CONFIG.CALENDAR_ID);
      debugLog.log('OK', '캘린더 연결 성공', '캘린더명: ' + calendarInfo.summary);
    } catch (e) {
      debugLog.log('ERROR', '캘린더 연결 실패', e.message + '\n\n해결: 구글 캘린더에서 해당 캘린더에 접근 권한이 있는지 확인하세요.');
      debugLog.writeToSheet();
      return;
    }

    // 2. 시트 데이터 읽기
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SCHEDULE_SHEET);

    if (!sheet) {
      debugLog.log('ERROR', '시트 없음', '"일정표" 시트를 찾을 수 없습니다. setup-sheets.gs를 먼저 실행하세요.');
      debugLog.writeToSheet();
      return;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];

    debugLog.log('INFO', '데이터 읽기', '총 ' + (values.length - 1) + '개 행 발견');

    // 3. 헤더 인덱스 매핑
    const colIdx = {};
    headers.forEach((h, i) => { colIdx[h] = i; });

    const requiredCols = ['date', 'start', 'end', 'title', 'timezone'];
    const missingCols = requiredCols.filter(c => colIdx[c] === undefined);
    if (missingCols.length > 0) {
      debugLog.log('ERROR', '필수 컬럼 누락', '누락된 컬럼: ' + missingCols.join(', '));
      debugLog.writeToSheet();
      return;
    }

    // 4. 기존 이벤트 삭제 (충돌 방지)
    debugLog.log('INFO', '기존 이벤트 정리', '2026-03-12 ~ 2026-03-22 범위 이벤트 삭제 중...');
    try {
      const existingEvents = Calendar.Events.list(CONFIG.CALENDAR_ID, {
        timeMin: '2026-03-12T00:00:00+09:00',
        timeMax: '2026-03-23T00:00:00+09:00',
        maxResults: 500,
        singleEvents: true
      });

      const items = existingEvents.items || [];
      debugLog.log('INFO', '기존 이벤트', items.length + '개 발견. 삭제 중...');
      items.forEach(ev => {
        try {
          Calendar.Events.remove(CONFIG.CALENDAR_ID, ev.id);
        } catch (delErr) {
          debugLog.log('WARN', '이벤트 삭제 실패', ev.summary + ': ' + delErr.message);
        }
      });
      debugLog.log('OK', '기존 이벤트 삭제 완료', items.length + '개 삭제됨');
    } catch (e) {
      debugLog.log('WARN', '기존 이벤트 삭제 중 오류', e.message + ' (계속 진행)');
    }

    // 5. 이벤트 생성
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowNum = i + 1;

      try {
        const dateStr = row[colIdx['date']];
        const startStr = row[colIdx['start']];
        const endStr = row[colIdx['end']];
        const title = row[colIdx['title']];
        const tz = row[colIdx['timezone']];

        // 빈 행 스킵
        if (!dateStr || !title) {
          skipped++;
          continue;
        }

        // 날짜/시간 파싱
        const dateVal = parseDate(dateStr);
        if (!dateVal) {
          debugLog.log('WARN', '날짜 파싱 실패 (행 ' + rowNum + ')', 'date="' + dateStr + '" → YYYY-MM-DD 형식 필요');
          errors++;
          continue;
        }

        const startTime = parseTime(startStr);
        const endTime = parseTime(endStr);

        if (!startTime) {
          debugLog.log('WARN', '시작시간 파싱 실패 (행 ' + rowNum + ')', 'start="' + startStr + '" → HH:MM 형식 필요. 제목: ' + title);
          errors++;
          continue;
        }

        // 종료 시간이 없으면 시작 시간 + 30분
        const endTimeResolved = endTime || { h: startTime.h, m: startTime.m + 30 };

        // 타임존 결정
        const timezone = CONFIG.TIMEZONES[tz] || 'Europe/Istanbul';
        if (!CONFIG.TIMEZONES[tz]) {
          debugLog.log('WARN', '타임존 기본값 사용 (행 ' + rowNum + ')', 'timezone="' + tz + '" → Europe/Istanbul 사용. 제목: ' + title);
        }

        // 시작/종료 DateTime 생성
        const startDt = createDateTimeString(dateVal, startTime);
        const endDt = createDateTimeString(dateVal, endTimeResolved);

        // 설명(description) 조합
        const descParts = [];
        if (row[colIdx['description']]) descParts.push(row[colIdx['description']]);
        if (row[colIdx['cost_krw']] && row[colIdx['cost_krw']] !== '' && row[colIdx['cost_krw']] !== 0) {
          descParts.push('💰 ' + Number(row[colIdx['cost_krw']]).toLocaleString() + '원');
        }
        if (row[colIdx['booking_ref']] && row[colIdx['booking_ref']] !== '') {
          descParts.push('📋 예약번호: ' + row[colIdx['booking_ref']]);
        }
        if (row[colIdx['maps_link']] && row[colIdx['maps_link']] !== '') {
          descParts.push('📍 지도: ' + row[colIdx['maps_link']]);
        }
        if (colIdx['route_link'] !== undefined && row[colIdx['route_link']] && row[colIdx['route_link']] !== '') {
          descParts.push('🚗 경로: ' + row[colIdx['route_link']]);
        }
        const description = descParts.join('\n\n');

        // 장소
        const location = row[colIdx['location']] || '';

        // 카테고리 색상
        const category = row[colIdx['category']] || '';
        const colorId = CONFIG.CATEGORY_COLORS[category] || '1';

        // ★ Calendar Advanced Service로 이벤트 생성 (이벤트별 타임존 지원!)
        const eventResource = {
          summary: title,
          location: location,
          description: description,
          start: {
            dateTime: startDt,   // "2026-03-12T15:45:00"
            timeZone: timezone    // "Europe/Istanbul" 또는 "Asia/Seoul"
          },
          end: {
            dateTime: endDt,
            timeZone: timezone
          },
          colorId: colorId
        };

        Calendar.Events.insert(eventResource, CONFIG.CALENDAR_ID);
        created++;

        if (created % 10 === 0) {
          debugLog.log('INFO', '진행 중...', created + '개 생성됨');
        }

      } catch (e) {
        debugLog.log('ERROR', '이벤트 생성 실패 (행 ' + rowNum + ')',
          '제목: ' + (row[colIdx['title']] || '없음') + '\n오류: ' + e.message + '\n스택: ' + e.stack);
        errors++;
      }

      // API 속도 제한 방지
      if (created % 20 === 0) {
        Utilities.sleep(1000);
      }
    }

    // 6. 결과 요약
    debugLog.log('OK', '===== 동기화 완료 =====',
      '✅ 생성: ' + created + '개\n' +
      '⏭️ 스킵: ' + skipped + '개\n' +
      '❌ 오류: ' + errors + '개\n' +
      '📅 캘린더: ' + calendarInfo.summary + '\n' +
      '🌐 타임존: Asia/Seoul ↔ Europe/Istanbul 개별 적용됨'
    );

    debugLog.writeToSheet();

    // 알림
    SpreadsheetApp.getUi().alert(
      '동기화 완료!\n\n' +
      '✅ 생성: ' + created + '개\n' +
      '❌ 오류: ' + errors + '개\n' +
      '🌐 타임존: 이벤트별 개별 적용\n\n' +
      '"동기화로그" 시트에서 상세 내용을 확인하세요.'
    );

  } catch (e) {
    debugLog.log('ERROR', '치명적 오류', e.message + '\n' + e.stack);
    debugLog.writeToSheet();
    SpreadsheetApp.getUi().alert('오류 발생!\n\n' + e.message + '\n\n"동기화로그" 시트를 확인하세요.');
  }
}

/**
 * 캘린더 이벤트 전체 삭제 (초기화용)
 */
function clearCalendarEvents() {
  if (typeof Calendar === 'undefined') {
    SpreadsheetApp.getUi().alert('Calendar API를 먼저 활성화하세요.\n서비스 → [+] → Google Calendar API');
    return;
  }

  try {
    const existingEvents = Calendar.Events.list(CONFIG.CALENDAR_ID, {
      timeMin: '2026-03-12T00:00:00+09:00',
      timeMax: '2026-03-23T00:00:00+09:00',
      maxResults: 500,
      singleEvents: true
    });

    const items = existingEvents.items || [];
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '⚠️ 확인',
      items.length + '개의 이벤트를 삭제하시겠습니까?\n(2026-03-12 ~ 2026-03-22)',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      items.forEach(ev => Calendar.Events.remove(CONFIG.CALENDAR_ID, ev.id));
      ui.alert('✅ ' + items.length + '개 이벤트 삭제 완료');
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('오류: ' + e.message);
  }
}

/**
 * 시트 데이터 검증만 (캘린더 반영 없이)
 */
function validateSheetData() {
  const debugLog = new DebugLogger();
  debugLog.log('INFO', '데이터 검증 시작', '캘린더에 반영하지 않고 데이터만 확인합니다.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SCHEDULE_SHEET);

  if (!sheet) {
    debugLog.log('ERROR', '시트 없음', '"일정표" 시트가 없습니다.');
    debugLog.writeToSheet();
    return;
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colIdx = {};
  headers.forEach((h, i) => { colIdx[h] = i; });

  let issues = 0;
  let ok = 0;
  let seoulCount = 0;
  let istanbulCount = 0;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowNum = i + 1;
    const title = row[colIdx['title']] || '';

    if (!row[colIdx['date']] && !title) continue; // 빈 행

    // 날짜 검증
    if (!parseDate(row[colIdx['date']])) {
      debugLog.log('ERROR', '행 ' + rowNum + ' 날짜 오류', '"' + row[colIdx['date']] + '" → YYYY-MM-DD 형식 필요');
      issues++;
      continue;
    }

    // 시간 검증
    if (!parseTime(row[colIdx['start']])) {
      debugLog.log('ERROR', '행 ' + rowNum + ' 시작시간 오류', '"' + row[colIdx['start']] + '" → HH:MM 형식 필요. 제목: ' + title);
      issues++;
      continue;
    }

    // 타임존 검증
    const tz = row[colIdx['timezone']];
    if (!CONFIG.TIMEZONES[tz]) {
      debugLog.log('WARN', '행 ' + rowNum + ' 타임존 주의', '"' + tz + '" → Asia/Seoul 또는 Europe/Istanbul만 허용. 제목: ' + title);
      issues++;
    } else {
      if (tz === 'Asia/Seoul') seoulCount++;
      else if (tz === 'Europe/Istanbul') istanbulCount++;
    }

    // 종료시간 검증
    if (!parseTime(row[colIdx['end']])) {
      debugLog.log('WARN', '행 ' + rowNum + ' 종료시간 없음', '시작시간+30분으로 대체됩니다. 제목: ' + title);
    }

    ok++;
  }

  debugLog.log('INFO', '===== 검증 완료 =====',
    '✅ 정상: ' + ok + '개\n' +
    '⚠️ 이슈: ' + issues + '개\n' +
    '🇰🇷 Asia/Seoul: ' + seoulCount + '개\n' +
    '🇹🇷 Europe/Istanbul: ' + istanbulCount + '개');

  debugLog.writeToSheet();

  SpreadsheetApp.getUi().alert(
    '검증 완료!\n\n' +
    '✅ 정상: ' + ok + '개\n' +
    '⚠️ 이슈: ' + issues + '개\n\n' +
    '🇰🇷 서울 시간: ' + seoulCount + '개\n' +
    '🇹🇷 이스탄불 시간: ' + istanbulCount + '개\n\n' +
    '"동기화로그" 시트를 확인하세요.'
  );
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * 날짜 문자열 파싱 (YYYY-MM-DD 또는 Date 객체)
 */
function parseDate(val) {
  if (!val) return null;

  // Date 객체인 경우
  if (val instanceof Date) {
    return {
      y: val.getFullYear(),
      m: val.getMonth() + 1,
      d: val.getDate()
    };
  }

  // 문자열인 경우
  const str = String(val).trim();
  const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return { y: parseInt(match[1]), m: parseInt(match[2]), d: parseInt(match[3]) };
  }

  return null;
}

/**
 * 시간 문자열 파싱 (HH:MM)
 */
function parseTime(val) {
  if (!val) return null;

  // Date 객체인 경우 (시트에서 시간이 Date로 올 수 있음)
  if (val instanceof Date) {
    return { h: val.getHours(), m: val.getMinutes() };
  }

  const str = String(val).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return { h: parseInt(match[1]), m: parseInt(match[2]) };
  }

  return null;
}

/**
 * ISO DateTime 문자열 생성 (타임존 오프셋 없이 → Calendar API가 timeZone 필드로 처리)
 */
function createDateTimeString(date, time) {
  const pad = (n) => String(n).padStart(2, '0');
  return date.y + '-' + pad(date.m) + '-' + pad(date.d) + 'T' + pad(time.h) + ':' + pad(time.m) + ':00';
}

// ============================================================
// 디버그 로거
// ============================================================
class DebugLogger {
  constructor() {
    this.logs = [];
    this.startTime = new Date();
  }

  log(level, title, detail) {
    const timestamp = new Date();
    const elapsed = ((timestamp - this.startTime) / 1000).toFixed(1) + 's';
    this.logs.push([
      Utilities.formatDate(timestamp, 'Asia/Seoul', 'HH:mm:ss'),
      elapsed,
      level,
      title,
      detail || ''
    ]);

    // 콘솔에도 출력
    Logger.log('[' + level + '] ' + title + (detail ? ' - ' + detail : ''));
  }

  writeToSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.LOG_SHEET);
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.LOG_SHEET);
    }
    logSheet.clear();

    // 헤더
    const headers = ['시각', '경과', '레벨', '항목', '상세'];
    const allData = [headers, ...this.logs];

    logSheet.getRange(1, 1, allData.length, 5).setValues(allData);

    // 스타일
    const headerRange = logSheet.getRange(1, 1, 1, 5);
    headerRange.setBackground('#263238').setFontColor('#ffffff').setFontWeight('bold');

    // 레벨별 색상
    for (let i = 2; i <= allData.length; i++) {
      const level = allData[i-1][2];
      let bg = '#ffffff';
      if (level === 'ERROR') bg = '#ffcdd2';
      else if (level === 'WARN') bg = '#fff9c4';
      else if (level === 'OK') bg = '#c8e6c9';
      else if (level === 'INFO') bg = '#e3f2fd';
      logSheet.getRange(i, 1, 1, 5).setBackground(bg);
    }

    logSheet.setColumnWidth(1, 80);
    logSheet.setColumnWidth(2, 60);
    logSheet.setColumnWidth(3, 60);
    logSheet.setColumnWidth(4, 200);
    logSheet.setColumnWidth(5, 500);
    logSheet.setFrozenRows(1);

    // description 컬럼 줄바꿈
    logSheet.getRange(1, 5, allData.length, 1).setWrap(true);
  }
}

// ============================================================
// 커스텀 메뉴 (시트 열 때 자동 추가)
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🇹🇷 터키 여행')
    .addItem('📝 시트 데이터 생성 (최초 1회)', 'setupAllSheets')
    .addSeparator()
    .addItem('✅ 데이터 검증 (캘린더 반영 없이)', 'validateSheetData')
    .addItem('📅 캘린더 동기화', 'syncToCalendar')
    .addItem('🗑️ 캘린더 이벤트 전체 삭제', 'clearCalendarEvents')
    .addSeparator()
    .addItem('🔍 동기화 로그 보기', 'showLogSheet')
    .addToUi();
}

function showLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CONFIG.LOG_SHEET);
  if (logSheet) {
    ss.setActiveSheet(logSheet);
  } else {
    SpreadsheetApp.getUi().alert('아직 동기화 로그가 없습니다. 동기화를 먼저 실행하세요.');
  }
}

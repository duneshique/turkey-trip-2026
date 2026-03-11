/**
 * 터키 여행 일정표 - 구글 시트 자동 생성 스크립트
 * 9주년 기념 한국-터키 여행 (2026.03.12 ~ 03.21)
 *
 * 사용법:
 * 1. 구글 시트 열기
 * 2. 확장 프로그램 > Apps Script
 * 3. 이 코드 전체를 붙여넣기
 * 4. ▶ 실행 버튼 클릭 (함수: setupAllSheets)
 * 5. 권한 승인
 */

/**
 * Google Maps 검색 링크 생성 헬퍼
 */
function mapsLink(query) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}

/**
 * Google Maps 경로(A→B) 링크 생성 헬퍼
 * @param {string} origin - 출발지
 * @param {string} dest - 도착지
 * @param {string} mode - transit|driving|walking
 */
function routeLink(origin, dest, mode) {
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(origin) + '&destination=' + encodeURIComponent(dest) + '&travelmode=' + mode;
}

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 기존 시트 정리
  const existingSheets = ss.getSheets();

  // 시트 생성
  createScheduleSheet(ss);
  createRestaurantSheet(ss);
  createTicketSheet(ss);
  createPracticalSheet(ss);

  // 기본 빈 시트 삭제
  existingSheets.forEach(s => {
    if (s.getName() === '시트1' || s.getName() === 'Sheet1') {
      try { ss.deleteSheet(s); } catch(e) {}
    }
  });

  SpreadsheetApp.flush();
  Logger.log('✅ 모든 시트 생성 완료!');
}

// ============================================================
// 시트 1: 일정표 (캘린더 동기화용)
// ============================================================
function createScheduleSheet(ss) {
  let sheet = ss.getSheetByName('일정표');
  if (!sheet) sheet = ss.insertSheet('일정표');
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.clear();

  // 헤더
  const headers = ['date', 'start', 'end', 'title', 'category', 'location', 'description', 'timezone', 'cost_krw', 'maps_link', 'booking_ref', 'route_link', 'alt_options'];

  const data = [
    headers,
    // ===================== 3/12 (목) 서울→이스탄불 =====================
    ['2026-03-12', '06:00', '07:00', '집→인천공항', '🚎이동', '백석 공항버스 정류장', '3300번 공항버스 (백석역 정류장). 2인 17,000원 (8,500원/인). 💳교통카드 또는 현금', 'Asia/Seoul', '17000', 'https://maps.app.goo.gl/airport-bus', '', routeLink('백석역, 고양시', '인천국제공항 제2터미널', 'transit')],
    ['2026-03-12', '07:00', '07:30', '인천공항 T2 체크인', '✈️항공', '인천국제공항 제2터미널', '체크인 수속. ★하나은행 환전 픽업 (200 EUR, T2 출국장 내)', 'Asia/Seoul', '', '', '', ''],
    ['2026-03-12', '07:30', '09:00', '☕ 마티나 라운지', '☕라운지', 'Matina Lounge, ICN T2 4F Gate 252', 'Priority Pass 입장. 운영 07:00~22:00, 최대 3시간. 조식뷔페+음료+샤워 가능. Gate 252 근처 4층 에스컬레이터', 'Asia/Seoul', '0', '', '', ''],
    ['2026-03-12', '09:35', '09:35', '✈️ ICN 출발 (OZ551)', '✈️항공', '인천국제공항 T2', '아시아나 직항 → 이스탄불 (11시간10분). 기내식 2회', 'Asia/Seoul', '2000000', '', 'DP5W84', ''],
    ['2026-03-12', '15:45', '15:45', '✈️ IST 도착 (OZ551)', '✈️항공', 'Istanbul Airport (IST)', '아시아나 직항 도착. 시차 -6시간 (한국 21:45). 도착 로비 ATM에서 TRY 인출 가능 (Ziraat Bankası)', 'Europe/Istanbul', '', '', 'DP5W84', ''],
    ['2026-03-12', '16:00', '18:00', 'IST공항→탁심광장', '🚎이동', 'IST Airport B2 Platform 16', 'HVIST-16 버스. 275TL/인 (2인 550TL=18,700원). 배차: 16:50/17:25/18:00. 💳컨택리스 카드결제 OK. B2층 16번 플랫폼', 'Europe/Istanbul', '18700', 'https://maps.app.goo.gl/havist-ist', '', routeLink('Istanbul Airport IST', 'Taksim Square Istanbul', 'transit')],
    ['2026-03-12', '18:00', '18:15', 'Nippon Hotel 체크인', '🏨숙소', 'Nippon Hotel, Taksim, Istanbul', '탁심광장 도보 5분. 이스티클랄 거리 입구', 'Europe/Istanbul', '90000', 'https://maps.app.goo.gl/nippon-taksim', '1697933648', ''],
    ['2026-03-12', '18:30', '19:30', '🍽️ 저녁: Hacı Usta Kebap House', '🍽️식사', 'Hacı Usta Kebap, Taksim, Istanbul', '탁심 20년 현지 맛집. 양시쉬케밥(Kuzu Şiş) 350TL, 닭시쉬(Tavuk Şiş) 280TL, 아다나케밥(Adana) 320TL. 차이(Çay) 무료. ⚠️아드나케밥 매움주의. 💳카드OK', 'Europe/Istanbul', '26000', '', '', ''],
    ['2026-03-12', '19:40', '20:20', '이스티클랄 거리 야경 산책', '🚶관광', 'İstiklal Caddesi, Beyoğlu, Istanbul', '탁심광장→이스티클랄거리 하행 (1.4km). 공화국기념비, 빨간전차 포토존. 피곤하면 T2 빨간전차(35TL/인, 이스탄불카드)', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-12', '20:20', '20:50', '🍰 HASAN FEHMİ ÖZSÜT 1915', '🍽️식사', 'Hasan Fehmi Özsüt, Beyoğlu, Istanbul', '1950년 창업 전통 디저트. 카잔디비(Kazandibi, 캬라멜우유푸딩) 120TL, 수틀라치(Sütlaç, 쌀푸딩) 100TL, 카이막(Kaymak) 150TL. 💳카드OK', 'Europe/Istanbul', '15000', '', '', ''],
    ['2026-03-12', '20:50', '21:20', '갈라타 타워 & 다리 야경', '🌃관광', 'Galata Tower, Istanbul', '타워 외관 감상→갈라타 다리 하행. 푸니쿨라(F2) Beyoğlu→Karaköy 35TL/인 (이스탄불카드). 2인 70TL=2,400원. 보스포루스 야경', 'Europe/Istanbul', '2400', '', '', ''],
    ['2026-03-12', '21:20', '21:50', '🍽️ 고등어케밥 (선택)', '🍽️식사', 'Galata Bridge, Eminönü, Istanbul', '에미뇌뉘 선착장 옆. Mehmet Usta 또는 Eyyup Usta. 고등어케밥(Balık Ekmek) 150TL/개. 50년 전통. 배부르면 패스. 💵현금 권장', 'Europe/Istanbul', '10000', '', '', ''],
    ['2026-03-12', '21:50', '22:20', '카라쿄이→호텔 복귀', '🚎이동', 'Karaköy → Taksim', 'Tünel(F2) Karaköy→Beyoğlu 35TL/인 + İstiklal 도보 15분. 2인 70TL=2,400원. (또는 택시 300TL)', 'Europe/Istanbul', '2400', '', '', routeLink('Karaköy Istanbul', 'Taksim Square Istanbul', 'transit')],

    // ===================== 3/13 (금) 이스탄불→카파도키아 =====================
    ['2026-03-13', '05:00', '05:50', 'Nippon Hotel 체크아웃', '🏨숙소', 'Nippon Hotel, Taksim', '짐 정리. 전날 밤 미리 챙기기', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-13', '06:00', '07:20', '호텔→IST 공항', '🚎이동', 'Taksim Bus Stop', 'HVIST-9 버스 06:15 탑승 (탁심광장 정류장). 275TL/인 (2인 550TL=18,700원). 💳컨택리스 OK. 05:45까지 도착 필수', 'Europe/Istanbul', '18700', '', '', routeLink('Taksim Square Istanbul', 'Istanbul Airport IST', 'transit')],
    ['2026-03-13', '07:20', '09:10', 'IST 공항 체크인', '✈️항공', 'Istanbul Airport (IST) Domestic', '국내선 수속 (15kg 위탁). 조식: Simit Sarayı (Simit시미트+차이 2인 150TL=5,100원)', 'Europe/Istanbul', '5100', '', '', ''],
    ['2026-03-13', '09:10', '09:10', '✈️ IST 출발 (TK2004)', '✈️항공', 'Istanbul Airport (IST)', '터키항공 국내선→네브셰히르. 창가좌석 추천 (카파도키아 공중조망)', 'Europe/Istanbul', '185000', '', 'SMLKWV', ''],
    ['2026-03-13', '10:35', '10:35', '✈️ NAV 도착 (TK2004)', '✈️항공', 'Nevşehir Kapadokya Airport (NAV)', '', 'Europe/Istanbul', '', '', 'SMLKWV', ''],
    ['2026-03-13', '10:35', '11:40', 'NAV 공항→괴레메', '🚎이동', 'Nevşehir Airport → Göreme', '공항셔틀 정시출발, 호텔 앞 하차 (2인 21,000원). 또는 돌무쉬 300TL/인 (대기 10~30분)', 'Europe/Istanbul', '21000', '', '1703640400', routeLink('Nevşehir Kapadokya Airport', 'Göreme Cappadocia', 'driving')],
    ['2026-03-13', '11:40', '12:00', 'Sarnich Cave Suites 체크인', '🏨숙소', 'Sarnich Cave Suites, Göreme', '동굴호텔 체험! 괴레메 중심부 도보 3분. ✅무료 전용주차장 있음. 조식 테라스에서 열기구 조망. ⚠️아고다 CI 14:00 → 11:40 도착이라 짐 맡기고 점심 먼저', 'Europe/Istanbul', '268000', '', '1697936130', ''],
    ['2026-03-13', '12:00', '13:00', '호텔 휴식 & 샤워', '🛌휴식', 'Sarnich Cave Suites', '새벽기상+이동 피로회복. 점심 전 1시간 휴식', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-13', '13:00', '15:00', '🍽️ 점심: TUMA Restaurant', '🍽️식사', 'TUMA Restaurant, Göreme', '⭐4.9 항아리케밥(Testi Kebabı, 테스티케밥) 350TL 필수! 불쇼 퍼포먼스. 카트메르(Katmer, 피스타치오+카이막 디저트) 180TL, 돈두르마(Dondurma, 터키아이스크림) 80TL. 테라스 석양뷰. 💳카드OK', 'Europe/Istanbul', '50000', '', '', ''],
    ['2026-03-13', '15:00', '16:30', '호텔 낮잠', '🛌휴식', 'Sarnich Cave Suites', '오후 3~4시 카파도키아 햇볕 강함. 실내 휴식 권장', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-13', '16:30', '18:00', '☕ 카페 투어', '☕카페', 'Göreme center', '옵션1) King\'s Coffee Shop ⭐4.9 - 후기 최고\n옵션2) Le Petite Pause - 어린왕자 감성\n옵션3) The Patio Cappadocia ⭐5.0 - 치즈케이크 맛집\n카이막(Kaymak) 120TL, 터키쉬티(Türk Çayı) 80TL. 💳카드OK', 'Europe/Istanbul', '8000', '', '', ''],
    ['2026-03-13', '18:00', '18:30', '석양 감상 (Lover\'s Hill)', '🌅관광', 'Aşıklar Tepesi (Lover\'s Hill), Göreme', '★9주년 추천★ 괴레메 도보 15분. 360도 파노라마. 와인 한 병 들고 가기. 일몰 18:30~19:00', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-13', '18:30', '20:00', '🍽️ 저녁: Oscar Steak House', '🍽️식사', 'Oscar Steak House, Göreme', '⭐4.9 괴레메 #1! ★기념일 디너★ 양갈비(Kuzu Pirzola) 990TL, 골드오토만스테이크 1890TL. 무료 차이+바클라바 서비스. 석양 테라스 예약 필수. 💳카드OK', 'Europe/Istanbul', '60000', '', '', ''],
    ['2026-03-13', '20:00', '20:30', 'Bim 수퍼마켓', '🛍️쇼핑', 'Bim Market, Göreme', '생수, 간식 장보기. 💵현금/💳카드 모두 가능', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-13', '20:30', '21:00', '호텔 복귀 & 취침', '🛌휴식', 'Sarnich Cave Suites', '밤거리 산책 (동굴호텔 조명 전경). 내일 일정 확인', 'Europe/Istanbul', '', '', '', ''],

    // ===================== 3/14 (토) 카파도키아 - 오픈에어+소금호수 =====================
    ['2026-03-14', '06:30', '08:00', '기상 & 도보 일출 감상', '🌅관광', 'Göreme Viewpoint', '호텔 테라스 → 뒷 언덕 전망대. 열기구 이륙 관람 (06:00~06:30)', 'Europe/Istanbul', '1200', '', '', ''],
    ['2026-03-14', '08:30', '09:30', '🍽️ 호텔 조식', '🍽️식사', 'Sarnich Cave Suites', '터키식 아침 (올리브Zeytin, 치즈Peynir, 시미트Simit, 멘멘Menemen). 조식 07:30~10:00', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-14', '09:30', '11:30', '괴레메 오픈에어 뮤지엄', '🕌관광', 'Göreme Open Air Museum', '★필수★ UNESCO 세계문화유산. 비잔틴 프레스코 벽화 동굴교회. 다크교회(Karanlık Kilise, +6EUR) 추천. 입장 20EUR/인 (2인 68,000원). 도보 15분', 'Europe/Istanbul', '90000', 'https://maps.app.goo.gl/goreme-museum', '', ''],
    ['2026-03-14', '11:30', '12:30', '괴레메 마을 산책', '🚶관광', 'Göreme town center', '기념품 가게, 터키램프 가게, 카펫 구경. 투어 준비물 구매 (선크림, 물)', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-14', '12:30', '13:30', '🍽️ 점심', '🍽️식사', 'Göreme', '옵션1) Cappadocian Cuisine - 오너 어머니 홈쿡, 가성비 600TL\n옵션2) Nostalji Restaurant ⭐4.5 - 루프탑, 항아리케밥 800TL\n옵션3) TUMA (어제 안 갔으면) 1200TL. 💳카드OK', 'Europe/Istanbul', '30000', '', '', ''],
    ['2026-03-14', '14:00', '14:30', '🚗 Sunset Rent a Car 픽업', '🚗렌트', 'Sunset Rent a Car, Göreme', '60 EUR (≈102,000원). WhatsApp 연락. 💳카드 결제 가능', 'Europe/Istanbul', '100000', '', '', ''],
    ['2026-03-14', '14:30', '16:00', '괴레메→소금호수 드라이브', '🚗이동', 'Göreme → Tuz Gölü', '170km, 1시간30분. ⚠️Aksaray에서 반드시 주유! (Opet/Petrol Ofisi/Shell). 이후 70km 주유소 없음. 연료 200TL=6,800원', 'Europe/Istanbul', '6800', '', '', routeLink('Göreme Cappadocia', 'Tuz Gölü Salt Lake Turkey', 'driving')],
    ['2026-03-14', '16:00', '18:30', '소금호수 탐험 & 일몰', '🌅관광', 'Tuz Gölü (Salt Lake), Aksaray', '소금 크러스트 걷기 + 골든아워 사진. ⚠️신발 젖음 (여분 양말 필수). 일몰 감상. 무료 입장', 'Europe/Istanbul', '0', 'https://maps.app.goo.gl/tuz-golu', '', ''],
    ['2026-03-14', '18:30', '20:30', '소금호수→괴레메 복귀', '🚗이동', 'Tuz Gölü → Göreme', '170km 야간운전. ⚠️직선 고속도로 졸음주의, 교대운전 권장. 연료 200TL=6,800원', 'Europe/Istanbul', '6800', '', '', routeLink('Tuz Gölü Salt Lake Turkey', 'Göreme Cappadocia', 'driving')],
    ['2026-03-14', '20:30', '21:00', '호텔 복귀 & 취침', '🛌휴식', 'Sarnich Cave Suites', '하루 투어 후 충분한 수면', 'Europe/Istanbul', '', '', '', ''],

    // ===================== 3/15 (일) 카파도키아→안탈리아 =====================
    ['2026-03-15', '06:00', '06:30', '로즈밸리 이동', '🚗이동', 'Rose Valley Sunset Point', '호텔→로즈밸리 12분. ✅손전등 필수 ✅보온복 (새벽 2~5°C) ✅비포장 700m 서행', 'Europe/Istanbul', '', '', '', routeLink('Sarnich Cave Suites Göreme', 'Rose Valley Cappadocia', 'driving')],
    ['2026-03-15', '06:30', '07:30', '🎈 열기구 이륙 관람 + 일출', '🌅관광', 'Rose Valley, Cappadocia', '★로맨틱★ 전망대에서 열기구 이륙 관람 + 일출 06:42~06:48. 카메라 삼각대 세팅', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-15', '07:30', '08:00', '로즈밸리→호텔 귀환', '🚗이동', 'Rose Valley → Sarnich Cave Suites', '12분 운전. 연료 50TL=1,700원', 'Europe/Istanbul', '1700', '', '', routeLink('Rose Valley Cappadocia', 'Sarnich Cave Suites Göreme', 'driving')],
    ['2026-03-15', '08:30', '09:30', '🍽️ 호텔 조식', '🍽️식사', 'Sarnich Cave Suites', '터키식 아침. 조식 07:30~10:00', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-15', '09:30', '10:50', '휴식 & 체크아웃 준비', '🛌휴식', 'Sarnich Cave Suites', '샤워·짐 정리. 11:00 체크아웃', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-15', '10:50', '11:00', 'Sarnich Cave 체크아웃', '🏨숙소', 'Sarnich Cave Suites', '', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-15', '11:00', '11:10', '괴레메→우치히사르 이동', '🚗이동', 'Göreme → Uçhisar', '10분 운전', 'Europe/Istanbul', '', '', '', routeLink('Göreme Cappadocia', 'Uçhisar Castle Cappadocia', 'driving')],
    ['2026-03-15', '11:10', '12:00', '우치히사르 성', '🕌관광', 'Uçhisar Castle, Cappadocia', '카파도키아 최고 높이 천연 성채. 꼭대기 파노라마뷰. 입장 250TL/인 (2인 500TL=17,000원)', 'Europe/Istanbul', '17000', '', '', ''],
    ['2026-03-15', '12:00', '12:50', '피죤밸리', '🕌관광', 'Pigeon Valley, Cappadocia', '우치히사르→피죤밸리 도보 하행. 전망대 사진. 무료', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-15', '12:50', '13:10', '우치히사르→아바노스 이동', '🚗이동', 'Uçhisar → Avanos', '20분 운전', 'Europe/Istanbul', '', '', '', routeLink('Uçhisar Cappadocia', 'Avanos Cappadocia', 'driving')],
    ['2026-03-15', '13:10', '14:00', '🍽️ 점심: 아바노스', '🍽️식사', 'Avanos', '옵션1) Fatıma\'nın Sofrası ⭐4.7 만티(Mantı, 터키만두)·도마테스·파술예 500TL\n옵션2) Ciğercan ⭐5.0 간케밥(Ciğer Kebabı) 700TL\n옵션3) 현지 로칸타. 💳카드OK', 'Europe/Istanbul', '20000', '', '', ''],
    ['2026-03-15', '14:00', '14:50', '아바노스 도자기 쇼핑', '🛍️쇼핑', 'Avanos Çarşı Seramik', '5층 실내몰. 머그 50~100TL, 타일 200~300TL. ★기념 도자기 선물★. 💵현금 흥정 가능', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-15', '14:50', '15:20', '강변 산책 & 커피', '☕카페', 'Kızılırmak River, Avanos', '강변 500m 산책. 흔들다리 Asma Köprü 포토존', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-15', '15:20', '15:50', '아바노스→괴레메 복귀', '🚗이동', 'Avanos → Göreme', '렌트카 반납 30분 전 연락', 'Europe/Istanbul', '', '', '', routeLink('Avanos Cappadocia', 'Göreme Cappadocia', 'driving')],
    ['2026-03-15', '15:50', '16:20', '렌트카 반납', '🚗렌트', 'Sunset Rent a Car, Göreme', '✅주유 완충 (미충전 시 3배 청구) ✅차량 손상 체크', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-15', '17:30', '19:00', '괴레메→카이세리(ASR) 공항', '🚎이동', 'Göreme → Kayseri Airport (ASR)', '공항셔틀 (사전예약). 2인 21,000원', 'Europe/Istanbul', '21000', '', '', routeLink('Göreme Cappadocia', 'Kayseri Airport ASR', 'transit')],
    ['2026-03-15', '19:00', '20:40', '카이세리 공항 체크인', '✈️항공', 'Kayseri Erkilet Airport (ASR)', '수속 및 대기', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-15', '20:40', '22:00', '✈️ ASR→AYT (XQ7033)', '✈️항공', 'ASR → Antalya Airport (AYT)', '썬익스프레스 직항 1시간20분', 'Europe/Istanbul', '130000', '', 'L39V2R', ''],
    ['2026-03-15', '22:00', '22:30', 'AYT 공항→두모 스위트', '🚎이동', 'Antalya Airport → Dumo Suite Hotel', '택시 500TL (2인 17,000원). 야간이라 택시 추천 (트램 배차 30분+)', 'Europe/Istanbul', '17000', '', '', routeLink('Antalya Airport AYT', 'Dumo Suite Hotel Antalya', 'driving')],
    ['2026-03-15', '22:30', '23:00', '두모 스위트 호텔 체크인', '🏨숙소', 'Dumo Suite Hotel, Antalya', '칼레이치 도보 5분. 가족운영 부티크호텔. ⚠️야간 22:30 도착 → 사전연락 필수', 'Europe/Istanbul', '', '', '1697940980', ''],

    // ===================== 3/16 (월) 안탈리아 → 리조트 =====================
    ['2026-03-16', '08:00', '09:00', '🍽️ 두모 스위트 조식', '🍽️식사', 'Dumo Suite Hotel', '터키식 아침 포함', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-16', '09:00', '11:00', '칼레이치 구시가지 산책', '🚶관광', 'Kaleiçi, Antalya', '★로맨틱 산책★ 하드리아누스문(Hadrian\'s Gate)→칼레이치 골목(오스만건축)→안탈리아 항구(지중해 전망). 편한 신발 필수', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-16', '11:00', '11:30', '칼레이치→두모 스위트 복귀', '🚶이동', 'Kaleiçi → Dumo Suite Hotel', '도보 10분', 'Europe/Istanbul', '0', '', '', routeLink('Kaleiçi Old Town Antalya', 'Dumo Suite Hotel Antalya', 'walking')],
    ['2026-03-16', '11:30', '12:00', '두모 스위트→리조트 이동', '🚎이동', 'Dumo Suite → Concorde Deluxe Resort', '택시 600TL (2인 20,400원). 30분. 짐+체력 배려', 'Europe/Istanbul', '20400', '', '', routeLink('Dumo Suite Hotel Antalya', 'Concorde De Luxe Resort Lara Antalya', 'driving')],
    ['2026-03-16', '12:00', '12:30', '콩코드 드럭스 리조트 체크인', '🏨숙소', 'Concorde De Luxe Resort, Lara Beach, Antalya', '★울트라 올인클루시브★ 식사+주류+스파+실내수영장+하맘 무제한. 5성급 지중해전망. ⚠️CI 15:00이지만 12:00 도착 → 짐 맡기고 올인클 시설 먼저', 'Europe/Istanbul', '560755', '', '1697944394', ''],
    ['2026-03-16', '14:00', '15:00', '🍽️ 리조트 점심 뷔페', '🍽️식사', 'Concorde De Luxe Resort', '올인클루시브. 지중해 해산물코너(생선구이Balık, 새우Karides)+메제(Meze, 냉채모듬) 추천', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-16', '15:00', '17:00', '리조트 시설 이용', '🏖️휴식', 'Concorde De Luxe Resort', '실내수영장(3월 야외 쌀쌀)+하맘. 수영복 필수', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-16', '19:00', '20:30', '🍽️ 리조트 저녁 뷔페', '🍽️식사', 'Concorde De Luxe Resort', '국제요리 뷔페. 라이브쿠킹(스테이크,파스타)+터키디저트(바클라바Baklava,퀴네페Künefe)', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-16', '21:00', '22:00', '조기 취침', '🛌휴식', 'Concorde De Luxe Resort', '카파도키아 강행군 피로회복', 'Europe/Istanbul', '', '', '', ''],

    // ===================== 3/17 (화) 리조트 완전 휴식일 =====================
    ['2026-03-17', '09:00', '10:00', '🍽️ 리조트 아침 뷔페', '🍽️식사', 'Concorde De Luxe Resort', '터키식 아침 필수: 멘멘(Menemen), 시미트(Simit), 카이막+발(Kaymak+Bal, 크림+꿀), 페타치즈+올리브, 차이(Çay)', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-17', '10:00', '13:00', '리조트 휴식', '🏖️휴식', 'Concorde De Luxe Resort', '★완전 휴식일★ 해변산책/실내수영장/스파/피트니스/낮잠. 이동 제로', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-17', '13:00', '14:00', '🍽️ 리조트 점심 뷔페', '🍽️식사', 'Concorde De Luxe Resort', '지중해 해산물 + 터키 케밥 스테이션', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-17', '15:00', '16:30', '🛀 터키식 하맘 체험', '🛀체험', 'Concorde De Luxe Resort Spa', '★터키 전통문화 체험★ ①온열실 15분 ②대리석 눕기 ③때밀이(Kese) ④비누거품마사지(Köpük). 오일마사지 별도 €30 (≈51,000원)', 'Europe/Istanbul', '50000', '', '', ''],
    ['2026-03-17', '19:00', '20:30', '🍽️ 리조트 저녁 뷔페', '🍽️식사', 'Concorde De Luxe Resort', '국제요리 + 퀴네페(Künefe, 카다이프치즈디저트), 수틀라치(Sütlaç, 쌀푸딩)', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-17', '21:00', '22:00', '🎭 리조트 나이트 쇼', '🎭체험', 'Concorde De Luxe Resort', '벨리댄스, 민속춤, 라이브 음악. 올인클루시브 포함', 'Europe/Istanbul', '0', '', '', ''],

    // ===================== 3/18 (수) 안탈리아→이스탄불 =====================
    ['2026-03-18', '09:00', '10:00', '🍽️ 리조트 아침 뷔페', '🍽️식사', 'Concorde De Luxe Resort', '터키식 아침. 마지막 리조트 식사', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-18', '10:00', '10:15', '리조트 체크아웃', '🏨숙소', 'Concorde De Luxe Resort', '짐 정리. 레이트체크아웃 불가', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-18', '10:15', '11:00', '리조트→AYT 공항', '🚎이동', 'Concorde De Luxe → Antalya Airport', '택시 600TL (2인 20,400원). 리조트 외곽이라 택시만 가능', 'Europe/Istanbul', '20400', '', '', routeLink('Concorde De Luxe Resort Lara Antalya', 'Antalya Airport AYT', 'driving')],
    ['2026-03-18', '11:00', '12:15', 'AYT 공항 체크인', '✈️항공', 'Antalya Airport (AYT)', '수속 및 대기', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-18', '12:15', '13:50', '✈️ AYT→IST', '✈️항공', 'AYT → Istanbul Airport', '터키항공 국내선 1시간35분', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-18', '14:30', '16:30', 'IST 공항→술탄아흐메트', '🚎이동', 'IST Airport → Sultanahmet', '⚠️HVIST-11 운행중단! 대체: HVL-1 버스(IST→Aksaray) 275TL/인 + T1 트램(Aksaray→Sultanahmet) 35TL/인. 2인 총 620TL=21,100원. 소요 약 2시간', 'Europe/Istanbul', '21100', '', '', routeLink('Istanbul Airport IST', 'Sultanahmet Istanbul', 'transit')],
    ['2026-03-18', '16:30', '17:00', '호텔 술타니아 체크인', '🏨숙소', 'Hotel Sultania, Sultanahmet, Istanbul', '아야소피아 도보 3분. 올드시티 관광 최적 거점. 💳ATM: Ziraat Bankası Divanyolu Cad. (도보 5분)', 'Europe/Istanbul', '367058', '', '1698115578', ''],
    ['2026-03-18', '17:00', '20:50', '🍽️ 미식 야경 투어', '🍽️체험', 'Karaköy → Kadıköy, Istanbul', '★하이라이트★ 마이리얼트립 미식투어. 카드쿄이+보스포루스 페리+석양. 44,910원/인. ⭐4.9(907+리뷰). [옵션] 워킹투어 45,000원/인, 7시간', 'Europe/Istanbul', '89820', '', '', ''],
    ['2026-03-18', '21:30', '22:00', '카라쿄이→호텔 복귀', '🚎이동', 'Karaköy → Sultanahmet', 'T1 트램 35TL/인 (2인 70TL=2,400원) 또는 택시 400TL. 야간이라 택시 추천', 'Europe/Istanbul', '15000', '', '', routeLink('Karaköy Istanbul', 'Sultanahmet Istanbul', 'transit')],

    // ===================== 3/19 (목) 이스탄불 올드시티 =====================
    ['2026-03-19', '08:00', '09:00', '🍽️ 호텔 조식', '🍽️식사', 'Hotel Sultania', '터키식 아침. 숙박 포함. ★Olive Restaurant 루프탑 조식 — 보스포루스+블루모스크 뷰', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-19', '09:00', '10:00', '🕌 아야 소피아 (외관)', '🕌관광', 'Hagia Sophia, Sultanahmet, Istanbul', '외관 감상 + 광장 사진. 현재 모스크로 운영중 → 무료 입장 가능하나 긴 줄. [옵션] 톱카프 궁전 2,750TL/인', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-19', '10:00', '11:30', '🕌 슐레이만대제 모스크', '🕌관광', 'Süleymaniye Mosque, Fatih, Istanbul', '★미마르 시난 걸작★ 블루모스크보다 한적하고 웅장. 정원에서 골든혼 파노라마. 무료. ⚠️여성 히잡 필수', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-19', '11:30', '13:00', '📚 사하플라르+그랜드 바자르', '🛍️쇼핑', 'Grand Bazaar (Kapalıçarşı), Istanbul', '★사하플라르 차르슈스(고서적시장) 반드시! 바자르 옆 도보 2분. 소설가 영감★ 바자르 4,000개 상점. 💵현금 추천. 흥정팁: 50%에서 시작', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-19', '13:00', '14:30', '🍽️ 점심: Balıkçı Sabahattin', '🍽️식사', 'Balıkçı Sabahattin, Sultanahmet, Istanbul', '1927년 해산물맛집. 농어/도미 그릴, 메제 20종, 라크. 예약 권장. 💳카드OK. [옵션] Develi Kebap(1912, 사마트야)', 'Europe/Istanbul', '70000', '', '', ''],
    ['2026-03-19', '14:30', '15:00', '블루 모스크', '🕌관광', 'Blue Mosque (Sultanahmet Camii), Istanbul', '무료. 30분. ⚠️어깨/무릎 가리기, 여성 히잡, 신발 벗기', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-19', '15:00', '15:30', '🍦 카이막 간식', '🍽️식사', 'Sultanahmet area, Istanbul', '생카이막+꿀 콤보 150-250TL. [옵션] Boris\'in Yeri(발라트, 백종원 추천)', 'Europe/Istanbul', '8500', '', '', ''],
    ['2026-03-19', '17:00', '19:00', '☕ 피에르 로티 카페', '☕카페', 'Pierre Loti Cafe, Eyüp, Istanbul', '골든혼 전망 카페. ★석양 18:30~19:00★ 터키커피 또는 사흘레프. 💳카드OK. [옵션] 발라트 컬러풀 거리+Naftalin K', 'Europe/Istanbul', '5000', '', '', ''],
    ['2026-03-19', '19:30', '21:30', '🍽️ 저녁: Hamdi Restaurant', '🍽️식사', 'Hamdi Restaurant, Eminönü, Istanbul', '★루프탑 야경 디너★ 퀴슐레메(구운양갈비), 이스켄데르케밥. 갈라타다리+모스크 야경. 루프탑 좌석 예약 필수. 💳카드OK', 'Europe/Istanbul', '55000', '', '', ''],
    ['2026-03-19', '21:30', '22:00', '저녁→호텔 복귀', '🚎이동', 'Eminönü → Sultanahmet', 'T1 트램 35TL/인 (2인 70TL=2,400원) 또는 택시 300TL', 'Europe/Istanbul', '10000', '', '', routeLink('Eminönü Istanbul', 'Sultanahmet Istanbul', 'transit')],

    // ===================== 3/20 (금) 이스탄불 신시가지 =====================
    ['2026-03-20', '08:00', '09:00', '🍽️ 호텔 조식', '🍽️식사', 'Hotel Sultania', '터키식 아침. 숙박 포함. ★Olive Restaurant 루프탑 — 마지막 올드시티 뷰', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-20', '09:00', '10:30', '바실리카 저수지', '🕌관광', 'Basilica Cistern, Sultanahmet, Istanbul', '★지하 궁전★ 336개 기둥. 메두사 머리 기둥 포토. 비 와도 OK(지하). 1,950TL/인 (2인 3,900TL=133,000원)', 'Europe/Istanbul', '133000', '', '', ''],
    ['2026-03-20', '10:30', '11:00', '히포드롬 광장', '🕌관광', 'Sultanahmet Meydanı, Istanbul', '오벨리스크, 뱀 기둥, 독일 분수. 무료. 도보 5분', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-20', '11:00', '11:30', '술탄아흐메트→베이욜루 이동', '🚎이동', 'Sultanahmet → Beyoğlu', '택시 400TL (2인 13,600원). 짐2개. 💳BiTaksi앱 결제', 'Europe/Istanbul', '13600', '', '', routeLink('Sultanahmet Istanbul', 'Beyoğlu Istanbul', 'driving')],
    ['2026-03-20', '11:30', '12:30', '톰톰 스위트 체크인', '🏨숙소', 'TomTom Suites, Beyoğlu, Istanbul', '갈라타타워 도보 3분. ★미슐랭 1스타 Nicole 레스토랑(호텔 내). 테이스팅메뉴 8,100TL/인. 보스포루스 파노라마★', 'Europe/Istanbul', '252986', '', '1696582910', ''],
    ['2026-03-20', '12:30', '14:00', '🍽️ 점심: Meze By Lemon Tree', '🍽️식사', 'Meze By Lemon Tree, Beyoğlu, Istanbul', '현대식 터키퓨전. 메제 테이스팅 12종, 오징어튀김, 라크칵테일. 예약 권장. 💳카드OK', 'Europe/Istanbul', '50000', '', '', ''],
    ['2026-03-20', '14:00', '17:00', '☕ 갈라타/카라쿄이 감성 카페 루트', '☕카페', 'FiLBooks, Karaköy, Istanbul', '갈라타타워 외관 감상(올라가지 않음) → ①FiLBooks(포토북+카페) ②Galata Konak Cafe(360도 뷰) ③Çukurcuma 빈티지 골목. [옵션] 보스포루스 석양 크루즈(Turyol, 17:00, 250TL/인)', 'Europe/Istanbul', '10000', '', '', ''],
    ['2026-03-20', '19:00', '21:30', '🍽️ 저녁: Mikla Restaurant', '🍽️식사', 'Mikla Restaurant, The Marmara Pera, Beyoğlu', '★피날레 디너★ 미슐랭가이드. 터키-스칸디나비안 퓨전. 시그니처 코스. 보스포루스 루프탑 야경. ⚠️최소 3일전 예약. [옵션] Nicole@TomTom 미슐랭1스타 8,100TL/인', 'Europe/Istanbul', '160000', '', '', ''],
    ['2026-03-20', '21:30', '22:00', '호텔 복귀', '🚶이동', 'Mikla → TomTom Suites', '도보 10분', 'Europe/Istanbul', '', '', '', routeLink('Mikla Restaurant Istanbul', 'TomTom Suites Istanbul', 'walking')],

    // ===================== 3/21 (토) 이스탄불→서울 =====================
    ['2026-03-21', '09:00', '10:00', '🍽️ 호텔 조식', '🍽️식사', 'TomTom Suites', '마지막 터키식 아침. 숙박 포함', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-21', '10:00', '11:00', '톰톰 스위트 체크아웃', '🏨숙소', 'TomTom Suites', '짐 정리. 호텔에 짐 보관 요청 (무료)', 'Europe/Istanbul', '', '', '', ''],
    ['2026-03-21', '11:00', '14:00', '마지막 쇼핑 & 브런치', '🛍️쇼핑', 'İstiklal Caddesi, Beyoğlu', '⚠️Eid 연휴: 그랜드바자르/사하플라르 3/20-22 휴무! 이스티클랄 OK. ①쇼핑(Mavi, LC Waikiki) ②Van Kahvaltı Evi 브런치 ③Kurukahveci 커피원두 ④Koska 로쿰. [옵션] 카드쿄이 시장(아시아사이드, 현지가격)', 'Europe/Istanbul', '60000', '', '', ''],
    ['2026-03-21', '14:00', '15:30', '베이욜루→IST 공항', '🚎이동', 'Taksim → Istanbul Airport', 'HVL-16 버스 275TL/인 (2인 550TL=18,700원). 💳컨택리스 OK. 탁심광장 출발. 전용차로', 'Europe/Istanbul', '18700', '', '', routeLink('Taksim Square Istanbul', 'Istanbul Airport IST', 'transit')],
    ['2026-03-21', '15:30', '17:00', '☕ IGA 라운지', '☕라운지', 'IGA Lounge, Istanbul Airport Mezzanine', 'Priority Pass 입장. 24시간 운영. Mezzanine층. 식사+음료+마사지+샤워+면세점 이용 가능. ★출국 전 마지막 휴식★', 'Europe/Istanbul', '0', '', '', ''],
    ['2026-03-21', '17:20', '17:20', '✈️ IST 출발 (OZ552)', '✈️항공', 'Istanbul Airport (IST)', '아시아나 직항 귀국편 (11시간15분). 기내식 2회', 'Europe/Istanbul', '', '', 'DP5W84', ''],
    ['2026-03-22', '09:35', '09:35', '✈️ ICN 도착 (OZ552)', '✈️항공', '인천국제공항', '도착. 수고하셨습니다! 🎉', 'Asia/Seoul', '', '', 'DP5W84', ''],
  ];

  // maps_link 자동 생성: location 필드 기반
  for (let i = 1; i < data.length; i++) {
    const location = data[i][5]; // location 컬럼
    if (location && !data[i][9]) { // maps_link가 비어있으면 자동 생성
      data[i][9] = mapsLink(location);
    }
  }

  // alt_options 컬럼 패딩 (모든 행을 13컬럼으로)
  const numCols = headers.length;
  for (let i = 1; i < data.length; i++) {
    while (data[i].length < numCols) data[i].push('');
  }

  // alt_options 데이터 삽입 (제목으로 매칭)
  const altMap = {
    '리조트 시설 이용': '💡 다른 옵션:\n• 🏖️ Sandland 모래조각 박물관 (리조트 도보10분, 70TL/인)\n• 🛍️ Antalium Premium Mall (리조트 도보5분, LC Waikiki/Koton)',
    '리조트 휴식': '💡 다른 옵션:\n• 🌊 Lower Düden Waterfall (택시10분, 40m 폭포, 무료)\n• 🏖️ Lara Beach+Sandland 콤보 (도보, 반나절)',
    'IST 공항→술탄아흐메트': '💡 다른 옵션:\n• 🚇 M11 공항메트로 (123TL/인, 75-100분, ★최저가★)\n• 🚕 택시 (1,500-2,000TL, 45분, ★최편안★)',
    '🍽️ 미식 야경 투어': '💡 다른 옵션:\n• 📱 마이리얼트립 워킹투어 (45,000원/인, 7시간, ⭐4.9)',
    '🕌 아야 소피아 (외관)': '💡 다른 옵션:\n• 🏛️ 톱카프 궁전 (2,750TL/인, 하렘 포함, 비 올 때 추천)',
    '🕌 슐레이만대제 모스크': '💡 다른 옵션:\n• 🏛️ 톱카프 궁전 (실내 관광, 비 올 때 추천)',
    '🍽️ 점심: Balıkçı Sabahattin': '💡 다른 옵션:\n• 🍖 Develi Kebap 1912 (사마트야, 피스타치오케밥, 세계100대)',
    '🍦 카이막 간식': '💡 다른 옵션:\n• 🍯 Boris\'in Yeri (발라트, ★백종원 추천★, 자체생산 카이막)',
    '☕ 피에르 로티 카페': '💡 다른 옵션:\n• 🎨 발라트 컬러풀 거리 + Naftalin K 카페 (인스타 명소)',
    '☕ 갈라타/카라쿄이 감성 카페 루트': '💡 다른 옵션:\n• 🚢 보스포루스 석양 크루즈 (Turyol, 250TL/인, 1.5시간, 17:00)',
    '🍽️ 저녁: Mikla Restaurant': '💡 다른 옵션:\n• 🍽️ Nicole@TomTom 미슐랭1스타 (8,100TL/인, 호텔 내)',
    '마지막 쇼핑 & 브런치': '💡 다른 옵션:\n• 🛒 카드쿄이 시장 (아시아사이드, 페리20분, 현지가격, 바가지 없음)',
  };
  for (let i = 1; i < data.length; i++) {
    const title = data[i][3];
    if (altMap[title]) {
      data[i][12] = altMap[title];
    }
  }

  // 데이터 입력
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

  // 헤더 스타일
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold');
  headerRange.setWrap(true);

  // 컬럼 너비
  sheet.setColumnWidth(1, 100); // date
  sheet.setColumnWidth(2, 55);  // start
  sheet.setColumnWidth(3, 55);  // end
  sheet.setColumnWidth(4, 250); // title
  sheet.setColumnWidth(5, 70);  // category
  sheet.setColumnWidth(6, 250); // location
  sheet.setColumnWidth(7, 400); // description
  sheet.setColumnWidth(8, 120); // timezone
  sheet.setColumnWidth(9, 80);  // cost
  sheet.setColumnWidth(10, 150); // maps_link
  sheet.setColumnWidth(11, 120); // booking_ref
  sheet.setColumnWidth(12, 200); // route_link

  // 카테고리별 색상
  const categoryColors = {
    '✈️항공': '#e8f0fe',
    '🚎이동': '#fce8e6',
    '🚗이동': '#fce8e6',
    '🚶이동': '#fce8e6',
    '🏨숙소': '#e6f4ea',
    '🍽️식사': '#fef7e0',
    '🕌관광': '#f3e8fd',
    '🌅관광': '#f3e8fd',
    '🌃관광': '#f3e8fd',
    '🚶관광': '#f3e8fd',
    '🛌휴식': '#f1f3f4',
    '🏖️휴식': '#e0f7fa',
    '🛍️쇼핑': '#fce4ec',
    '☕카페': '#fff3e0',
    '🛀체험': '#e0f2f1',
    '🎭체험': '#e0f2f1',
    '🍽️체험': '#fef7e0',
    '🚗렌트': '#fce8e6',
    '☕라운지': '#e0f2f1',
  };

  for (let i = 2; i <= data.length; i++) {
    const cat = data[i-1][4];
    if (categoryColors[cat]) {
      sheet.getRange(i, 1, 1, headers.length).setBackground(categoryColors[cat]);
    }
  }

  // 날짜 구분선 (굵은 테두리)
  let prevDate = '';
  for (let i = 2; i <= data.length; i++) {
    const date = data[i-1][0];
    if (date !== prevDate && prevDate !== '') {
      sheet.getRange(i, 1, 1, headers.length).setBorder(true, null, null, null, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
    prevDate = date;
  }

  // 필터 추가
  sheet.getRange(1, 1, data.length, headers.length).createFilter();

  // 시트 고정
  sheet.setFrozenRows(1);

  Logger.log('✅ 일정표 시트 완료');
}

// ============================================================
// 시트 2: 식당 가이드
// ============================================================
function createRestaurantSheet(ss) {
  let sheet = ss.getSheetByName('식당가이드');
  if (!sheet) sheet = ss.insertSheet('식당가이드');
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.clear();

  const headers = ['날짜', '식사', '추천순위', '식당명', '평점', '장르', '추천메뉴', '가격(2인,TRY)', '가격(2인,KRW)', '분위기', '기념일적합', '주소/위치', '예약필요', '비고', 'maps_link'];

  const data = [
    headers,
    // 3/12 저녁
    ['3/12', '저녁', '1순위', 'Hacı Usta Kebap House', '4.3', '케밥', '양고기 시쉬케밥(Kuzu Şiş), 닭시쉬(Tavuk Şiş). 차이 무료', '800', '26000', '로컬 맛집', '-', '탁심 도보 5분', 'X', '20년 전통. 아드나케밥 매움주의', ''],
    ['3/12', '저녁', '2순위', 'Zübeyr Ocakbaşı', '4.5', '케밥/그릴', '우르파케밥, 아다나케밥, 갈비(Kaburga). 숯불 직화', '1200', '40000', '활기찬 로컬', '-', '탁심 도보 8분', 'X', '평점 높은 현지인 맛집'],
    ['3/12', '저녁', '3순위', 'Denizler Kasap & Mangal', '4.2', '정육식당', '양갈비(Kuzu Pirzola) 650TL, 밥+샐러드+구운야채', '1500', '50000', '정육점 컨셉', '-', '탁심 도보 5분', 'X', '가게 좁음'],

    // 3/12 디저트
    ['3/12', '디저트', '1순위', 'HASAN FEHMİ ÖZSÜT 1915', '4.4', '전통디저트', '카잔디비(캬라멜우유푸딩), 수틀라치(쌀푸딩), 카이막', '400', '15000', '전통 카페', '◯', '이스티클랄 거리', 'X', '1950년 창업'],

    // 3/13 점심
    ['3/13', '점심', '1순위', 'TUMA Restaurant', '4.9', '테스티케밥', '항아리케밥(치킨&비프) 불쇼 퍼포먼스! 카트메르+돈두르마', '1200', '50000', '테라스 뷰', '◯', '괴레메 중심', '추천', '석양 테라스석 선점'],
    ['3/13', '점심', '2순위', 'Pumpkin Goreme', '4.6', '터키요리', '셰프 세트메뉴, 동굴 분위기', '1000', '35000', '아트갤러리', '◯', '괴레메', '필수', '사전예약 필수'],
    ['3/13', '점심', '3순위', 'Rocks Terrace Restaurant', '4.8', '터키요리', '360도 파노라마뷰, 항아리케밥, 유기농', '1500', '50000', '360도 전망', '◯', '괴레메', '추천', '서비스차지 없음'],

    // 3/13 저녁 ★기념일 디너★
    ['3/13', '★기념일 저녁★', '1순위', 'Oscar Steak House', '4.9', '스테이크/양갈비', '양갈비(Kuzu Pirzola) 990TL, 골드오토만스테이크 1890TL. 무료 차이+바클라바', '2000', '65000', '★석양 테라스★', '★최고★', '괴레메 #1', '필수', '괴레메 1위. 기념일 디너 최적'],
    ['3/13', '★기념일 저녁★', '2순위', 'Topdeck Cave Restaurant', '4.7', '아나톨리안', '캔들라이트 동굴다이닝, 바닥쿠션, 매일 바뀌는 메뉴', '1500', '50000', '★동굴 캔들★', '★최고★', '괴레메', '필수', '10테이블 한정. 가장 인티밋'],
    ['3/13', '★기념일 저녁★', '3순위', 'Afara Restaurant & Cafe', '4.8', '터키요리', '프라이빗 동굴룸, 발코니, 로컬와인', '1000', '35000', '프라이빗 동굴', '★추천★', '괴레메', '추천', '프라이빗 동굴 테이블 요청'],

    // 3/13 카페
    ['3/13', '카페', '1순위', 'King\'s Coffee Shop', '4.9', '카페', '수제 커피, 홈메이드 페이스트리. "Baba" 사장님 친절', '300', '10000', '따뜻한 홈', '-', '괴레메 중심', 'X', '괴레메 최고 카페'],
    ['3/13', '카페', '2순위', 'The Patio Cappadocia', '5.0', '카페', '산세바스찬 치즈케이크, 터키팬케이크. 가족운영', '250', '8000', '가정집 감성', '◯', '괴레메', 'X', '만점 카페!'],
    ['3/13', '카페', '3순위', 'Le Petite Pause', '4.5+', '카페', '체리/블루베리 치즈케이크. 어린왕자 감성', '200', '7000', '빈티지 히든', '◯', '괴레메 골목', 'X', '숨은 보석. 고양이'],

    // 3/14 점심
    ['3/14', '점심', '1순위', 'Cappadocian Cuisine', 'TC수상', '홈쿡', '오너 어머니 셰프. 정통 아나톨리안 홈쿡', '600', '20000', '가정식', '-', '괴레메', 'X', '가성비 최고'],
    ['3/14', '점심', '2순위', 'Nostalji Restaurant', '4.5', '터키요리', '루프탑 석양뷰, 항아리케밥', '800', '27000', '루프탑', '◯', '괴레메', 'X', '합리적 가격'],

    // 3/15 점심
    ['3/15', '점심', '1순위', 'Fatıma\'nın Sofrası', '4.7', '홈쿡뷔페', '만티(터키만두), 도마테스소스, 파술예. 가족운영 수제', '500', '17000', '따뜻한 홈', '-', '아바노스 #1', 'X', '아바노스 전체 1위!'],
    ['3/15', '점심', '2순위', 'Ciğercan Avanos', '5.0', '간케밥', '간케밥(Ciğer Kebabı), 닭꼬치, 양고기. 샐러드 포함', '700', '23000', '로컬 전문점', '-', '아바노스', 'X', '구글 만점'],

    // 3/16 칼레이치 브런치
    ['3/16', '브런치', '1순위', 'Seraser Fine Dining', '4.5', '터키퓨전', '멘멘+터키커피. 부티크호텔 내 레스토랑', '800', '27000', '부티크 우아', '◯', '칼레이치 내', '추천', '안탈리아 유일한 탐방기회'],

    // 3/19 점심
    ['3/19', '점심', '1순위', 'Balıkçı Sabahattin', '4.3', '해산물', '농어(Levrek)/도미(Çipura) 그릴, 메제20종, 라크', '2000', '70000', '전통 정원', '◯', '술탄아흐메트 도보10분', '필수', '1927년 창업. 현지인 단골'],
    ['3/19', '점심', '2순위', 'Tarihi Sultanahmet Köftecisi', '4.3', '쾨프테', '터키식 미트볼(쾨프테)+빵+샐러드', '500', '17000', '서민 맛집', '-', '술탄아흐메트', 'X', '1920년 창업. 가성비'],

    // 3/19 저녁
    ['3/19', '저녁', '1순위', 'Hamdi Restaurant', '4.2', '케밥/그릴', '퀴슐레메(구운양갈비), 이스켄데르케밥. 골든혼 야경', '1500', '55000', '★루프탑 야경★', '◯', '에미뇌뉘 도보10분', '필수', '루프탑 좌석 지정 예약'],
    ['3/19', '저녁', '2순위', 'Maiden\'s Tower Restaurant', '4.5', '터키/해산물', '보스포루스 한가운데 타워에서 디너', '3000', '100000', '★극강 로맨틱★', '★최고★', '우스퀴다르 선착장→보트', '필수', '★9주년 스페셜 옵션★ 보트 타고 감'],

    // 3/20 점심
    ['3/20', '점심', '1순위', 'Meze By Lemon Tree', '4.4', '터키퓨전', '메제 테이스팅 12종, 오징어튀김, 라크칵테일', '1500', '50000', '모던 세련', '◯', '베이욜루 도보10분', '추천', '전통 vs 현대 터키 비교체험'],

    // 3/20 저녁 ★피날레 디너★
    ['3/20', '★피날레 저녁★', '1순위', 'Mikla Restaurant', '4.5', '미슐랭 퓨전', '시그니처 코스요리. 터키-스칸디나비안. 보스포루스 루프탑', '5000', '160000', '★미슐랭 루프탑★', '★최고★', 'Marmara Pera 최상층', '필수', '★여행 피날레★ 최소 3일전 예약'],
    ['3/20', '★피날레 저녁★', '2순위', 'Nicole Restaurant', '4.6', '미슐랭 터키', '미슐랭 1스타. 모던 아나톨리안', '4000', '130000', '미슐랭 정통', '★최고★', '톰톰 카퍼스 호텔', '필수', '미슐랭 별 보유'],

    // 3/21 브런치
    ['3/21', '브런치', '1순위', 'Van Kahvaltı Evi', '4.4', '터키조식', '반(Van) 스타일 아침상 50종 메제. 2인 800TL', '800', '27000', '풍성한 조식', '-', '베이욜루', '추천', '주말 웨이팅 있음'],
  ];

  // 모든 행을 15컬럼으로 맞추고 maps_link 자동 생성
  for (let i = 1; i < data.length; i++) {
    // 배열 길이를 15로 맞추기
    while (data[i].length < 15) {
      data[i].push('');
    }
    // maps_link 자동 생성: 식당명 + 주소/위치 기반
    const name = data[i][3]; // 식당명
    const loc = data[i][11]; // 주소/위치
    if (name && loc) {
      data[i][14] = mapsLink(name + ' ' + loc);
    }
  }

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

  // 스타일
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#ea4335').setFontColor('#ffffff').setFontWeight('bold');

  // 기념일 행 하이라이트
  for (let i = 2; i <= data.length; i++) {
    if (data[i-1][1].includes('★')) {
      sheet.getRange(i, 1, 1, headers.length).setBackground('#fff9c4');
    }
  }

  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, 1, 50);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 60);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 50);
  sheet.setColumnWidth(6, 80);
  sheet.setColumnWidth(7, 350);
  sheet.setColumnWidth(8, 80);
  sheet.setColumnWidth(9, 80);
  sheet.setColumnWidth(10, 100);
  sheet.setColumnWidth(11, 80);
  sheet.setColumnWidth(12, 150);
  sheet.setColumnWidth(13, 60);
  sheet.setColumnWidth(14, 200);
  sheet.setColumnWidth(15, 200); // maps_link

  sheet.getRange(1, 1, data.length, headers.length).createFilter();

  Logger.log('✅ 식당가이드 시트 완료');
}

// ============================================================
// 시트 3: 입장료 & 티켓
// ============================================================
function createTicketSheet(ss) {
  let sheet = ss.getSheetByName('입장료·티켓');
  if (!sheet) sheet = ss.insertSheet('입장료·티켓');
  sheet.clear();

  const headers = ['도시', '관광지', '가격(현장)', '가격(KRW/인)', '2인합계(KRW)', '추천구매처', '온라인가격', '절약액', 'Skip-the-Line', '방문날짜', '비고'];

  const data = [
    headers,
    ['이스탄불', '아야 소피아 (Hagia Sophia)', '25 EUR', '43000', '86000', 'GetYourGuide 3종콤보', '콤보에 포함', '▼40%', '◯', '3/19', '⚠️여성 히잡 필수. 금요일 12~14:30 기도시간 폐쇄'],
    ['이스탄불', '톱카프 궁전+하렘 (Topkapı)', '2,750 TL', '92000', '184000', 'GetYourGuide 3종콤보', '콤보에 포함', '▼40%', '◯', '3/19', '오디오가이드 포함'],
    ['이스탄불', '바실리카 저수지 (Cistern)', '1,950 TL', '65000', '130000', 'GetYourGuide 3종콤보', '콤보에 포함', '▼40%', '◯', '3/20', '메두사 머리 기둥'],
    ['이스탄불', '갈라타 타워 (Galata)', '30 EUR', '51000', '102000', 'GetYourGuide 또는 현장', '35 EUR', '-', '◯', '3/20', '360도 전망대'],
    ['이스탄불', '이스탄불 모던 (Istanbul Modern)', '900 TL', '30000', '60000', '현장 (화요일 무료!)', '-', '-', '-', '3/20', '⚠️3/20은 금요일. 정가 구매'],
    ['이스탄불', '블루 모스크', '무료', '0', '0', '-', '-', '-', '-', '3/19', '활성 모스크. 복장규정 준수'],
    ['이스탄불', '그랜드 바자르', '무료', '0', '0', '-', '-', '-', '-', '3/19', '⚠️일요일 휴무! (3/19 목요일 OK)'],
    ['이스탄불', '피에르 로티 케이블카', '35 TL (이카드)', '1200', '2400', '이스탄불카드', '-', '-', '-', '3/19', '이스탄불카드로 태그'],
    ['카파도키아', '괴레메 오픈에어 뮤지엄', '20 EUR', '34000', '68000', 'GetYourGuide 또는 현장', '22 EUR', '-', '◯', '3/14', 'UNESCO. 다크교회 별도'],
    ['카파도키아', '괴레메 다크교회 (추가)', '6 EUR', '10000', '20000', '현장', '-', '-', '-', '3/14', '오픈에어 뮤지엄 내부'],
    ['카파도키아', '우치히사르 성', '250 TL', '8500', '17000', '현장', '-', '-', '-', '3/15', '최고높이 천연 성채'],
    ['카파도키아', '피죤밸리', '무료', '0', '0', '-', '-', '-', '-', '3/15', '자연 하이킹 코스'],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '=== 티켓 구매 전략 ===', '', '', '', '', '', '', '', '', ''],
    ['★추천★', 'GetYourGuide 3종 콤보 (아야소피아+톱카프+저수지)', '~59 EUR/인', '101000', '202000', 'GetYourGuide', '59 EUR/인', '▼18만원 절약', '◯', '', '3일간 유효. 무료취소 24시간전'],
    ['비추천', '뮤지엄패스 이스탄불', '105 EUR/인', '180000', '360000', 'muze.gen.tr', '-', '오히려 비쌈', '◯', '', '아야소피아/저수지 불포함이라 비효율'],
    ['비추천', 'Istanbul E-Pass', '195 EUR/인 (3일)', '334000', '668000', 'istanbulepass.com', '-', '매우 비쌈', '◯', '', '이 일정에는 과도함'],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '=== 총 입장료 예상 (2인) ===', '', '', '', '', '', '', '', '', ''],
    ['', 'GetYourGuide 3종 콤보', '', '', '202000', '', '', '', '', '', ''],
    ['', '갈라타 타워 (현장)', '', '', '102000', '', '', '', '', '', ''],
    ['', '이스탄불 모던', '', '', '60000', '', '', '', '', '', ''],
    ['', '괴레메 오픈에어+다크교회', '', '', '88000', '', '', '', '', '', ''],
    ['', '우치히사르 성', '', '', '17000', '', '', '', '', '', ''],
    ['', '피에르로티 케이블카', '', '', '2400', '', '', '', '', '', ''],
    ['', '미식투어 (이미 예약)', '', '', '88000', '', '', '', '', '', ''],
    ['합계', '', '', '', '559400', '', '', '', '', '', '현장 개별구매 대비 약 18만원 절약'],
  ];

  // 텍스트 포맷 강제 (=== 가 수식으로 인식되는 것 방지)
  sheet.getRange(1, 1, data.length, data[0].length).setNumberFormat('@');
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold');

  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 80);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 180);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 80);
  sheet.setColumnWidth(9, 60);
  sheet.setColumnWidth(10, 70);
  sheet.setColumnWidth(11, 250);

  Logger.log('✅ 입장료·티켓 시트 완료');
}

// ============================================================
// 시트 4: 실용 정보
// ============================================================
function createPracticalSheet(ss) {
  let sheet = ss.getSheetByName('실용정보');
  if (!sheet) sheet = ss.insertSheet('실용정보');
  sheet.clear();

  const data = [
    ['=== 💳 결제 & 환전 ===', '', ''],
    ['항목', '내용', '비고'],
    ['메인 결제', 'SOL트래블 (마스터카드) - 비접촉/컨택리스 결제', '해외 수수료 면제. TRY 미리 충전'],
    ['서브 카드', '토스뱅크 (마스터카드) - 백업용', ''],
    ['환전', '하나은행 200 EUR 환전 → ICN 제2터미널 픽업 (출국당일)', '도착 후 100EUR만 환전, 100EUR 비상용'],
    ['ATM 인출', 'Ziraat Bankası (지라트은행) 우선. 은행 지점 내부 ATM', '건당 3,000~4,000 TL 출금. DCC 거절 필수'],
    ['이스탄불 ATM', '탁심: İstiklal Cad. 입구 / 술탄아흐메트: Divanyolu Cad. / 에미뇌뉘: 갈라타다리 근처 / 베이욜루: Galatasaray 광장 / IST공항: 도착 로비', 'Ziraat > Garanti > VakıfBank 순서'],
    ['DCC 거절', '카드/ATM 모두 "TRY 결제" 선택! "원화 결제" 절대 금지', '3~7% 손해 방지'],
    ['현금 필요처', '그랜드 바자르, 길거리 음식(시미트,고등어케밥), 택시, 돌무쉬', ''],
    ['카드 안되는 곳', '소규모 상점, 노점, 시미트 카트, 돌무쉬', ''],
    ['환율', '1 TRY ≈ 34 KRW / 1 EUR ≈ 1,710 KRW (2026.03 기준)', '변동 있음'],
    ['', '', ''],
    ['=== 🚌 교통 ===', '', ''],
    ['이스탄불카드', 'IST공항 지하철역 자판기에서 구매. 카드 165TL + 충전', '1회 탑승 35TL. 관광객 환승할인 없음 (매번 35TL)'],
    ['이스탄불카드 사용', '트램, 버스, 메트로, 페리, 푸니쿨라 모두 사용', '2인 카드 1장으로 번갈아 태그 가능 (환승할인X)'],
    ['하바이스트(HAVAIST)', 'IST공항↔시내. 275TL/인. 전용차로 정시도착', 'hfrv.com.tr 시간표. 💳컨택리스 OK'],
    ['⚠️HVIST-11 중단', 'IST→술탄아흐메트 노선 2026.01부터 운행중단', '대체: HVL-1(Aksaray) + T1 트램'],
    ['M11 공항메트로', 'IST→Gayrettepe(30분)→M2 Vezneciler→T1트램. 123TL/인', '★가장 저렴★'],
    ['택시 앱', 'BiTaksi 앱 설치 (한국의 카카오택시)', '미터기 작동 확인 필수'],
    ['비상 택시팁', '미터기 안 켜면 "Taksimetre lütfen" (탁시메트레 뤼트펜)', ''],
    ['', '', ''],
    ['=== ⚠️ 라마단 (2/28~3/30) ===', '', ''],
    ['영향', '관광지/식당 정상 운영. 관광객에게 큰 영향 없음', ''],
    ['주의1', '오후 5~7시 택시 잡기 어려움 (이프타르 러시)', ''],
    ['주의2', '인기 식당 이프타르 시간 만석. 예약 필수', ''],
    ['매너', '모스크 근처에서 대놓고 음식 먹지 않기', '문화적 배려'],
    ['', '', ''],
    ['=== 🌡️ 날씨 (3월) ===', '', ''],
    ['이스탄불', '7~14°C. 비 가능성. 겹쳐입기', '우산/우비 필수'],
    ['카파도키아', '0~12°C. 새벽 2~5°C. 낮 햇볕 강함', '보온복+선크림 둘 다'],
    ['안탈리아', '10~18°C. 지중해 온화', '가장 따뜻한 지역'],
    ['', '', ''],
    ['=== 🏨 호텔 체크인/아웃 (아고다 기준) ===', '', ''],
    ['호텔', '체크인', '체크아웃'],
    ['Nippon Hotel', '3/12 14:00', '3/13'],
    ['Sarnich Cave Suites', '3/13 14:00', '3/15 ⚠️11:40 도착→짐 맡기고 점심'],
    ['Dumo Suite Hotel', '3/15', '3/16 12:00 ⚠️22:30 야간CI→사전연락'],
    ['Concorde De Luxe Resort', '3/16 15:00', '3/18 ⚠️12:00 도착→올인클 시설 먼저'],
    ['Hotel Sultania', '3/18', '3/20 12:00'],
    ['TomTom Suites', '3/20 15:00', '3/21 12:00 ⚠️12:30 도착→짐 맡기고 점심'],
    ['', '', ''],
    ['=== 🧳 준비물 체크리스트 ===', '', ''],
    ['--- 의류 ---', '', ''],
    ['양말', '6켤레 (여분 2개는 소금호수용)', '✅'],
    ['팬티', '6개', '✅'],
    ['내복', '1세트 (카파도키아 새벽 2~5°C)', '✅'],
    ['경량패딩조끼', '1개 (레이어드 필수)', '✅'],
    ['후드티', '그레이 1 + 베이지 2', '✅'],
    ['맨투맨', '1개', '✅'],
    ['레이어드티', '검정 3 + 흰색 3', '✅'],
    ['바람막이 점퍼', '1개 (이스탄불 바람 강함)', '✅'],
    ['운동화', '2켤레 (1켤레는 소금호수 후 교체용)', '✅'],
    ['수영복', '리조트 수영장 필수 (2벌 권장)', '⬜'],
    ['히잡/스카프', '아내용 - 모스크 방문 필수 (아야소피아/블루모스크)', '⬜'],
    ['슬리퍼', '호텔 실내 + 소금호수용', '⬜'],
    ['모자', '1개 (카파도키아 햇볕 강함)', '✅'],
    ['', '', ''],
    ['--- 세면/건강 ---', '', ''],
    ['세안제', '소분 용기', '✅'],
    ['면도기', '+ 여분 날', '✅'],
    ['칫솔 & 치약', '', '✅'],
    ['선크림 (CC크림)', 'SPF50+ (카파도키아 자외선 강함)', '✅'],
    ['로션', '소분', '✅'],
    ['바디로션 / 핸드크림', '소분', '✅'],
    ['립밤', '건조한 날씨', '✅'],
    ['인공눈물', '기내 + 건조한 터키 날씨', '✅'],
    ['소화제', '', '✅'],
    ['지사제', '음식 바뀌면 배탈 가능', '✅'],
    ['해열제', '', '✅'],
    ['몸살약 (종합감기약)', '', '✅'],
    ['밴드/상처치료', '소금호수 발 쓸림 대비', '⬜'],
    ['', '', ''],
    ['--- 전자기기 ---', '', ''],
    ['유럽형 어댑터', 'Type C/F (둥근 2핀). 2개 이상 권장', '⬜'],
    ['멀티탭', '+ 각종 충전 케이블 세트', '✅'],
    ['보조배터리', '20000mAh 이상 추천', '⬜'],
    ['시가잭 충전기', '렌트카 네비 충전용 + 각종 케이블', '✅'],
    ['핸드폰 거치대', '렌트카 네비게이션용', '✅'],
    ['카메라/삼각대', '로즈밸리 일출, 소금호수 촬영', '⬜'],
    ['eSIM', '준비 완료 ✅', '✅'],
    ['', '', ''],
    ['--- 기타 ---', '', ''],
    ['여권 + 사본', '사진 찍어 폰에 저장 + 클라우드 백업', '⬜'],
    ['여행자보험 서류', '가입 확인 + PDF 저장', '⬜'],
    ['오프라인 지도', 'Google Maps 터키 전체 다운로드 (특히 카파도키아~소금호수)', '⬜'],
    ['섬유탈취제', '소량 소분 (10일 여행, 세탁 어려움)', '✅'],
    ['여행용 세탁세제', '호텔 손빨래용 소분 (양말/속옷)', '⬜'],
    ['작은 동전지갑', 'TL 소액 동전/지폐 보관용', '✅'],
    ['지퍼백 (대형)', '소금호수 젖은 신발/양말 보관용', '⬜'],
    ['우산 or 우비', '이스탄불 3월 비 가능성', '⬜'],
    ['모스크 준비', '여성: 스카프+긴팔+긴바지 / 남성: 긴바지', '⬜'],
    ['소금호수 세트', '여분 양말 + 슬리퍼 + 지퍼백 + 수건', '⬜'],
    ['', '', ''],
    ['=== 💰 팁 문화 ===', '', ''],
    ['식당', '계산서의 10% (서비스료 포함이면 생략)', ''],
    ['택시', '거스름돈 반올림 (예: 485TL → 500TL)', ''],
    ['호텔', '베개팁 10~20 TL/일', ''],
    ['하맘', '때밀이+마사지사에게 각 20~50 TL', ''],
    ['', '', ''],
    ['=== 🗣️ 터키어 필수 표현 ===', '', ''],
    ['안녕하세요', 'Merhaba (메르하바)', '만능 인사'],
    ['감사합니다', 'Teşekkürler (테셰퀼레르)', ''],
    ['계산서 주세요', 'Hesap lütfen (헤삽 뤼트펜)', '식당 필수'],
    ['얼마예요?', 'Ne kadar? (네 카다르?)', '바자르 필수'],
    ['예/아니오', 'Evet (에벳) / Hayır (하이르)', ''],
    ['미터기 켜주세요', 'Taksimetre lütfen (탁시메트레 뤼트펜)', '택시 필수'],
    ['맵지 않게 해주세요', 'Acısız lütfen (아즈으즈 뤼트펜)', '식당'],
    ['맛있어요', 'Çok güzel! (촉 귀젤!)', '칭찬'],
    ['', '', ''],
    ['=== 📞 비상 연락처 ===', '', ''],
    ['경찰', '155', ''],
    ['앰뷸런스', '112', ''],
    ['한국대사관 (앙카라)', '+90-312-468-4823', ''],
    ['한국영사관 (이스탄불)', '+90-212-368-8368', ''],
    ['아시아나 이스탄불', '+90-212-465-5600', ''],
    ['여행자보험', '가입 확인 필수!', ''],
    ['', '', ''],
    ['=== 🛍️ 흥정 가이드 (그랜드 바자르) ===', '', ''],
    ['규칙1', '부르는 값의 40~60%에서 시작', ''],
    ['규칙2', '관심 없는 척 하면서 가격 물어보기', ''],
    ['규칙3', '"생각해볼게요" 하고 돌아서면 가격 내려감', ''],
    ['규칙4', '여러 가게 비교. 첫 가게에서 사지 않기', ''],
    ['규칙5', '현금 결제 시 추가 할인 가능', ''],
    ['', '', ''],
    ['=== 🛍️ 쇼핑 가이드 (바가지 방지) ===', '', ''],
    ['터키커피 250g', 'Kurukahveci Mehmet Efendi (에미뇌뉘 본점) 50-80TL', '관광지 150TL ← 바가지'],
    ['올리브비누 1개', '현지가 15-30TL', '관광지 50-100TL. ★Tahtakale 최저가★'],
    ['로쿰 1kg', 'Hafız Mustafa/Koska 200-450TL', '관광지 800TL. ★Koska 이스티클랄점 추천★'],
    ['차잔세트 6인', 'Tahtakale 150-300TL', '그랜드바자르 입구 300-600TL'],
    ['스파이스 100g', '스파이스바자르 밖 20-40TL', '안 50-100TL'],
    ['Nazar 부적', '어디서나 3-50TL', '바자르 밖이 저렴'],
    ['핵심 매장', 'Arasta Bazaar(블루모스크 옆, 도자기), Tahtakale(스파이스바자르 뒤, 도매가)', ''],
    ['⚠️Eid 휴무', '3/20-22 그랜드바자르+사하플라르 휴무!', '3/19까지 쇼핑 완료'],
    ['', '', ''],
    ['=== 📱 마이리얼트립 투어 ===', '', ''],
    ['미식투어', '44,910원/인. 카드쿄이+페리+석양. 4시간', '⭐4.9(907+리뷰)'],
    ['워킹투어', '45,000원/인. 한국어가이드. 7시간', '⭐4.9(1,070+리뷰). 9년연속 베스트셀러'],
    ['맞춤투어', '60,000원/인. 8시간. 4인 이상', ''],
    ['링크', 'myrealtrip.com → 이스탄불 검색', ''],
    ['', '', ''],
    ['=== 🌧️ 비 올 때 플랜 B ===', '', ''],
    ['실내 관광', '바실리카 저수지(지하), 톱카프 궁전, Istanbul Modern(갈라타포트)', ''],
    ['커버드 마켓', '그랜드바자르, 스파이스바자르, 아라스타바자르 (모두 실내)', ''],
    ['하맘', 'Çemberlitaş Hamamı (500년, 그랜드바자르 근처, ~68EUR)', ''],
    ['카페', 'Salt Galata(전시+카페), FiLBooks(포토북카페)', ''],
  ];

  // 텍스트 포맷 강제 (=== 가 수식으로 인식되는 것 방지)
  sheet.getRange(1, 1, data.length, 3).setNumberFormat('@');
  sheet.getRange(1, 1, data.length, 3).setValues(data);

  // 섹션 헤더 스타일
  for (let i = 1; i <= data.length; i++) {
    if (data[i-1][0].includes('===')) {
      sheet.getRange(i, 1, 1, 3).setBackground('#fbbc04').setFontWeight('bold').setFontSize(11);
    }
  }

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 400);
  sheet.setColumnWidth(3, 250);

  Logger.log('✅ 실용정보 시트 완료');
}

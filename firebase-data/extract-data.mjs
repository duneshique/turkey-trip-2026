#!/usr/bin/env node
/**
 * 🔥 extract-data.mjs
 * index.html의 JS 상수(SCHEDULE, RESTAURANTS, TICKETS, CHECKLIST, HOTELS, INFO)를
 * JSON 파일로 추출합니다.
 *
 * 실행: node firebase-data/extract-data.mjs
 * 출력: firebase-data/trip-data.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createContext, runInContext } from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, '..', 'index.html');
const OUT_PATH  = join(__dirname, 'trip-data.json');

// index.html 읽기
const html = readFileSync(HTML_PATH, 'utf-8');

// <script>...</script> 블록에서 JS 추출
const scriptMatch = html.match(/<script>([\s\S]+?)<\/script>/);
if (!scriptMatch) { console.error('❌ <script> 블록을 찾을 수 없습니다'); process.exit(1); }
const scriptContent = scriptMatch[1];

// 데이터 상수만 추출 (SCHEDULE ~ HOTELS 까지)
// 함수 정의 이전까지 잘라냄
const dataEnd = scriptContent.indexOf('// ============================================================\n// 렌더링');
if (dataEnd === -1) { console.error('❌ 렌더링 섹션 시작을 찾을 수 없습니다'); process.exit(1); }

const dataCode = scriptContent.substring(0, dataEnd);

// renderInfo() 안의 sections 배열도 추출
const infoMatch = scriptContent.match(/function renderInfo\(\)\s*\{[\s\S]*?const sections = (\[[\s\S]*?\]);/);

// VM 컨텍스트에서 실행하여 데이터 추출
// ⚠️ const/let은 VM context에 노출 안 됨 → var로 치환
const execCode = dataCode.replace(/\bconst\b/g, 'var').replace(/\blet\b/g, 'var');
const ctx = createContext({});
runInContext(execCode, ctx);

// INFO sections 추출
let infoSections = [];
if (infoMatch) {
  try {
    const infoCtx = createContext({});
    runInContext('const sections = ' + infoMatch[1] + ';\nvar __info = sections;', infoCtx);
    infoSections = infoCtx.__info;
  } catch (e) {
    console.warn('⚠️ INFO 추출 실패, 빈 배열로 처리:', e.message);
  }
}

// CITY_MAP 추출
const cityMapMatch = scriptContent.match(/const CITY_MAP = (\{[\s\S]*?\});/);
let cityMap = {};
if (cityMapMatch) {
  try {
    const cmCtx = createContext({});
    runInContext('var __cm = ' + cityMapMatch[1] + ';', cmCtx);
    cityMap = cmCtx.__cm;
  } catch (e) {
    console.warn('⚠️ CITY_MAP 추출 실패:', e.message);
  }
}

// JSON 구성
const tripData = {
  tripMeta: {
    name:       '터키 9주년 기념여행',
    startDate:  '2026-03-12',
    endDate:    '2026-03-21',
    arrivalDate:'2026-03-22',
    travelers:  2,
    occasion:   '9th Wedding Anniversary',
    cities:     ['서울', '이스탄불', '카파도키아', '안탈리아'],
    cityMap:    cityMap,
  },
  schedule:    ctx.SCHEDULE    || [],
  restaurants: ctx.RESTAURANTS || [],
  tickets:     ctx.TICKETS     || [],
  checklist:   ctx.CHECKLIST   || [],
  hotels:      ctx.HOTELS      || [],
  info:        infoSections,
};

// 통계
const stats = {
  schedule:    tripData.schedule.length,
  restaurants: tripData.restaurants.length,
  tickets:     tripData.tickets.length,
  checklist:   tripData.checklist.reduce((sum, cat) => sum + cat.items.length, 0),
  hotels:      tripData.hotels.length,
  info:        tripData.info.length,
};

writeFileSync(OUT_PATH, JSON.stringify(tripData, null, 2), 'utf-8');

console.log('✅ trip-data.json 생성 완료!');
console.log(`   📅 일정: ${stats.schedule}개 이벤트`);
console.log(`   🍽️ 맛집: ${stats.restaurants}개`);
console.log(`   🎫 티켓: ${stats.tickets}개`);
console.log(`   🧳 준비물: ${stats.checklist}개 항목`);
console.log(`   🏨 호텔: ${stats.hotels}개`);
console.log(`   ℹ️ 정보: ${stats.info}개 섹션`);
console.log(`   📁 파일: ${OUT_PATH}`);

#!/usr/bin/env node
/**
 * 🧠 generate-ai-context.mjs
 * trip-data.json → AI 컨텍스트 텍스트 생성
 * Gemini system prompt에 주입할 여행 요약문 (한국어)
 *
 * 실행: node firebase-data/generate-ai-context.mjs
 * 출력:
 *   - firebase-data/ai-context.txt (로컬 확인용)
 *   - Firestore aiContext/tripSummary 문서 업데이트 (--upload 플래그 시)
 *
 * Firestore 업로드: node firebase-data/generate-ai-context.mjs --upload
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, 'trip-data.json');
const OUT_PATH  = join(__dirname, 'ai-context.txt');

const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));

// ── 텍스트 생성 ──────────────────────

let text = '';

// 여행 개요
text += `# 터키 9주년 기념여행\n`;
text += `- 기간: 2026.03.12(목)~03.21(토), 10일간\n`;
text += `- 여행자: 부부 2인 (결혼 9주년 기념)\n`;
text += `- 아내: 플로리스트+소설가. 꽃, 책, 카페, 감성을 좋아함\n`;
text += `- 경로: 서울→이스탄불→카파도키아→안탈리아→이스탄불→서울\n`;
text += `- 호텔: ${data.hotels.map(h => h.name).join(', ')}\n\n`;

// 일별 일정
const dayGroups = {};
data.schedule.forEach(ev => {
  if (!dayGroups[ev.d]) dayGroups[ev.d] = [];
  dayGroups[ev.d].push(ev);
});

const cityMap = data.tripMeta.cityMap || {};
Object.keys(dayGroups).sort().forEach(date => {
  const events = dayGroups[date];
  const dt = new Date(date + 'T00:00:00');
  const day = ['일','월','화','수','목','금','토'][dt.getDay()];
  const city = cityMap[date] || '';
  text += `## ${date} (${day}) ${city}\n`;

  events.forEach(ev => {
    const time = ev.s === ev.e ? ev.s : `${ev.s}~${ev.e}`;
    const cost = ev.cost ? ` [${ev.cost.toLocaleString()}원${ev.costTry ? '/' + ev.costTry : ''}]` : '';
    text += `- ${time} ${ev.t} @ ${ev.loc}${cost}\n`;
    if (ev.desc) {
      // 줄바꿈 제거하고 한 줄로
      const shortDesc = ev.desc.replace(/\n/g, ' ').substring(0, 120);
      text += `  → ${shortDesc}\n`;
    }
    // alt 옵션
    if (ev.alt && ev.alt.length) {
      ev.alt.forEach(a => {
        const aCost = a.cost ? ` [${a.cost.toLocaleString()}원]` : '';
        text += `  💡 대안: ${a.t} @ ${a.loc}${aCost}\n`;
      });
    }
  });
  text += '\n';
});

// 맛집 요약
text += `## 맛집 (${data.restaurants.length}곳)\n`;
data.restaurants.forEach(r => {
  text += `- [${r.date}/${r.meal}] ${r.name} ⭐${r.rating} (${r.genre}) ${r.price} @ ${r.loc}`;
  if (r.anniv) text += ' ★기념일★';
  if (r.note) text += ` — ${r.note}`;
  text += '\n';
});
text += '\n';

// 호텔
text += `## 호텔\n`;
data.hotels.forEach(h => {
  text += `- ${h.name}: CI ${h.ci}, CO ${h.co}${h.warn ? ' ⚠️' + h.warn : ''}\n`;
});
text += '\n';

// 핵심 정보 (간략화)
text += `## 실용 정보 요약\n`;
data.info.forEach(sec => {
  text += `### ${sec.title}\n`;
  sec.items.forEach(([k, v]) => {
    text += `- ${k}: ${v.substring(0, 80)}\n`;
  });
});

// 비용 총계
const totalKRW = data.schedule.reduce((sum, ev) => sum + (ev.cost || 0), 0);
text += `\n## 예산 요약\n`;
text += `- 일정 내 총 비용(이벤트): 약 ${totalKRW.toLocaleString()}원\n`;
text += `- 호텔, 항공, 투어, 식비, 교통 포함\n`;

writeFileSync(OUT_PATH, text, 'utf-8');

const byteSize = Buffer.byteLength(text, 'utf-8');
console.log(`✅ ai-context.txt 생성 완료!`);
console.log(`   📝 ${text.split('\n').length}줄, ${byteSize.toLocaleString()} bytes (${(byteSize/1024).toFixed(1)} KB)`);
console.log(`   📁 ${OUT_PATH}`);

// --upload 플래그 시 Firestore에 업로드
if (process.argv.includes('--upload')) {
  console.log('\n🔥 Firestore 업로드 중...');
  try {
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const sa = JSON.parse(readFileSync(join(__dirname, 'service-account.json'), 'utf-8'));
    const app = initializeApp({ credential: cert(sa) });
    const db  = getFirestore(app);

    await db.collection('aiContext').doc('tripSummary').set({
      text: text,
      generatedAt: new Date().toISOString(),
      byteSize: byteSize,
      lineCount: text.split('\n').length,
    });
    console.log('✅ aiContext/tripSummary Firestore 업데이트 완료!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Firestore 업로드 실패:', err.message);
    console.error('   service-account.json 파일이 있는지 확인하세요.');
    process.exit(1);
  }
} else {
  console.log('\n💡 Firestore에 업로드하려면: node firebase-data/generate-ai-context.mjs --upload');
}

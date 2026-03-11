#!/usr/bin/env node
/**
 * 🔥 upload-to-firestore.mjs
 * trip-data.json → Firestore (planning-with-ai-33b9f) 업로드
 *
 * 사전 준비:
 *   1. npm install firebase-admin  (이 디렉토리에서)
 *   2. Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → JSON 다운로드
 *   3. 다운로드한 파일을 이 디렉토리에 service-account.json 으로 저장
 *
 * 실행: node firebase-data/upload-to-firestore.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 설정 ──────────────────────────────
const SA_PATH   = join(__dirname, 'service-account.json');
const DATA_PATH = join(__dirname, 'trip-data.json');

// ── Firebase 초기화 ──────────────────
let sa;
try {
  sa = JSON.parse(readFileSync(SA_PATH, 'utf-8'));
} catch {
  console.error('❌ service-account.json 파일을 찾을 수 없습니다!');
  console.error('   Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성');
  console.error(`   다운로드 후 ${SA_PATH} 에 저장하세요.`);
  process.exit(1);
}

const app = initializeApp({ credential: cert(sa) });
const db  = getFirestore(app);

// ── 데이터 로드 ──────────────────────
const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));

// ── 배치 업로드 (500개 단위 분할) ────
async function batchUpload(collectionName, docs, idFn) {
  const chunks = [];
  for (let i = 0; i < docs.length; i += 450) {
    chunks.push(docs.slice(i, i + 450));
  }

  let total = 0;
  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((doc, i) => {
      const id = idFn(doc, total + i);
      batch.set(db.collection(collectionName).doc(id), doc);
    });
    await batch.commit();
    total += chunk.length;
  }
  return total;
}

async function main() {
  console.log('🔥 Firestore 업로드 시작...\n');

  // 1. tripMeta (단일 문서)
  await db.collection('tripMeta').doc('config').set(data.tripMeta);
  console.log('✅ tripMeta/config 저장');

  // 2. schedule
  const scheduleCount = await batchUpload('schedule', data.schedule, (ev, i) => `ev_${ev.d}_${i}`);
  console.log(`✅ schedule: ${scheduleCount}개 문서`);

  // 3. restaurants
  const restCount = await batchUpload('restaurants', data.restaurants, (r, i) => `rest_${i}`);
  console.log(`✅ restaurants: ${restCount}개 문서`);

  // 4. tickets
  const ticketCount = await batchUpload('tickets', data.tickets, (t, i) => `ticket_${i}`);
  console.log(`✅ tickets: ${ticketCount}개 문서`);

  // 5. hotels
  const hotelCount = await batchUpload('hotels', data.hotels, (h, i) => `hotel_${i}`);
  console.log(`✅ hotels: ${hotelCount}개 문서`);

  // 6. checklist (flat)
  const flatItems = [];
  data.checklist.forEach(cat => {
    cat.items.forEach(item => {
      flatItems.push({ category: cat.cat, name: item.n, checked: item.c });
    });
  });
  const checkCount = await batchUpload('checklist', flatItems, (_, i) => `item_${i}`);
  console.log(`✅ checklist: ${checkCount}개 문서`);

  // 7. travelInfo (섹션별 1문서)
  // ⚠️ Firestore 중첩 배열 불허 → [key,value] 배열을 {key, value} 객체로 변환
  for (const sec of data.info) {
    const slug = sec.title.replace(/[^\w가-힣]/g, '').substring(0, 20);
    const itemsAsObjects = sec.items.map(item =>
      Array.isArray(item) ? { key: item[0], value: item[1] } : item
    );
    await db.collection('travelInfo').doc(slug).set({
      title: sec.title,
      items: itemsAsObjects,
    });
  }
  console.log(`✅ travelInfo: ${data.info.length}개 섹션`);

  // 8. userState 초기화 (빈 문서)
  await db.collection('userState').doc('default').set({
    missions: {},
    memos: {},
    lastSaved: new Date().toISOString(),
  });
  console.log('✅ userState/default 초기화');

  // 9. aiContext (generate-ai-context.mjs 가 별도 생성 — 여기선 placeholder)
  await db.collection('aiContext').doc('tripSummary').set({
    text: '(run generate-ai-context.mjs to populate)',
    generatedAt: new Date().toISOString(),
  });
  console.log('✅ aiContext/tripSummary placeholder 생성');

  console.log('\n🎉 Firestore 업로드 완료!');
  console.log('   Firebase Console → Firestore Database 에서 확인하세요.');
  console.log('   다음: node firebase-data/generate-ai-context.mjs 실행');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 업로드 실패:', err.message);
  process.exit(1);
});

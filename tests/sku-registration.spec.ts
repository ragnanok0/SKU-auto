import { test, expect } from './fixtures/baseFixtures'; 
import testData from './data/test-data.json';
import { LogisticsPage } from './pages/SKU/LogisticsPage';
import { SkuRegisterPopup } from './pages/SKU/SkuRegisterPopup';
import dotenv from 'dotenv';

dotenv.config();
type StorageType = '냉장' | '냉동' | '상온';

const skuType = (process.env.skuType as StorageType) ?? '상온';
const inboundQty = process.env.inboundQty ?? '0';

test('SKU 신규 등록 및 입고요청 수량 입력 통합 테스트', async ({ loginPage, logisticsPage }) => {
  console.log('==========================================');
  console.log('[테스트 시작] SKU 등록 및 입고요청');
  console.log(`- 보관 유형: ${skuType}`);
  console.log(`- 입고 수량: ${inboundQty}`);
  console.log('==========================================');

  // 1. 로그인
  await loginPage.login();

  // 2. SKU 등록
  await logisticsPage.registerNewSku(skuType);
  
  // 3. 입고요청 페이지 이동
  await logisticsPage.goToInboundRequest();

  // 4. 날짜 선택 → 검색 → 수량 입력 → 제출
  await logisticsPage.searchAndInputQuantity(inboundQty);
});

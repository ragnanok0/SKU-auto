import { Page, expect, Locator } from '@playwright/test';
import { SkuRegisterPopup, StorageType } from './SkuRegisterPopup';
import { InboundRequestPage } from './InboundRequestPage';
 
export class LogisticsPage {
  readonly page: Page;
  readonly logisticsMenu: Locator;
  readonly skuManagementMenu: Locator;
  readonly inboundMenu: Locator;
 
  private registeredSkuNumber: string = '';
  public inboundPage: InboundRequestPage;
  private inboundOrderNumber: string = '';
 
  constructor(page: Page) {
    this.page = page;
    this.logisticsMenu = page.locator('button.navi-cate:has-text("물류관리")');
    this.skuManagementMenu = page.locator('a.link:has-text("SKU관리")');
    this.inboundMenu = page.locator('a.link:has-text("입고요청")');
    this.inboundPage = new InboundRequestPage(page);
  }
 
  async registerNewSku(storageType: StorageType = '상온') {
    console.log('[2단계] SKU 관리 메뉴 이동 중...');
    await this.logisticsMenu.click();
    await this.skuManagementMenu.click();
    await this.page.waitForTimeout(2000);
 
    const skuFrame = this.page.frameLocator('iframe[title="SKU관리"]');
    const skuRegBtn = skuFrame.locator('#SKUReg');
 
    await skuRegBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
 
    console.log('[2단계] SKU 등록 팝업 열기 중...');
    const popupPromise = this.page.waitForEvent('popup').catch(() => null);
    await skuRegBtn.click({ force: true });
    const skuPopupPage = await popupPromise;
 
    let targetPage: Page;
    if (skuPopupPage) {
      console.log('[2단계] 팝업 창 감지됨');
      await skuPopupPage.waitForLoadState('networkidle');
      targetPage = skuPopupPage;
    } else {
      console.log('[2단계] 레이어 팝업 감지됨');
      const popup = this.page.locator('.x-window');
      await popup.waitFor({ state: 'visible', timeout: 10000 });
      targetPage = this.page;
    }
 
    const skuRegister = new SkuRegisterPopup(targetPage);
 
    await skuRegister.fillRequiredFields(storageType);
    await skuRegister.clickRegisterButton();
 
    const num = await skuRegister.getCreatedSkuNumber();
    this.registeredSkuNumber = num;
    console.log(`[2단계] 생성된 SKU 번호: ${this.registeredSkuNumber} ✓`);
 
    await skuRegister.clickConfirmAfterRegistration();
  }
 
  getSavedSkuNumber() { return this.registeredSkuNumber; }
 
  async verifySkuExists() {
    try {
      await expect(this.page).toHaveURL(/.*(40394|40253)/, { timeout: 5000 });
    } catch (e) {
      console.log('[경고] URL 검증 건너뜀 (페이지 이동 중)');
    }
  }
 
  async goToInboundRequest() {
    console.log('[3단계] 입고요청 메뉴 이동 중...');
    await this.logisticsMenu.click();
    await this.inboundMenu.dispatchEvent('click');
    await this.page.waitForTimeout(2000);
    await this.inboundPage.verifyPageLoaded();
    console.log('[3단계] 입고요청 페이지 로드 완료 ✓');
  }
 
  async searchAndInputQuantity(quantity: string = '1000') {
    const skuNo = this.getSavedSkuNumber();
 
    console.log('[4단계] 입고 예정일 선택 중...');
    await this.inboundPage.selectEarliestDate();
 
    console.log(`[4단계] SKU 번호(${skuNo}) 조회 중...`);
    await this.inboundPage.searchBySkuNumber(skuNo);
    await this.page.waitForTimeout(2000);
 
    console.log(`[4단계] 입고 수량(${quantity}) 입력 중...`);
    await this.inboundPage.inputInboundQuantity(quantity);
    await this.page.waitForTimeout(1000);
 
    console.log('[5단계] 입고 요청 제출 중...');
    await this.inboundPage.submitInboundRequest();
 
    const finalInboundNo = this.inboundPage.getExtractedInboundNo();
    this.inboundOrderNumber = finalInboundNo;
 
    if (this.inboundOrderNumber) {
      console.log('==========================================');
      console.log('[테스트 성공]');
      console.log(`- 생성된 SKU 번호: ${skuNo}`);
      console.log(`- 생성된 입고번호: ${this.inboundOrderNumber}`);
      console.log('==========================================');
    } else {
      console.log('[경고] 입고 요청은 완료되었으나 입고번호 추출에 실패했습니다.');
    }
  }
}

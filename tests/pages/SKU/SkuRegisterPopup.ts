import { Page, Dialog } from '@playwright/test';
 
export type StorageType = '상온' | '냉장' | '냉동';
export class SkuRegisterPopup {
  readonly page: Page;
 
  constructor(page: Page) {
    this.page = page;
  }
 
  async fillRequiredFields(storageType: StorageType = '상온') {
    console.log('[2단계] SKU 정보 입력 중...');
 
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const skuName = `SKU_${dateStr}_${randomSuffix}`;
    const barcode = `${dateStr}${randomSuffix}`;
 
    await this.page.locator('#stckNm').fill(skuName);
    await this.page.locator('#skuBarcdNo0').fill(barcode);
    await this.page.locator('#dstPrdClfCd01').evaluate(node => (node as HTMLInputElement).click());
 
    await this.page.locator('#wdthLen').fill('1');
    await this.page.locator('#hghtLen').fill('2');
    await this.page.locator('#vrtclLen').fill('3');
    await this.page.locator('#stckWght').fill('4');
    await this.page.locator('#skuWdthLen2').fill('10');
    await this.page.locator('#skuHghtLen2').fill('20');
    await this.page.locator('#skuVrtclLen2').fill('30');
    await this.page.locator('#skuWght2').fill('40');
    await this.page.locator('#boxUntgdsCunt').fill('1');
 
    await this.page.locator(`label:has-text("${storageType}")`).click();
    await this.page.locator('#skuOnepackY').evaluate(node => (node as HTMLInputElement).click());
    await this.page.locator('#boxPackNessY').evaluate(node => (node as HTMLInputElement).click());
    await this.page.locator('#sflifeMngN').evaluate(node => (node as HTMLInputElement).click());
    await this.page.locator('#rtlClmAutoAprvY').evaluate(node => (node as HTMLInputElement).click());
    await this.page.locator('#rtngdTwY').evaluate(node => (node as HTMLInputElement).click());
    await this.page.locator('#elpdIstCnfrmY').evaluate(node => (node as HTMLInputElement).click());
 
    console.log(`[2단계] SKU 정보 입력 완료 ✓ (보관유형: ${storageType})`);
    return skuName;
  }
 
  async clickRegisterButton() {
    console.log('[2단계] SKU 등록 요청 중...');
    const registerBtn = this.page.locator('#btnReg');
 
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
 
    await registerBtn.waitFor({ state: 'visible' });
    await registerBtn.evaluate(node => (node as HTMLElement).click());
 
    await this.page.waitForTimeout(3000);
    console.log('[2단계] SKU 등록 완료 ✓');
  }
 
  async getCreatedSkuNumber(): Promise<string> {
    const skuTextLocator = this.page.locator('sub.sub_text').filter({ hasText: /SKU 번호/ });
    await skuTextLocator.waitFor({ state: 'attached', timeout: 10000 });
 
    let skuNumber = '';
    for (let i = 0; i < 5; i++) {
      const textContent = await skuTextLocator.textContent() || '';
      skuNumber = textContent.replace(/[^0-9]/g, '');
      if (skuNumber && skuNumber.length > 5) break;
      await this.page.waitForTimeout(1000);
    }
    return skuNumber;
  }
 
  async clickConfirmAfterRegistration() {
    const confirmBtn = this.page.locator('button[onclick*="completeSKUReg"]');
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
  }
}

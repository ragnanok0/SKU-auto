import { Page, expect } from '@playwright/test';
 
export class InboundRequestPage {
  readonly page: Page;
  private extractedInboundNo: string = '';
 
  constructor(page: Page) {
    this.page = page;
  }
 
  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/.*40253/, { timeout: 10000 });
  }
 
  async selectEarliestDate() {
    const frame = this.page.frameLocator('iframe[title="입고요청"]');
 
    await frame.locator('#saveIncmPlnDt').click();
    const datepicker = frame.locator('#ui-datepicker-div');
    await datepicker.waitFor({ state: 'visible' });
    await datepicker.locator('td:not(.ui-state-disabled) a').first().click();
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(1000);
  }
 
  async searchBySkuNumber(skuNumber: string) {
    const frame = this.page.frameLocator('iframe[title="입고요청"]');
    const searchInput = frame.locator('#searchVal');
    const searchBtn = frame.locator('#searchBtn');
 
    await searchInput.fill(skuNumber);
    await searchBtn.click();
 
    const resultText = frame.locator('text=/검색결과 : 1건/');
    await resultText.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`[4단계] SKU 조회 완료 ✓ (검색결과: 1건)`);
 
    await this.page.waitForTimeout(2000);
  }
 
  async inputInboundQuantity(quantity: string) {
    const frame = this.page.frameLocator('iframe[title="입고요청"]');
 
    const quantityCell = frame.locator('div[role="gridcell"].cellColor[style*="left: 1080px"]').first();
    await quantityCell.waitFor({ state: 'visible' });
 
    await quantityCell.evaluate(node => {
      node.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    });
    await this.page.waitForTimeout(1000);
 
    await quantityCell.evaluate((node) => {
      const gridId = "jqxgrid";
      const $grid = (window as any).$(`#${gridId}`);
      if ($grid && $grid.jqxGrid) {
        const rowIndex = 0;
        const dataField = "incmPlnQty";
        $grid.jqxGrid('begincelledit', rowIndex, dataField);
      } else {
        node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });
 
    const gridInput = frame.locator('#textboxeditorjqxgridincmPlnQty');
 
    try {
      await gridInput.waitFor({ state: 'visible', timeout: 3000 });
      await gridInput.focus();
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.press('Backspace');
      await gridInput.pressSequentially(quantity, { delay: 50 });
      await this.page.keyboard.press('Enter');
      console.log(`[4단계] 수량 입력 완료 ✓ (${quantity})`);
    } catch (e) {
      console.log('[4단계] 입력창 미발견, 직접 타이핑으로 재시도 중...');
      await quantityCell.click({ force: true });
      await this.page.waitForTimeout(500);
      await this.page.keyboard.type(quantity, { delay: 50 });
      await this.page.keyboard.press('Enter');
    }
 
    await this.page.waitForTimeout(1000);
  }
 
  async submitInboundRequest() {
    const frame = this.page.frameLocator('iframe[title="입고요청"]');
    const saveBtn = frame.locator('#saveBtn');
 
    this.page.on('dialog', async dialog => {
      const message = dialog.message();
 
      if (dialog.type() === 'confirm' && message.includes('입고')) {
        console.log('[5단계] 입고 요청 확인창 승인 중...');
        await dialog.accept();
      } else if (dialog.type() === 'alert' && message.includes('정상')) {
        const match = message.match(/입고번호:\s*(\d+)/);
        if (match && match[1]) {
          this.extractedInboundNo = match[1];
          console.log(`[5단계] 입고번호 추출 완료 ✓ (${this.extractedInboundNo})`);
        }
        await dialog.accept();
      } else {
        await dialog.accept();
      }
    });
 
    await saveBtn.scrollIntoViewIfNeeded();
    try {
      await saveBtn.click({ force: true, timeout: 5000 });
    } catch (e) {
      console.log('[5단계] 일반 클릭 실패, 강제 클릭으로 재시도 중...');
      await saveBtn.evaluate(node => (node as HTMLElement).click());
    }
 
    await this.page.waitForTimeout(3000);
  }
 
  getExtractedInboundNo() {
    return this.extractedInboundNo;
  }
 
  async getInboundOrderNumber(): Promise<string> {
    const frame = this.page.frameLocator('iframe[title="입고요청"]');
    const orderNumberLink = frame.locator('a[onclick*="fnModifyOrdr"]').first();
    const searchBtn = frame.locator('#searchBtn');
 
    for (let i = 0; i < 3; i++) {
      try {
        await orderNumberLink.waitFor({ state: 'visible', timeout: 7000 });
        if (await orderNumberLink.isVisible()) break;
      } catch (e) {
        console.log(`[재시도 ${i + 1}/3] 입고번호 미확인, 재조회 중...`);
        await searchBtn.click();
        await this.page.waitForTimeout(2000);
      }
    }
 
    const orderNo = await orderNumberLink.innerText();
    const trimmedNo = orderNo.trim();
    return trimmedNo;
  }
}

import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const languages=['en','ja','ko','fr','de','es','zh-CN','zh-TW'];
for(const language of languages){
 test(`host language ${language} translates menus and new dialogs without changing artwork`,async({page},testInfo)=>{
  const {messages}=JSON.parse(await readFile(path.join(process.cwd(),'locales',language+'.json'),'utf8'));
  await page.addInitScript(code=>localStorage.setItem('private-image-lab-language',code),language);
  const appUrl=testInfo.project.metadata?.appUrl||pathToFileURL(path.join(process.cwd(),'index.html')).href;
  await page.goto(appUrl);
  await expect(page.locator('html')).toHaveAttribute('data-os-boot','ready');
  await expect(page.locator('html')).toHaveAttribute('data-os-language',language);
  await expect(page.locator('#ptg1-tab-layers')).toHaveText(messages.Layers);
  await page.getByRole('menuitem',{name:messages.File,exact:true}).click();
  await page.getByRole('menuitem',{name:messages.New,exact:true}).click();
  await expect(page.locator('.modal-overlay.show h3')).toHaveText(messages['New Image']);
  await page.getByRole('button',{name:messages.Cancel,exact:true}).click();
  await page.evaluate(()=>{
   OS.layers[OS.activeLayerIdx].name='File';
   OS.updateLayersPanel();
   const text=new fabric.Textbox('Width',{left:20,top:20});
   OS.canvas.add(text);OS.layers[OS.activeLayerIdx].objects.push(text);
   OS._applyInterfaceTranslations();
  });
  expect(await page.evaluate(()=>OS.canvas.getObjects().find(o=>o.text==='Width')?.text)).toBe('Width');
  await expect(page.locator('.layer-name').filter({hasText:/^File$/})).toHaveText('File');
  await expect(page.getByRole('link',{name:messages['Back to home'],exact:true})).toBeVisible();
  await page.getByRole('button',{name:messages['Marquee: Rectangular Marquee Tool'],exact:true}).click();
  await expect(page.locator('.audit-tool-flyout.show')).toContainText(messages['Rectangular Marquee Tool']);
  const width=await page.locator('.audit-tool-flyout.show').evaluate(el=>el.getBoundingClientRect().width);
  expect(width).toBeGreaterThanOrEqual(230);
 });
}

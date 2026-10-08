import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadOpenShop } from './os-harness.js';
let OS;
beforeEach(() => {
 document.body.innerHTML='<button id="file">File</button><label id="label">Width</label><select id="blend"><option>Multiply</option></select><input id="artwork" value="File"><span class="layer-name">File</span><div id="canvas-area"><span>File</span></div><a class="editor-home-link" aria-label="Back to home">Back to home</a>';
 localStorage.clear();
 OS=loadOpenShop();
 OS._syncTextDirectionControl=vi.fn();
 OS._observeInterfaceTranslations();
});
afterEach(() => {OS._i18nObserver?.disconnect(); window.removeEventListener('storage',OS._i18nStorageListener);});
test('all eight catalogs have the same keys and match the bundled offline dictionaries', () => {
 const languages=JSON.parse(readFileSync('locales/languages.json','utf8')).languages;
 const keys=Object.keys(OS._locales.en).sort();
 expect(languages.map(x=>x.code)).toEqual(['en','ja','ko','fr','de','es','zh-CN','zh-TW']);
 for(const {code,file} of languages){
  const catalog=JSON.parse(readFileSync('locales/'+file,'utf8'));
  expect(Object.keys(catalog.messages).sort()).toEqual(keys);
  expect(OS._locales[code]).toEqual(catalog.messages);
 }
});
test('switching locales translates UI without changing option values, names or artwork', () => {
 for(const code of ['zh-CN','zh-TW','ja','ko','fr','de','es','en']){
  OS.setLocale(code);
  expect(document.querySelector('#file').textContent).toBe(OS._locales[code].File);
  expect(document.querySelector('#label').textContent).toBe(OS._locales[code].Width);
  expect(document.querySelector('#blend').value).toBe('Multiply');
  expect(document.querySelector('#artwork').value).toBe('File');
  expect(document.querySelector('.layer-name').textContent).toBe('File');
  expect(document.querySelector('#canvas-area').textContent).toBe('File');
  expect(document.querySelector('.editor-home-link').textContent).toBe(OS._locales[code]['Back to home']);
  expect(document.querySelector('.editor-home-link').getAttribute('aria-label')).toBe(OS._locales[code]['Back to home']);
  expect(localStorage.getItem('private-image-lab-language')).toBe(code);
 }
});
test('new dialogs, tool labels and accessible names follow the selected locale', async () => {
 OS.setLocale('ja');
 const modal=document.createElement('div');modal.innerHTML='<h3>New Image</h3><button title="New Layer">Cancel</button><button aria-label="Marquee: Rectangular Marquee Tool">Width</button>';
 document.body.append(modal);
 await new Promise(resolve=>setTimeout(resolve,0));
 expect(modal.querySelector('h3').textContent).toBe('新規画像');
 expect(modal.querySelector('button').textContent).toBe('キャンセル');
 expect(modal.querySelector('button').title).toBe('新規レイヤー');
 expect(modal.querySelector('[aria-label]').getAttribute('aria-label')).toBe(OS._locales.ja['Marquee: Rectangular Marquee Tool']);
});
test('host language updates from another tab apply immediately', () => {
 window.dispatchEvent(new StorageEvent('storage',{key:'private-image-lab-language',newValue:'de'}));
 expect(OS._lang).toBe('de');
 expect(document.querySelector('#file').textContent).toBe('Datei');
});

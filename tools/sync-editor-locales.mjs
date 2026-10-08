import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const languages=JSON.parse(await readFile(join(root,'locales/languages.json'),'utf8')).languages;
const dictionaries={};
let englishKeys;
for(const {code,file} of languages){
 const catalog=JSON.parse(await readFile(join(root,'locales',file),'utf8'));
 if(catalog.language!==code)throw Error('Catalog language mismatch: '+code);
 const keys=Object.keys(catalog.messages).sort();
 if(!englishKeys)englishKeys=keys;
 if(JSON.stringify(keys)!==JSON.stringify(englishKeys)||Object.values(catalog.messages).some(value=>typeof value!=='string'||!value.trim()))throw Error('Incomplete catalog: '+code);
 dictionaries[code]=catalog.messages;
}
dictionaries.zh=dictionaries['zh-CN']; // Legacy imported settings remain supported.
const encode=value=>JSON.stringify(value).replaceAll('<','\\u003c');
let html=await readFile(join(root,'index.html'),'utf8');
const before=html;
html=html.replace(/\/\* BEGIN EDITOR LOCALES \*\/[\s\S]*?\/\* END EDITOR LOCALES \*\//,'/* BEGIN EDITOR LOCALES */'+encode(dictionaries)+'/* END EDITOR LOCALES */');
html=html.replace(/\/\* BEGIN EDITOR LANGUAGES \*\/[\s\S]*?\/\* END EDITOR LANGUAGES \*\//,'/* BEGIN EDITOR LANGUAGES */'+encode(languages.map(({code,name})=>({code,name})))+'/* END EDITOR LANGUAGES */');
if(!html.includes('/* BEGIN EDITOR LOCALES */'))throw Error('Missing inline catalog slot');
if(process.argv.includes('--check')){
 if(html!==before)throw Error('Inline catalogs are stale; run node tools/sync-editor-locales.mjs and npm run security:write');
}else await writeFile(join(root,'index.html'),html);
console.log(`Validated ${languages.length} editor languages with ${englishKeys.length} messages each.`);

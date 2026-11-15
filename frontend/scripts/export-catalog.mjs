import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
const result=await build({entryPoints:['src/data.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {products}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
await writeFile('../backend/catalog.json',JSON.stringify(products,null,2)+'\n');
console.log(`Exported ${products.length} products.`);

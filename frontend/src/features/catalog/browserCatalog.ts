import {readLocal,writeLocal} from '../../api';
import {products,legacyProductImages,legacyProductDefaults,type Product} from '../../data';
import {mergeNewModels,refreshDemoPhotos} from './media';
export function loadBrowserCatalog():Product[]{const existing=readLocal<Product[]|null>('catalog',null),known=readLocal<string[]>('catalog-known-models',Object.keys(legacyProductImages));const next=existing?mergeNewModels(refreshDemoPhotos(existing,products,legacyProductImages,legacyProductDefaults),products,known):products;writeLocal('catalog-known-models',products.map(p=>p.id));writeLocal('catalog',next);return next;}

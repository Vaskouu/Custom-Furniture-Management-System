import {Product,imageUrl} from '../../data';
import {atlasTile} from './media';
import {useDecorations} from './Decorations';


export default function ProductImage({product,source,label,decorations}:{product?:Product;source?:string;label?:string;decorations?:boolean}){
 const shared=useDecorations(),styled=decorations??shared.decorations;
 const src=source||(!styled&&product?.cleanImage?product.cleanImage:product?.image)||'',tile=atlasTile(src);
 const alt=label||(product?`${product.name} — ${product.category}, студийна визуализация, ${styled?'с декорации':'без декорации'}`:'Преглед на изображението');
 if(!tile)return <img className="product-model-image" src={imageUrl(src,1000)} alt={alt} loading="lazy"/>;
 return <svg className="product-model-image atlas-product-image" role="img" aria-label={alt} data-product-id={product?.id} data-photo-cell={tile.cell} data-decorations={styled} viewBox={`${tile.column*100+1} ${tile.row*100+1} 98 98`} preserveAspectRatio="xMidYMid slice"><image href={tile.source} width={tile.columns*100} height={tile.rows*100}/></svg>;
}

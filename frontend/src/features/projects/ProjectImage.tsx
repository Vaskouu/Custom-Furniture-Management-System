export default function ProjectImage({cell,label}:{cell:number;label:string}){
 const column=cell%2,row=Math.floor(cell/2);
 return <svg className="project-scene-image" role="img" aria-label={label} data-project-scene={cell} viewBox={`${column*150+1} ${row*100+1} 148 98`} preserveAspectRatio="xMidYMid slice"><image href="/assets/projects/project-stories.png" width="300" height="200"/></svg>;
}

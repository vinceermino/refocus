import { themeAssets } from '@/lib/theme-assets'

// Runs in the document head, before hydration or the first application paint.
export function PreferenceBootstrap() {
  const source = `(function(a){
    var r=document.documentElement,s=null,m=null;try{s=localStorage.getItem('accent-theme');m=localStorage.getItem('refocus-minimal-mode')}catch(e){}
    var v=s==='pink'?'she':'he';r.dataset.accent=v==='she'?'pink':'dark';r.dataset.minimal=String(m==='true');
    var manifest=document.getElementById('app-manifest'),icon=document.getElementById('apple-touch-icon');
    if(manifest)manifest.href='/manifest-'+v+'.webmanifest';if(icon)icon.href='/icons/'+v+'/180.png';
    var f=document.createElement('link');f.rel='preload';f.as='font';f.type='font/woff2';f.crossOrigin='anonymous';f.href=a[v].font;document.head.appendChild(f);
    if(v==='he'&&m!=='true'){var p=document.createElement('link');p.rel='preload';p.as='image';p.href='/themes/he/enso.svg';document.head.appendChild(p)}
    var l=document.createElement('link');l.id='theme-'+v;l.rel='stylesheet';l.href=a[v].css;l.setAttribute('blocking','render');l.onload=function(){l.dataset.loaded='true'};document.head.appendChild(l)
  })(` + JSON.stringify(themeAssets).replace(/</g, '\\u003c') + ')'
  return <script id="preference-bootstrap" dangerouslySetInnerHTML={{ __html: source }} />
}

'use client';
import { useEffect, useState } from 'react';
import { X, ExternalLink, Megaphone } from 'lucide-react';
import type { AdBanner } from '@/lib/types';

export function AdRotator({ ads }: { ads: AdBanner[] }) {
  const [index,setIndex]=useState(0); const [overlay,setOverlay]=useState(false); const [overlayIndex,setOverlayIndex]=useState(0);
  useEffect(()=>{ if(ads.length<2)return; const id=window.setInterval(()=>setIndex(i=>(i+1)%ads.length),5000); return()=>window.clearInterval(id)},[ads.length]);
  useEffect(()=>{ if(!ads.length)return; const id=window.setInterval(()=>{setOverlayIndex(i=>(i+1)%ads.length);setOverlay(true)},20000); return()=>window.clearInterval(id)},[ads.length]);
  if(!ads.length)return null;
  const ad=ads[index]; const pop=ads[overlayIndex];
  return <>
    <section className="ad-shell relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-xl">
      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block group">
        <picture><source media="(max-width: 640px)" srcSet={ad.mobileImage||ad.image}/><img src={ad.image} alt={ad.title} loading="eager" decoding="async" className="w-full h-[120px] sm:h-[170px] lg:h-[210px] object-cover transition duration-500 group-hover:scale-[1.015]"/></picture>
        <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] font-bold"><Megaphone size={13}/>{ad.title}</div>
      </a>
      <div className="absolute top-3 end-3 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] text-white/80">{index+1}/{ads.length}</div>
    </section>
    {overlay&&<div className="fixed inset-0 z-[80] grid place-items-center bg-black/65 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950">
        <button onClick={()=>setOverlay(false)} className="absolute top-3 end-3 z-10 h-9 w-9 rounded-full bg-black/65 grid place-items-center text-white"><X size={18}/></button>
        <a href={pop.link} target="_blank" rel="noopener noreferrer" onClick={()=>setOverlay(false)} className="block"><picture><source media="(max-width: 640px)" srcSet={pop.mobileImage||pop.image}/><img src={pop.image} alt={pop.title} className="w-full max-h-[75vh] object-contain bg-black"/></picture></a>
        <div className="p-3 flex items-center justify-between gap-3"><span className="font-bold truncate">{pop.title}</span><a href={pop.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-950 text-xs font-black"><ExternalLink size={14}/> Open</a></div>
      </div>
    </div>}
  </>
}

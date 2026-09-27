'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, LockKeyhole, Play, PlayCircle, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { getFilmParts, getMedia, getMediaById } from '@/lib/content';
import { useApp } from '@/components/AppProvider';
import { MovieMeta } from '@/components/MovieMeta';
import { getBackdrop, getLogo } from '@/lib/media-meta';
import type { FilmPart, MediaItem } from '@/lib/types';

export default function FilmDetails() {
  const { isVip } = useApp(); const params = useParams<{ id: string }>(); const id = decodeURIComponent(params.id);
  const [film,setFilm]=useState<MediaItem|null>(null); const [parts,setParts]=useState<FilmPart[]>([]); const [related,setRelated]=useState<MediaItem[]>([]); const [loaded,setLoaded]=useState(false);
  useEffect(()=>{getMediaById(id).then(setFilm).catch(()=>setFilm(null));},[id]);
  useEffect(()=>{getFilmParts(id,isVip).then(setParts).catch(()=>setParts([])).finally(()=>setLoaded(true));},[id,isVip]);
  useEffect(()=>{getMedia(true,isVip).then(all=>setRelated(all.filter(x=>x.type==='film'&&x.id!==id&&x.enabled!==false).slice(0,6))).catch(()=>{});},[id,isVip]);
  const logo=film?getLogo(film):undefined; const backdrop=film?getBackdrop(film):'';
  const screenshots=useMemo(()=>film?.images?.filter(i=>i.type==='screenshot').slice(0,8) ?? [],[film]);
  return <PageShell><Protected>{film?.type==='film'?<div className="max-w-6xl mx-auto space-y-8">
    <Link href="/films" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Films</Link>
    <section className="relative overflow-hidden rounded-[2rem] glass min-h-[520px]">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" loading="eager" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />
      <div className="relative grid lg:grid-cols-[250px_1fr] gap-7 p-5 sm:p-9 items-end min-h-[520px]">
        <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl"><img src={film.poster} alt={film.title} className="w-full h-full object-cover" /></div>
        <div className="pb-1 max-w-3xl">
          {logo ? <img src={logo} alt={film.title} className="max-h-20 max-w-[280px] object-contain object-left mb-4" /> : <h1 className="text-4xl sm:text-6xl font-black">{film.title}</h1>}
          {logo && <h1 className="sr-only">{film.title}</h1>}
          <MovieMeta item={film}/>
          <p className="text-slate-300 leading-7 mt-5">{film.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {loaded && parts.length===0 && film.streamUrl && <Link href={`/watch?media=${encodeURIComponent(film.id)}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 font-black"><Play size={17} fill="currentColor"/> Watch now</Link>}
            {film.trailerUrl && <a href={film.trailerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass font-bold"><ExternalLink size={16}/> Trailer</a>}
            {film.accessLevel==='vip' && <span className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-500/15 text-violet-200 font-black"><LockKeyhole size={16}/> VIP</span>}
          </div>
        </div>
      </div>
    </section>
    {film.cast?.length || film.director ? <section className="glass rounded-2xl p-5 sm:p-7"><h2 className="text-xl font-black mb-4">Cast & Crew</h2>{film.director&&<p className="text-sm text-slate-300 mb-4"><span className="text-slate-500">Director:</span> {film.director}</p>}<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{film.cast?.slice(0,10).map(c=><div key={`${c.name}-${c.character??''}`} className="flex gap-3 items-center">{c.photo?<img src={c.photo} alt="" className="h-12 w-12 rounded-xl object-cover"/>:<div className="h-12 w-12 rounded-xl bg-white/5"/>}<div className="min-w-0"><div className="font-bold truncate">{c.name}</div>{c.character&&<div className="text-xs text-slate-500 truncate">{c.character}</div>}</div></div>)}</div></section>:null}
    {parts.length>0 && <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Parts</h2><span className="text-xs text-slate-500">{parts.length}</span></div><div className="grid sm:grid-cols-2 gap-3">{parts.map(p=><Link key={p.id} href={`/watch?media=${encodeURIComponent(film.id)}&part=${encodeURIComponent(p.id)}`} className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[.07] transition"><span className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-300 grid place-items-center font-black">{String(p.partNumber).padStart(2,'0')}</span><div className="min-w-0 flex-1"><div className="font-bold truncate">{p.title||`Part ${p.partNumber}`}</div><div className="text-xs text-slate-500 mt-1">{p.durationMinutes?`${p.durationMinutes} min`:'Part'} {p.quality?.length?` · ${p.quality.join(' / ')}`:''}</div></div><PlayCircle size={20} className="text-slate-400"/></Link>)}</div></section>}
    {screenshots.length>0 && <section><h2 className="text-xl font-black mb-3">Screenshots</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{screenshots.map((im,i)=><img key={`${im.url}-${i}`} src={im.url} alt={im.caption||''} loading="lazy" className="aspect-video w-full object-cover rounded-xl glass"/>)}</div></section>}
    {loaded&&parts.length===0&&!film.streamUrl&&<div className="glass rounded-2xl p-10 text-center text-slate-500">No stream is configured for this film yet.</div>}
    {related.length>0&&<section><h2 className="text-xl font-black mb-3">You may also like</h2><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{related.map(x=><Link key={x.id} href={`/films/${encodeURIComponent(x.id)}`} className="glass rounded-xl overflow-hidden"><img src={x.poster} alt={x.title} loading="lazy" className="aspect-[2/3] w-full object-cover"/><div className="p-2"><div className="text-sm font-bold truncate">{x.title}</div>{x.rating!=null&&<div className="text-xs text-slate-500 flex items-center gap-1"><Star size={11} fill="currentColor"/> {x.rating.toFixed(1)}</div>}</div></Link>)}</div></section>}
  </div>:<div className="min-h-[60vh] grid place-items-center text-slate-500">Film not found.</div>}</Protected></PageShell>;
}

'use client';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Zap, RadioTower, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { Section } from '@/components/Section';
import { ChannelCard } from '@/components/ChannelCard';
import { MediaCard } from '@/components/MediaCard';
import { getChannels, getMedia } from '@/lib/content';
import type { Channel, MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';

export default function Home(){
 const {t}=useApp(); const [channels,setChannels]=useState<Channel[]>([]); const [media,setMedia]=useState<MediaItem[]>([]);
 useEffect(()=>{let alive=true;Promise.all([getChannels(true),getMedia(true)]).then(([cs,ms])=>{if(alive){setChannels(cs);setMedia(ms)}}).catch(()=>{});return()=>{alive=false}},[]);
 const films=media.filter(x=>x.type==='film');
 return <PageShell><div className="fade-up space-y-10 sm:space-y-14">
   <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-violet-950/70 via-[#10131d] to-cyan-950/35 p-6 sm:p-10 lg:p-14 min-h-[390px] flex items-center">
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_75%_35%,white,transparent_1px)] [background-size:18px_18px]"/>
    <div className="relative max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-violet-200"><Sparkles size={13}/> 4uStream Premium</div>
      <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-.055em] leading-[.95]">Live TV.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">One beautiful place.</span></h1>
      <p className="mt-5 max-w-xl text-sm sm:text-base text-slate-300/80">{t('subtitle')}</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/live" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200"><Play size={16} fill="currentColor"/>{t('live')}<ArrowRight size={16}/></Link><Link href="/signup" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">{t('signup')}</Link></div>
    </div>
    <div className="hidden lg:block absolute end-10 w-72 h-72 rounded-full border border-white/10 bg-white/[.02] shadow-[0_0_100px_rgba(124,58,237,.25)]"/>
   </section>
   <section className="grid grid-cols-3 gap-2 sm:gap-4"><Feature icon={<Zap/>} title="Fast UI" text="Lightweight and responsive."/><Feature icon={<RadioTower/>} title="Live" text="Quick channel access."/><Feature icon={<Languages/>} title="4 Languages" text="RTL + LTR ready."/></section>
   {channels.length>0&&<Section title={t('live')} href="/live"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">{channels.slice(0,10).map(c=><ChannelCard key={c.id} channel={c}/>)}</div></Section>}
   {films.length>0&&<Section title={t('films')} href="/films"><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">{films.slice(0,8).map(x=><MediaCard key={x.id} item={x}/>)}</div></Section>}
 </div></PageShell>
}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="rounded-2xl border border-white/8 bg-white/[.025] p-3 sm:p-5"><div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-violet-500/10 grid place-items-center text-violet-300">{icon}</div><h3 className="font-extrabold text-xs sm:text-sm mt-3">{title}</h3><p className="hidden sm:block text-xs text-slate-500 mt-1">{text}</p></div>}

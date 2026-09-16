'use client';
import Link from 'next/link';
import { ArrowRight, PlayCircle, ShieldCheck, Languages, Smartphone, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { Section } from '@/components/Section';
import { ChannelCard } from '@/components/ChannelCard';
import { MediaCard } from '@/components/MediaCard';
import { getChannels, getMedia } from '@/lib/content';
import { getAds } from '@/lib/ads';
import { AdRotator } from '@/components/AdRotator';
import type { AdBanner } from '@/lib/types';
import type { Channel, MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';

export default function Home(){
  const {t}=useApp();
  const [channels,setChannels]=useState<Channel[]>([]);
  const [media,setMedia]=useState<MediaItem[]>([]);
  const [ads,setAds]=useState<AdBanner[]>([]);

  useEffect(()=>{
    Promise.all([getChannels(true), getMedia(true), getAds(true)])
      .then(([cs,ms,as])=>{setChannels(cs);setMedia(ms);setAds(as);})
      .catch(()=>{setChannels([]);setMedia([]);setAds([]);});
  },[]);

  const films=media.filter(x=>x.type==='film');

  return <PageShell><div className="fade-up space-y-14">
    {ads.length>0&&<AdRotator ads={ads}/>}
    <section className="relative overflow-hidden rounded-[2rem] glass p-7 sm:p-12">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-200 text-xs font-bold"><Sparkles size={14}/> 4uStream</div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-6 leading-[1.05]">{t('welcome')}</h1>
        <p className="text-slate-400 mt-5 text-base sm:text-lg max-w-2xl">{t('subtitle')}</p>
        <div className="flex flex-wrap gap-3 mt-8"><Link href="/live" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 font-extrabold hover:bg-slate-200"><PlayCircle size={18}/>{t('live')}<ArrowRight size={17}/></Link><Link href="/signup" className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">{t('signup')}</Link></div>
      </div>
      <div className="hidden lg:grid absolute end-10 top-10 w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/10 blur-2xl"/>
    </section>
    <section className="grid sm:grid-cols-3 gap-4"><Feature icon={<ShieldCheck/>} title="Security-first" text="Authentication, authorization and locked database rules."/><Feature icon={<Languages/>} title="4 languages" text="Badini, Sorani, English and Arabic with RTL/LTR."/><Feature icon={<Smartphone/>} title="Installable" text="PWA-ready experience for mobile and desktop."/></section>
    {channels.length>0&&<Section title={t('live')} href="/live"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{channels.slice(0,8).map(c=><ChannelCard key={c.id} channel={c}/>)}</div></Section>}
    {films.length>0&&<Section title={t('films')} href="/films"><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{films.slice(0,8).map(x=><MediaCard key={x.id} item={x}/>)}</div></Section>}
  </div></PageShell>
}

function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="glass rounded-2xl p-5"><div className="h-10 w-10 rounded-xl bg-white/5 grid place-items-center text-violet-300">{icon}</div><h3 className="font-bold mt-4">{title}</h3><p className="text-sm text-slate-400 mt-1">{text}</p></div>}

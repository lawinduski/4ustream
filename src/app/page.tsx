'use client';
import Link from 'next/link';
import { ArrowUpLeft, Play, ShieldCheck, Smartphone, Sparkles, Crown, Radio, Film, Clapperboard, ChevronLeft, Zap, Search, Star, LockKeyhole, Layers3, Flame, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { ChannelCard } from '@/components/ChannelCard';
import { MediaCard } from '@/components/MediaCard';
import { getChannels, getMedia } from '@/lib/content';
import { getAds } from '@/lib/ads';
import { AdRotator } from '@/components/AdRotator';
import type { AdBanner, Channel, MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';

export default function Home(){
 const {t,isVip,user}=useApp(); const [channels,setChannels]=useState<Channel[]>([]); const [media,setMedia]=useState<MediaItem[]>([]); const [ads,setAds]=useState<AdBanner[]>([]);
 useEffect(()=>{Promise.all([getChannels(true,isVip),getMedia(true,isVip),getAds(true)]).then(([cs,ms,as])=>{setChannels(cs);setMedia(ms);setAds(as);}).catch(()=>{});},[isVip]);
 const films=media.filter(x=>x.type==='film'); const dramas=media.filter(x=>x.type==='drama');
 return <PageShell><div className="home-stage fade-up">
  {ads.length>0&&<AdRotator ads={ads}/>}
  <section className="hero-premium">
   <div className="hero-grid"/><div className="hero-glow hero-glow-a"/><div className="hero-glow hero-glow-b"/>
   <div className="relative z-10 max-w-4xl">
    <div className="eyebrow"><span className="live-dot"/> 4uSTREAM • BADINI FIRST</div>
    <h1 className="hero-title">{t('welcome')}</h1>
    <p className="hero-copy">فلم، دراما و کەنالێن ڕاستەوخۆ ل یەک شوێن. ناڤەڕۆکا FREE و VIP ب دیزاینەکا پڕۆفیشناڵ و خێرا بۆ موبایل و Smart TV.</p>
    <div className="flex flex-wrap gap-3 mt-8">
      <Link href="/films" className="primary-cta"><Film size={17}/>{t('films')}<ArrowUpLeft size={17}/></Link>
      <Link href="/drama" className="secondary-cta"><Clapperboard size={16}/>{t('drama')}</Link>
      <Link href="/live" className="secondary-cta"><Radio size={16}/>{t('live')}</Link>
    </div>
    <div className="hero-metrics"><span><Zap size={14}/> خێرا</span><span><ShieldCheck size={14}/> پارێزراو</span><span><Smartphone size={14}/> موبایل</span><span><Crown size={14}/> VIP</span></div>
   </div>
  </section>

  <div className="quick-grid">
    <Quick href="/search" icon={<Search/>} title={t('discover')} text="لێگەریان ل ناڤەڕۆکێن هەمی"/>
    <Quick href="/films" icon={<Film/>} title={t('films')} text="فلمێن نوێ و پڕبینەر"/>
    <Quick href="/drama" icon={<Clapperboard/>} title={t('drama')} text="وەرز و ئەڵقە"/>
    <Quick href="/account" icon={<Crown/>} title="VIP" text={isVip?'VIP چالاکە':'ناڤەڕۆکا VIP ببینە'}/>
  </div>

  {channels.length>0&&<PremiumSection kicker={t('live')} title="کەنالێن ڕاستەوخۆ" href="/live" icon={<Radio size={18}/>}>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{channels.slice(0,8).map(c=><ChannelCard key={c.id} channel={c}/>)}</div>
  </PremiumSection>}

  {films.length>0&&<PremiumSection kicker={t('latest')} title="نوێترین فلم" href="/films" icon={<Film size={18}/>}>
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">{films.slice(0,10).map(x=><MediaCard key={x.id} item={x}/>)}</div>
  </PremiumSection>}

  {dramas.length>0&&<PremiumSection kicker={t('trending')} title="درامای پڕبینەر" href="/drama" icon={<Flame size={18}/>}>
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">{dramas.slice(0,10).map(x=><MediaCard key={x.id} item={x}/>)}</div>
  </PremiumSection>}

  {films.length>1&&<PremiumSection kicker={t('topRated')} title="باشترین هەڵبژاردەکان" href="/films" icon={<Star size={18}/>}>
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">{[...films].reverse().slice(0,10).map(x=><MediaCard key={x.id} item={x}/>)}</div>
  </PremiumSection>}

  <section className="vip-showcase glass rounded-[2rem] p-6 sm:p-9">
    <div className="flex flex-col lg:flex-row lg:items-center gap-7">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center shrink-0 shadow-2xl"><Crown size={30}/></div>
      <div className="flex-1">
        <div className="section-kicker">{t('vipOnly')}</div>
        <h2 className="text-2xl sm:text-3xl font-black mt-2">ئەزموونا VIP بۆ ناڤەڕۆکا تایبەت</h2>
        <p className="text-slate-400 mt-2 leading-7">ئەدمین دەتوانێت هەر فلم، دراما، ئەڵقە یان کەنالەکێ بکەتە VIP یان FREE. ئەندامێن نوێ بێ چاوەڕوانی چالاک دەبن.</p>
      </div>
      <Link href="/account" className="primary-cta"><Crown size={16}/>{isVip?'VIP ـا من':'بینینا VIP'}</Link>
    </div>
  </section>

  <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <Feature icon={<Zap/>} title="پەخشی خێرا" text="پەخش بۆ موبایل و کۆمپیوتەر."/>
    <Feature icon={<LockKeyhole/>} title="FREE / VIP" text="دەستگەیشتن بەپێی پلانی بەکارهێنەر."/>
    <Feature icon={<Layers3/>} title="وەرز و ئەڵقە" text="دراما ب شێوەی ڕێکخراو."/>
    <Feature icon={<Clock3/>} title="ئەزموونا بەردەوام" text="لە شوێنی خۆت بەردەوام بە."/>
  </section>
 </div>
}
function Quick({href,icon,title,text}:{href:string;icon:React.ReactNode;title:string;text:string}){return <Link href={href} className="quick-card"><div className="quick-icon">{icon}</div><div><b>{title}</b><small>{text}</small></div><ChevronLeft size={16} className="ms-auto opacity-40"/></Link>}
function PremiumSection({kicker,title,href,icon,children}:{kicker:string;title:string;href:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="premium-section"><div className="section-heading"><div><div className="section-kicker inline-flex items-center gap-2">{icon}{kicker}</div><h2>{title}</h2></div><Link href={href}>{'هەموو ببینە'} <ChevronLeft size={15}/></Link></div>{children}</section>}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="quick-card"><div className="quick-icon">{icon}</div><div><b>{title}</b><small>{text}</small></div></div>}

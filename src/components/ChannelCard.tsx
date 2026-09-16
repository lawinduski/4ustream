'use client';
import Link from 'next/link';
import { Play, Star, Radio } from 'lucide-react';
import type { Channel } from '@/lib/types';
export function ChannelCard({channel}:{channel:Channel}){
 const fav=()=>{const k='4u-favorites';const a=JSON.parse(localStorage.getItem(k)||'[]');const n=a.includes(channel.id)?a.filter((x:string)=>x!==channel.id):[...a,channel.id];localStorage.setItem(k,JSON.stringify(n));};
 return <article className="channel-card group">
   <div className="channel-media">
    {channel.logo?<img src={channel.logo} alt="" loading="lazy" decoding="async" className="channel-logo"/>:<div className="channel-fallback"><Radio size={30}/><b>{channel.name.slice(0,2).toUpperCase()}</b></div>}
    <div className="channel-shade"/>
    <div className="live-pill"><span/>LIVE</div>
    <button onClick={fav} className="favorite-btn" aria-label="Favorite"><Star size={16}/></button>
    <Link href={`/live?channel=${encodeURIComponent(channel.id)}`} className="play-overlay"><span><Play size={19} fill="currentColor"/></span></Link>
    <div className="channel-caption"><span>{channel.category}</span><h3>{channel.name}</h3></div>
   </div>
 </article>
}

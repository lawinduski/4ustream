'use client';
import Link from 'next/link';
import { Play, Star, LockKeyhole }  from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MediaItem } from '@/lib/types';
import { readLocalFavorites, toggleFavorite } from '@/lib/favorites';
import { useApp } from './AppProvider';
export function MediaCard({item}:{item:MediaItem}){
 const {user}=useApp(); const [fav,setFav]=useState(false);
 useEffect(()=>{setFav(readLocalFavorites().some(x=>x.id===item.id&&x.type==='media')); const fn=()=>setFav(readLocalFavorites().some(x=>x.id===item.id&&x.type==='media')); window.addEventListener('4u-favorites-changed',fn); return()=>window.removeEventListener('4u-favorites-changed',fn)},[item.id]);
 useEffect(()=>{if(!user)return; import('@/lib/favorites').then(({getFavorites})=>getFavorites(user.uid).then(a=>setFav(a.some(x=>x.id===item.id&&x.type==='media'))).catch(()=>{}));},[user,item.id]);
 const favClick=async(e:React.MouseEvent)=>{e.preventDefault();e.stopPropagation(); const next=await toggleFavorite(user?.uid,{id:item.id,type:'media',title:item.title,image:item.poster});setFav(next)};
 return <div className="relative"><Link href={item.type==='drama'?`/drama/${encodeURIComponent(item.id)}`:`/watch?media=${encodeURIComponent(item.id)}`} className="block glass card-hover rounded-2xl overflow-hidden group"><div className="relative aspect-[2/3] bg-slate-900 overflow-hidden"><img src={item.poster} alt={item.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>{item.accessLevel==='vip'&&<span className="absolute top-2 start-2 z-10 inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2 py-1 text-[10px] font-black text-white shadow-lg"><LockKeyhole size={11}/> VIP</span>}<div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition grid place-items-center"><span className="h-12 w-12 rounded-full bg-white text-slate-900 grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-xl"><Play size={18} fill="currentColor"/></span></div></div><div className="p-3 sm:p-4"><div className="text-xs text-violet-300 font-semibold">{item.year} · {item.genre}</div><h3 className="font-bold mt-1 truncate">{item.title}</h3><p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description}</p></div></Link><button onClick={favClick} className={`absolute top-3 end-3 z-10 p-2 rounded-xl bg-black/50 backdrop-blur text-slate-200 ${fav?'text-yellow-300':''}`} aria-label="Favorite"><Star size={16} fill={fav?'currentColor':'none'}/></button></div>
}

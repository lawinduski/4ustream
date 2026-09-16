import Link from 'next/link';
import { Play } from 'lucide-react';
import type { MediaItem } from '@/lib/types';
export function MediaCard({item}:{item:MediaItem}){return <Link href={`/watch?media=${encodeURIComponent(item.id)}`} className="media-card group"><div className="media-poster"><img src={item.poster} alt={item.title} loading="lazy" decoding="async"/><div className="media-overlay"><span><Play size={18} fill="currentColor"/></span></div><div className="media-meta">{item.year} · {item.genre}</div></div><div className="px-1 pt-3"><h3 className="font-bold truncate">{item.title}</h3><p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p></div></Link>}

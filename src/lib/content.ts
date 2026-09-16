import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, MediaItem } from '@/lib/types';

const memory: Record<string, {at:number; value:any}> = {};
const TTL = 45_000;
async function cached<T>(key:string, loader:()=>Promise<T>):Promise<T>{
 const now=Date.now(); const hit=memory[key]; if(hit && now-hit.at<TTL) return hit.value as T;
 if(typeof window!=='undefined'){try{const raw=sessionStorage.getItem(`4u:${key}`);if(raw){const parsed=JSON.parse(raw);if(now-parsed.at<TTL){memory[key]=parsed;return parsed.value as T}}}catch{}}
 const value=await loader(); memory[key]={at:now,value};
 if(typeof window!=='undefined'){try{sessionStorage.setItem(`4u:${key}`,JSON.stringify({at:now,value}))}catch{}}
 return value;
}
export async function getChannels(activeOnly=true):Promise<Channel[]>{return cached(`channels:${activeOnly}`,async()=>{const ref=collection(db,'channels');const snap=await getDocs(activeOnly?query(ref,where('enabled','==',true)):ref);return snap.docs.map(d=>({id:d.id,...d.data()} as Channel));})}
export async function getMedia(activeOnly=true):Promise<MediaItem[]>{return cached(`media:${activeOnly}`,async()=>{const ref=collection(db,'media');const snap=await getDocs(activeOnly?query(ref,where('enabled','==',true)):ref);return snap.docs.map(d=>({id:d.id,...d.data()} as MediaItem));})}
export async function getMediaById(id:string){const snap=await getDoc(doc(db,'media',id));if(!snap.exists())return null;const item={id:snap.id,...snap.data()} as MediaItem;return item.enabled===false?null:item}

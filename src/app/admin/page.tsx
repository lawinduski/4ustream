'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, query, serverTimestamp,
  setDoc, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { uploadAdminAsset } from '@/lib/storage';
import type {
  AccessLevel, AdAudience, AdBanner, Category, Channel, DramaEpisode,
  MediaItem, MediaPart, PlayerType, UserProfile, UserStatus,
} from '@/lib/types';
import {
  BarChart3, Clapperboard, Crown, Edit3, Film, Layers3,
  Megaphone, Plus, Radio, Save, ShieldCheck, Trash2, Upload, UserRound, X,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';

type Tab = 'overview' | 'users' | 'channels' | 'films' | 'dramas' | 'episodes' | 'parts' | 'ads';
type OverviewCounts = { users: number; freeUsers: number; vipUsers: number; channels: number; films: number; dramas: number; episodes: number; ads: number };

const categories: Category[] = ['NEWS', 'SPORTS', 'BEIN', 'MOVIES', 'KIDS', 'KURDISH', 'ENTERTAINMENT'];
const emptyChannel: Channel = { id: '', name: '', category: 'NEWS', description: '', logo: '', streamUrl: '', playerType: 'video', enabled: false, accessLevel: 'free' };
const emptyMedia: MediaItem = { id: '', title: '', type: 'film', year: new Date().getFullYear(), genre: '', description: '', poster: '', streamUrl: '', playerType: 'video', enabled: false, accessLevel: 'free' };
const emptyEpisode: DramaEpisode = { id: '', dramaId: '', title: '', seasonNumber: 1, episodeNumber: 1, durationMinutes: 45, description: '', streamUrl: '', playerType: 'video', enabled: false, accessLevel: 'free' };
const emptyPart: MediaPart = { id: '', mediaId: '', partNumber: 1, title: '', durationMinutes: 0, description: '', streamUrl: '', playerType: 'video', enabled: false, accessLevel: 'free' };
const emptyAd: AdBanner = { id: '', title: '', image: '', mobileImage: '', link: '', placement: 'banner', audience: 'both', repeatSeconds: 20, enabled: true, order: 1 };

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatDate(value: unknown): string {
  try {
    if (!value) return 'No expiry';
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString();
    }
    const date = new Date(value as string | number | Date);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function Admin() {
  const { user } = useApp();
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [episodes, setEpisodes] = useState<DramaEpisode[]>([]);
  const [parts, setParts] = useState<MediaPart[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [overview, setOverview] = useState<OverviewCounts>({ users: 0, freeUsers: 0, vipUsers: 0, channels: 0, films: 0, dramas: 0, episodes: 0, ads: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [editor, setEditor] = useState<Tab | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [channelForm, setChannelForm] = useState<Channel>({ ...emptyChannel });
  const [mediaForm, setMediaForm] = useState<MediaItem>({ ...emptyMedia });
  const [episodeForm, setEpisodeForm] = useState<DramaEpisode>({ ...emptyEpisode });
  const [partForm, setPartForm] = useState<MediaPart>({ ...emptyPart });
  const [adForm, setAdForm] = useState<AdBanner>({ ...emptyAd });

  const loadTab = useCallback(async (nextTab: Tab = 'overview') => {
    if (!user || !allowed) return;
    setBusy(true);
    try {
      if (nextTab === 'overview') {
        const [usersCount, vipCount, channelsCount, filmsCount, dramasCount, episodesCount, adsCount] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(query(collection(db, 'users'), where('plan', '==', 'vip'))),
          getCountFromServer(collection(db, 'channels')),
          getCountFromServer(query(collection(db, 'media'), where('type', '==', 'film'))),
          getCountFromServer(query(collection(db, 'media'), where('type', '==', 'drama'))),
          getCountFromServer(collection(db, 'episodes')),
          getCountFromServer(collection(db, 'ads')),
        ]);
        setOverview({
          users: usersCount.data().count,
          freeUsers: Math.max(0, usersCount.data().count - vipCount.data().count),
          vipUsers: vipCount.data().count,
          channels: channelsCount.data().count,
          films: filmsCount.data().count,
          dramas: dramasCount.data().count,
          episodes: episodesCount.data().count,
          ads: adsCount.data().count,
        });
      } else if (nextTab === 'users') {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map((d) => d.data() as UserProfile));
      } else if (nextTab === 'channels') {
        const snap = await getDocs(collection(db, 'channels'));
        setChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Channel));
      } else if (nextTab === 'films' || nextTab === 'dramas') {
        const [ms, ps] = await Promise.all([getDocs(collection(db, 'media')), getDocs(collection(db, 'parts'))]);
        setMedia(ms.docs.map((d) => ({ id: d.id, ...d.data() }) as MediaItem));
        setParts(ps.docs.map((d) => ({ id: d.id, ...d.data() }) as MediaPart));
      } else if (nextTab === 'episodes') {
        const [es, ms] = await Promise.all([getDocs(collection(db, 'episodes')), getDocs(collection(db, 'media'))]);
        setEpisodes(es.docs.map((d) => ({ id: d.id, ...d.data() }) as DramaEpisode));
        setMedia(ms.docs.map((d) => ({ id: d.id, ...d.data() }) as MediaItem));
      } else if (nextTab === 'ads') {
        const snap = await getDocs(collection(db, 'ads'));
        setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AdBanner).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load this section.');
    } finally {
      setBusy(false);
    }
  }, [allowed, user]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => setAllowed(snap.exists() && snap.data()?.active === true))
      .catch(() => setAllowed(false));
  }, [user]);

  useEffect(() => {
    if (allowed) void loadTab('overview');
  }, [allowed, loadTab]);

  const selectTab = (next: Tab) => {
    setTab(next);
    if (next !== 'overview') void loadTab(next);
  };

  const openNew = (type: Exclude<Tab, 'overview' | 'users'>) => {
    setEditingId(null);
    if (type === 'channels') setChannelForm({ ...emptyChannel });
    if (type === 'films' || type === 'dramas') setMediaForm({ ...emptyMedia, type: type === 'dramas' ? 'drama' : 'film' });
    if (type === 'episodes') setEpisodeForm({ ...emptyEpisode });
    if (type === 'ads') setAdForm({ ...emptyAd });
    setEditor(type);
  };

  const openEdit = (type: Exclude<Tab, 'overview' | 'users'>, value: Channel | MediaItem | DramaEpisode | MediaPart | AdBanner) => {
    setEditingId(value.id);
    if (type === 'channels') setChannelForm({ ...emptyChannel, ...(value as Channel), accessLevel: (value as Channel).accessLevel ?? 'free' });
    if (type === 'films' || type === 'dramas') setMediaForm({ ...emptyMedia, ...(value as MediaItem), accessLevel: (value as MediaItem).accessLevel ?? 'free' });
    if (type === 'episodes') setEpisodeForm({ ...emptyEpisode, ...(value as DramaEpisode), accessLevel: (value as DramaEpisode).accessLevel ?? 'free' });
    if (type === 'ads') setAdForm({ ...emptyAd, ...(value as AdBanner) });
    setEditor(type);
  };

  const save = async () => {
    if (!editor) return;
    setBusy(true);
    setMessage('');
    try {
      let collectionName = '';
      let value: Channel | MediaItem | DramaEpisode | MediaPart | AdBanner;
      if (editor === 'channels') { collectionName = 'channels'; value = channelForm; }
      else if (editor === 'films' || editor === 'dramas') { collectionName = 'media'; value = mediaForm; }
      else if (editor === 'episodes') { collectionName = 'episodes'; value = episodeForm; }
      else if (editor === 'ads') { collectionName = 'ads'; value = adForm; }
      else throw new Error('Unsupported editor.');

      const title = 'name' in value ? value.name : 'title' in value ? value.title : '';
      const id = value.id.trim() || slugify(title) || `${editor}-${Date.now().toString(36)}`;
      const payload = { ...value, id, updatedAt: serverTimestamp(), ...(editingId ? {} : { createdAt: serverTimestamp() }) };
      await setDoc(doc(db, collectionName, id), payload, { merge: true });
      setMessage('Saved successfully.');
      setEditor(null);
      setEditingId(null);
      await loadTab(tab);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const savePart = async () => {
    setBusy(true);
    try {
      const id = partForm.id.trim() || `${slugify(partForm.mediaId)}-part-${partForm.partNumber}`;
      await setDoc(doc(db, 'parts', id), {
        ...partForm,
        id,
        updatedAt: serverTimestamp(),
        ...(editingId ? {} : { createdAt: serverTimestamp() }),
      }, { merge: true });
      setMessage('Part saved successfully.');
      setEditor(null);
      setEditingId(null);
      await loadTab('films');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Part save failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (collectionName: 'users' | 'channels' | 'media' | 'episodes' | 'parts' | 'ads', id: string) => {
    if (!window.confirm('Delete this item?')) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, collectionName, id));
      setMessage('Deleted.');
      await loadTab(tab);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  const setVip = async (profile: UserProfile, days: number | null) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), days === null
        ? { plan: 'free', vipUntil: null }
        : { plan: 'vip', status: 'active', vipUntil: Timestamp.fromDate(new Date(Date.now() + days * 86_400_000)) });
      setMessage(days === null ? 'User returned to FREE.' : `VIP enabled for ${days} days.`);
      await loadTab('users');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'User update failed.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (profile: UserProfile, status: UserStatus) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { status });
      setMessage(`User status changed to ${status}.`);
      await loadTab('users');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Status update failed.');
    } finally {
      setBusy(false);
    }
  };

  const vipUsers = useMemo(() => users.filter((u) => u.plan === 'vip'), [users]);
  const freeUsers = useMemo(() => users.filter((u) => u.plan !== 'vip'), [users]);
  const films = useMemo(() => media.filter((m) => m.type === 'film'), [media]);
  const dramas = useMemo(() => media.filter((m) => m.type === 'drama'), [media]);
  const activeChannels = channels.filter((x) => x.enabled).length;
  const activeMedia = media.filter((x) => x.enabled).length;

  if (!user) return <PageShell><div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div></PageShell>;

  return (
    <PageShell>
      <Protected>
        {!allowed ? (
          <div className="min-h-[60vh] grid place-items-center text-slate-400">Not authorized.</div>
        ) : (
          <div className="admin-shell space-y-6">
            <header className="admin-hero">
              <div>
                <div className="eyebrow"><ShieldCheck size={14} /> 4uSTREAM ADMIN</div>
                <h1>Admin Dashboard</h1>
                <p>Overview first. Open management forms only when you need them.</p>
              </div>
              <div className="admin-badge"><Crown size={15} /> Secure console</div>
            </header>

            {message && (
              <div className="glass rounded-2xl p-3 flex items-center justify-between text-sm text-violet-200">
                <span>{message}</span><button onClick={() => setMessage('')}><X size={16} /></button>
              </div>
            )}

            <nav className="admin-tabs" aria-label="Admin navigation">
              {([
                ['overview', 'Overview', BarChart3],
                ['users', 'Users', UserRound],
                ['channels', 'Channels', Radio],
                ['films', 'Films', Film],
                ['dramas', 'Dramas', Clapperboard],
                ['episodes', 'Episodes', Layers3],
                ['ads', 'Ads', Megaphone],
              ] as const).map(([id, label, Icon]) => (
                <button key={id} className={tab === id ? 'active' : ''} onClick={() => selectTab(id)}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </nav>

            {busy && <div className="text-xs text-slate-500">Updating…</div>}

            {tab === 'overview' && (
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Total Users" value={overview.users} />
                <Stat label="FREE Users" value={overview.freeUsers} />
                <Stat label="VIP Users" value={overview.vipUsers} />
                <Stat label="Channels" value={overview.channels} />
                <Stat label="Films" value={overview.films} />
                <Stat label="Dramas" value={overview.dramas} />
                <Stat label="Episodes" value={overview.episodes} />
                <Stat label="Ads" value={overview.ads} />
              </section>
            )}

            {tab === 'users' && (
              <UserManager users={users} setVip={setVip} setStatus={setStatus} />
            )}

            {tab === 'channels' && (
              <CollectionSection title="Channels" count={channels.length} onAdd={() => openNew('channels')}>
                {channels.map((item) => (
                  <ListRow key={item.id} title={item.name} meta={`${item.category} · ${item.enabled ? 'Active' : 'Off'} · ${(item.accessLevel ?? 'free').toUpperCase()}`} image={item.logo} onEdit={() => openEdit('channels', item)} onDelete={() => remove('channels', item.id)} />
                ))}
              </CollectionSection>
            )}

            {(tab === 'films' || tab === 'dramas') && (
              <CollectionSection title={tab === 'films' ? 'Films' : 'Dramas'} count={(tab === 'films' ? films : dramas).length} onAdd={() => openNew(tab)}>
                {(tab === 'films' ? films : dramas).map((item) => (
                  <ListRow key={item.id} title={item.title} meta={`${item.year} · ${item.genre} · ${(item.accessLevel ?? 'free').toUpperCase()}`} image={item.poster} onEdit={() => openEdit(tab, item)} onDelete={() => remove('media', item.id)} />
                ))}
              </CollectionSection>
            )}

            {tab === 'episodes' && (
              <CollectionSection title="Episodes" count={episodes.length} onAdd={() => openNew('episodes')}>
                <div className="space-y-2">
                  {episodes.slice().sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber).map((item) => (
                    <ListRow key={item.id} title={item.title} meta={`S${item.seasonNumber} E${item.episodeNumber} · ${item.durationMinutes ?? 0} min · ${(item.accessLevel ?? 'free').toUpperCase()}`} onEdit={() => openEdit('episodes', item)} onDelete={() => remove('episodes', item.id)} />
                  ))}
                </div>
              </CollectionSection>
            )}

            {tab === 'ads' && (
              <CollectionSection title="Advertisements" count={ads.length} onAdd={() => openNew('ads')}>
                {ads.map((item) => (
                  <ListRow key={item.id} title={item.title} meta={`${item.placement ?? 'banner'} · ${(item.audience ?? 'both').toUpperCase()} · ${item.repeatSeconds ?? 20}s`} image={item.image} onEdit={() => openEdit('ads', item)} onDelete={() => remove('ads', item.id)} />
                ))}
              </CollectionSection>
            )}

            {editor && (
              <Modal title={`${editingId ? 'Edit' : 'Add'} ${editor === 'channels' ? 'Channel' : editor === 'films' || editor === 'dramas' ? editor.slice(0, -1) : editor === 'episodes' ? 'Episode' : editor === 'ads' ? 'Advertisement' : 'Item'}`} onClose={() => setEditor(null)}>
                {editor === 'channels' && <ChannelForm value={channelForm} setValue={setChannelForm} onSave={save} />}
                {(editor === 'films' || editor === 'dramas') && <MediaForm value={mediaForm} setValue={setMediaForm} onSave={save} />}
                {editor === 'episodes' && <EpisodeForm value={episodeForm} setValue={setEpisodeForm} dramas={dramas} onSave={save} />}
                {editor === 'ads' && <AdForm value={adForm} setValue={setAdForm} onSave={save} />}
              </Modal>
            )}

            {tab === 'films' && (
              <CollectionSection title="Film Parts" count={parts.filter((p) => films.some((f) => f.id === p.mediaId)).length} onAdd={() => { setEditingId(null); setPartForm({ ...emptyPart }); setEditor('parts' as Tab); }}>
                {parts.filter((p) => films.some((f) => f.id === p.mediaId)).map((item) => (
                  <ListRow key={item.id} title={item.title || `Part ${item.partNumber}`} meta={`Part ${item.partNumber} · ${(item.accessLevel ?? 'free').toUpperCase()}`} onEdit={() => { setEditingId(item.id); setPartForm({ ...emptyPart, ...item }); setEditor('parts' as Tab); }} onDelete={() => remove('parts', item.id)} />
                ))}
              </CollectionSection>
            )}

            {editor === 'parts' && (
              <Modal title={`${editingId ? 'Edit' : 'Add'} Film Part`} onClose={() => setEditor(null)}>
                <PartForm value={partForm} setValue={setPartForm} films={films} onSave={savePart} />
              </Modal>
            )}
          </div>
        )}
      </Protected>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="glass rounded-2xl p-4"><div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div><div className="text-2xl font-black mt-1">{value}</div></div>;
}

function CollectionSection({ title, count, onAdd, children }: { title: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return <section className="glass rounded-3xl overflow-hidden"><div className="p-5 border-b border-white/10 flex items-center justify-between"><div><h2 className="font-black">{title}</h2><span className="text-xs text-slate-500">{count} items</span></div><button className="list-add-btn" onClick={onAdd}><Plus size={14} /> Add</button></div><div className="divide-y divide-white/5">{children}</div></section>;
}

function ListRow({ title, meta, image, onEdit, onDelete }: { title: string; meta: string; image?: string; onEdit: () => void; onDelete: () => void }) {
  return <div className="p-4 flex items-center gap-3"><div className="h-12 w-12 rounded-xl overflow-hidden bg-white/5 shrink-0 grid place-items-center">{image ? <img src={image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <Film size={17} className="text-violet-300" />}</div><div className="min-w-0 flex-1"><div className="font-bold truncate">{title}</div><div className="text-xs text-slate-500 mt-1 truncate">{meta}</div></div><button className="icon-btn" onClick={onEdit} aria-label="Edit"><Edit3 size={16} /></button><button className="icon-btn text-red-300" onClick={onDelete} aria-label="Delete"><Trash2 size={16} /></button></div>;
}

function UserManager({ users, setVip, setStatus }: { users: UserProfile[]; setVip: (u: UserProfile, days: number | null) => Promise<void>; setStatus: (u: UserProfile, status: UserStatus) => Promise<void> }) {
  const [filter, setFilter] = useState<'all' | 'free' | 'vip'>('all');
  const visible = users.filter((u) => filter === 'all' || (filter === 'vip' ? u.plan === 'vip' : u.plan !== 'vip'));
  return <section className="space-y-4">
    <div className="flex gap-2 overflow-x-auto">
      {(['all', 'free', 'vip'] as const).map((value) => <button key={value} className={`mini-btn ${filter === value ? 'vip-btn' : ''}`} onClick={() => setFilter(value)}>{value === 'all' ? 'All Users' : value === 'free' ? 'FREE' : 'VIP'}</button>)}
    </div>
    {visible.slice().sort((a, b) => a.name.localeCompare(b.name)).map((u) => <div key={u.uid} className="glass rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="min-w-0 flex-1"><div className="font-bold flex items-center gap-2">{u.name || 'User'}{u.plan === 'vip' && <span className="vip-chip"><Crown size={11} />VIP</span>}</div><div className="text-xs text-slate-500 mt-1 truncate">{u.email}</div><div className="text-xs text-slate-500 mt-1">{(u.status || 'pending').toUpperCase()} {u.plan === 'vip' ? `· Expires ${formatDate(u.vipUntil)}` : '· FREE'}</div></div>
      <div className="flex flex-wrap gap-2"><button className="mini-btn vip-btn" onClick={() => void setVip(u, 30)}><Crown size={14} /> VIP 30d</button><button className="mini-btn vip-btn" onClick={() => void setVip(u, 90)}><Crown size={14} /> VIP 90d</button><button className="mini-btn" onClick={() => void setVip(u, null)}>FREE</button><button className="mini-btn" onClick={() => void setStatus(u, u.status === 'active' ? 'disabled' : 'active')}>{u.status === 'active' ? 'Disable' : 'Activate'}</button></div>
    </div>)}
  </section>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[100000] bg-black/70 p-4 grid place-items-center" role="dialog" aria-modal="true"><div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto glass rounded-3xl p-5 sm:p-7"><div className="flex items-center justify-between mb-5"><h2 className="text-xl font-black">{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-slate-400 font-bold">{label}</span><div className="mt-1">{children}</div></label>;
}

function AccessField({ value, onChange }: { value: AccessLevel; onChange: (value: AccessLevel) => void }) {
  return <Field label="Access"><select value={value} onChange={(e) => onChange(e.target.value as AccessLevel)} className="w-full rounded-xl px-3 py-2.5 outline-none"><option value="free">FREE</option><option value="vip">VIP</option></select></Field>;
}

function PlayerField({ value, onChange }: { value: PlayerType; onChange: (value: PlayerType) => void }) {
  return <Field label="Player"><select value={value} onChange={(e) => onChange(e.target.value as PlayerType)} className="w-full rounded-xl px-3 py-2.5 outline-none"><option value="video">VIDEO / MP4</option><option value="hls">HLS / M3U8</option><option value="iframe">IFRAME / Embed</option></select></Field>;
}

function UploadField({ label, value, onChange, folder }: { label: string; value: string; onChange: (value: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return;
    setBusy(true);
    try { onChange(await uploadAdminAsset(file, folder)); } finally { setBusy(false); }
  };
  return <div><span className="text-xs text-slate-400 font-bold">{label}</span><div className="mt-1 flex gap-2"><label className="upload-btn"><Upload size={15} />{busy ? 'Uploading…' : 'Choose image'}<input type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} /></label><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="or paste image URL" className="min-w-0 flex-1 rounded-xl px-3 py-2.5 outline-none" /></div></div>;
}

function CommonFields({ value, setValue }: { value: MediaItem; setValue: (value: MediaItem) => void }) {
  return <div className="space-y-4">
    <Field label="ID"><input value={value.id} onChange={(e) => setValue({ ...value, id: e.target.value })} className="form-input" /></Field>
    <Field label="Title"><input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} className="form-input" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Type"><select value={value.type} onChange={(e) => setValue({ ...value, type: e.target.value as MediaItem['type'] })} className="form-input"><option value="film">Film</option><option value="drama">Drama</option></select></Field><Field label="Year"><input type="number" value={value.year} onChange={(e) => setValue({ ...value, year: Number(e.target.value) })} className="form-input" /></Field></div>
    <Field label="Genre"><input value={value.genre} onChange={(e) => setValue({ ...value, genre: e.target.value })} className="form-input" /></Field>
    <UploadField label="Poster" value={value.poster} onChange={(poster) => setValue({ ...value, poster })} folder="posters" />
    <PlayerField value={value.playerType ?? 'video'} onChange={(playerType) => setValue({ ...value, playerType })} />
    <Field label="Stream URL"><input value={value.streamUrl ?? ''} onChange={(e) => setValue({ ...value, streamUrl: e.target.value })} className="form-input" /></Field>
    <Field label="Description"><textarea value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} className="form-input min-h-24" /></Field>
    <AccessField value={value.accessLevel ?? 'free'} onChange={(accessLevel) => setValue({ ...value, accessLevel })} />
    <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={value.enabled === true} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Published</label>
  </div>;
}

function MediaForm({ value, setValue, onSave }: { value: MediaItem; setValue: (value: MediaItem) => void; onSave: () => Promise<void> }) {
  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSave(); }}><CommonFields value={value} setValue={setValue} /><button className="w-full py-3 rounded-xl bg-white text-slate-950 font-black"><Save size={16} className="inline mr-2" /> Save</button></form>;
}

function ChannelForm({ value, setValue, onSave }: { value: Channel; setValue: (value: Channel) => void; onSave: () => Promise<void> }) {
  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSave(); }}><Field label="ID"><input value={value.id} onChange={(e) => setValue({ ...value, id: e.target.value })} className="form-input" /></Field><Field label="Name"><input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} className="form-input" /></Field><Field label="Category"><select value={value.category} onChange={(e) => setValue({ ...value, category: e.target.value as Category })} className="form-input">{categories.map((category) => <option key={category}>{category}</option>)}</select></Field><UploadField label="Logo" value={value.logo ?? ''} onChange={(logo) => setValue({ ...value, logo })} folder="logos" /><PlayerField value={value.playerType ?? 'video'} onChange={(playerType) => setValue({ ...value, playerType })} /><Field label="Stream URL"><input value={value.streamUrl ?? ''} onChange={(e) => setValue({ ...value, streamUrl: e.target.value })} className="form-input" /></Field><Field label="Description"><textarea value={value.description ?? ''} onChange={(e) => setValue({ ...value, description: e.target.value })} className="form-input min-h-20" /></Field><AccessField value={value.accessLevel ?? 'free'} onChange={(accessLevel) => setValue({ ...value, accessLevel })} /><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Published</label><button className="w-full py-3 rounded-xl bg-white text-slate-950 font-black"><Save size={16} className="inline mr-2" /> Save</button></form>;
}

function EpisodeForm({ value, setValue, dramas, onSave }: { value: DramaEpisode; setValue: (value: DramaEpisode) => void; dramas: MediaItem[]; onSave: () => Promise<void> }) {
  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSave(); }}><Field label="Drama"><select value={value.dramaId} onChange={(e) => setValue({ ...value, dramaId: e.target.value })} className="form-input"><option value="">Select drama</option>{dramas.map((drama) => <option key={drama.id} value={drama.id}>{drama.title}</option>)}</select></Field><Field label="Episode title"><input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} className="form-input" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Season"><input type="number" min="1" value={value.seasonNumber} onChange={(e) => setValue({ ...value, seasonNumber: Number(e.target.value) })} className="form-input" /></Field><Field label="Episode"><input type="number" min="1" value={value.episodeNumber} onChange={(e) => setValue({ ...value, episodeNumber: Number(e.target.value) })} className="form-input" /></Field></div><Field label="Duration (minutes)"><input type="number" min="0" value={value.durationMinutes ?? 0} onChange={(e) => setValue({ ...value, durationMinutes: Number(e.target.value) })} className="form-input" /></Field><PlayerField value={value.playerType ?? 'video'} onChange={(playerType) => setValue({ ...value, playerType })} /><Field label="Stream URL"><input value={value.streamUrl ?? ''} onChange={(e) => setValue({ ...value, streamUrl: e.target.value })} className="form-input" /></Field><Field label="Description"><textarea value={value.description ?? ''} onChange={(e) => setValue({ ...value, description: e.target.value })} className="form-input min-h-20" /></Field><AccessField value={value.accessLevel ?? 'free'} onChange={(accessLevel) => setValue({ ...value, accessLevel })} /><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Published</label><button className="w-full py-3 rounded-xl bg-white text-slate-950 font-black"><Save size={16} className="inline mr-2" /> Save</button></form>;
}

function PartForm({ value, setValue, films, onSave }: { value: MediaPart; setValue: (value: MediaPart) => void; films: MediaItem[]; onSave: () => Promise<void> }) {
  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSave(); }}><Field label="Film"><select value={value.mediaId} onChange={(e) => setValue({ ...value, mediaId: e.target.value })} className="form-input"><option value="">Select film</option>{films.map((film) => <option key={film.id} value={film.id}>{film.title}</option>)}</select></Field><Field label="Part number"><input type="number" min="1" value={value.partNumber} onChange={(e) => setValue({ ...value, partNumber: Number(e.target.value) })} className="form-input" /></Field><Field label="Title"><input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} className="form-input" /></Field><Field label="Duration (minutes)"><input type="number" min="0" value={value.durationMinutes ?? 0} onChange={(e) => setValue({ ...value, durationMinutes: Number(e.target.value) })} className="form-input" /></Field><PlayerField value={value.playerType ?? 'video'} onChange={(playerType) => setValue({ ...value, playerType })} /><Field label="Stream URL"><input value={value.streamUrl} onChange={(e) => setValue({ ...value, streamUrl: e.target.value })} className="form-input" /></Field><Field label="Description"><textarea value={value.description ?? ''} onChange={(e) => setValue({ ...value, description: e.target.value })} className="form-input min-h-20" /></Field><AccessField value={value.accessLevel ?? 'free'} onChange={(accessLevel) => setValue({ ...value, accessLevel })} /><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={value.enabled === true} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Published</label><button className="w-full py-3 rounded-xl bg-white text-slate-950 font-black"><Save size={16} className="inline mr-2" /> Save</button></form>;
}

function AdForm({ value, setValue, onSave }: { value: AdBanner; setValue: (value: AdBanner) => void; onSave: () => Promise<void> }) {
  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSave(); }}><Field label="Title"><input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} className="form-input" /></Field><UploadField label="Desktop image" value={value.image} onChange={(image) => setValue({ ...value, image })} folder="ads" /><UploadField label="Mobile image" value={value.mobileImage ?? ''} onChange={(mobileImage) => setValue({ ...value, mobileImage })} folder="ads" /><Field label="Link"><input value={value.link} onChange={(e) => setValue({ ...value, link: e.target.value })} className="form-input" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Placement"><select value={value.placement ?? 'banner'} onChange={(e) => setValue({ ...value, placement: e.target.value as AdBanner['placement'] })} className="form-input"><option value="banner">Banner</option><option value="popup">Popup</option><option value="inline">Inline</option></select></Field><Field label="Audience"><select value={value.audience ?? 'both'} onChange={(e) => setValue({ ...value, audience: e.target.value as AdAudience })} className="form-input"><option value="free">FREE</option><option value="vip">VIP</option><option value="both">BOTH</option></select></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Repeat seconds"><input type="number" min="5" value={value.repeatSeconds ?? 20} onChange={(e) => setValue({ ...value, repeatSeconds: Number(e.target.value) })} className="form-input" /></Field><Field label="Order"><input type="number" value={value.order} onChange={(e) => setValue({ ...value, order: Number(e.target.value) })} className="form-input" /></Field></div><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Active</label><button className="w-full py-3 rounded-xl bg-white text-slate-950 font-black"><Save size={16} className="inline mr-2" /> Save</button></form>;
}

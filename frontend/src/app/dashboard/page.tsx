'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { X } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [songForm, setSongForm] = useState({ title: '', artist: '', key: '', videoLessonUrl: '', lyrics: '', chords: '' });

  const [showUserMenu, setShowUserMenu] = useState(false);

  const router = useRouter();

  // close user menu when clicking outside (simple hack: just close it on main scroll or click)
  useEffect(() => {
    const handleGlobalClick = (e: any) => {
      if (!e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddSong(false);
        setShowCreateGroup(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchSongs = async (groupId: string, token: string) => {
    const songsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/songs`, {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        'Authorization': `Bearer ${token}`
      }
    });
    if (songsRes.ok) {
      setSongs(await songsRes.json());
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('worship_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [userRes, groupsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, {
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
              'Authorization': `Bearer ${token}`
            }
          })
        ]);
        
        if (userRes.ok && groupsRes.ok) {
          const userData = await userRes.json();
          const groupsData = await groupsRes.json();
          setUser(userData);
          setGroups(groupsData);

          if (groupsData.length > 0) {
            setActiveGroupId(groupsData[0].id);
            await fetchSongs(groupsData[0].id, token);
          }
        } else {
          localStorage.removeItem('worship_token');
          router.push('/login');
        }
      } catch (e) {
        localStorage.removeItem('worship_token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('worship_token');
    if (activeGroupId && token && !loading) {
      fetchSongs(activeGroupId, token);
    }
  }, [activeGroupId]);

  const handleLogout = () => {
    localStorage.removeItem('worship_token');
    router.push('/login');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    const token = localStorage.getItem('worship_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        const newGroup = await res.json();
        const groupWithCounts = { ...newGroup, _count: { members: 1, songs: 0, events: 0 } };
        setGroups([...groups, groupWithCounts]);
        setActiveGroupId(groupWithCounts.id);
        setShowCreateGroup(false);
        setNewGroupName('');
      } else {
        alert('Erro ao criar grupo');
      }
    } catch (err) {
      alert('Erro na conexão');
    }
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songForm.title.trim() || !activeGroupId) return;
    
    const token = localStorage.getItem('worship_token');
    const isEditing = !!selectedSong;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/songs/${selectedSong.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/songs`;

    try {
      const payload = {
        title: songForm.title,
        artist: songForm.artist || undefined,
        key: songForm.key || undefined,
        videoLessonUrl: songForm.videoLessonUrl || undefined,
        lyrics: songForm.lyrics || undefined,
        chords: songForm.chords || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSongs(activeGroupId, token!);
        setShowAddSong(false);
        setSelectedSong(null);
        setEditMode(false);
        setSongForm({ title: '', artist: '', key: '', videoLessonUrl: '', lyrics: '', chords: '' });
      } else {
        alert('Erro ao salvar música');
      }
    } catch (err) {
      alert('Erro na conexão');
    }
  };

  const openSongDetails = (song: any) => {
    setSelectedSong(song);
    setSongForm({
      title: song.title || '',
      artist: song.artist || '',
      key: song.key || '',
      videoLessonUrl: song.videoLessonUrl || '',
      lyrics: song.lyrics || '',
      chords: song.chords || ''
    });
    setEditMode(false);
    setShowAddSong(true);
  };

  const handleShareSong = (song: any) => {
    const text = `*Música:* ${song.title}\n*Artista:* ${song.artist || 'N/A'}\n*Tom:* ${song.key || 'N/A'}\n\n*Link:* ${song.videoLessonUrl || 'N/A'}\n\n*Letra:*\n${song.lyrics || 'N/A'}\n\n*Cifra:*\n${song.chords || 'N/A'}`;
    
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Informações copiadas para a área de transferência!');
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${label} copiada para a área de transferência!`);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  const activeGroup = activeGroupId ? groups.find(g => g.id === activeGroupId) : null;
  const userInitials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'WF';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors pb-12">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Worship Flow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle className="" />
              
              <div className="relative user-menu-container">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {userInitials}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Meus Ministérios</p>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {groups.map(g => (
                            <button 
                              key={g.id}
                              onClick={() => { setActiveGroupId(g.id); setShowUserMenu(false); }}
                              className={`flex items-center justify-between w-full text-left px-2 py-2 text-sm rounded-md transition-colors ${activeGroupId === g.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                              <span className="truncate">{g.name}</span>
                              {activeGroupId === g.id && <span className="text-blue-600 dark:text-blue-400 text-lg leading-none">&bull;</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <button 
                          onClick={() => { setShowCreateGroup(true); setShowUserMenu(false); }}
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          + Criar Novo Ministério
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <button 
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {!activeGroup ? (
            <div className="rounded-lg bg-white dark:bg-gray-800 p-12 text-center shadow">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Você ainda não faz parte de nenhum ministério</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Crie seu primeiro grupo para começar a adicionar membros, músicas e escalas.</p>
              
              {!showCreateGroup ? (
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-6 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
                >
                  Criar Ministério
                </button>
              ) : (
                <form onSubmit={handleCreateGroup} className="mt-6 mx-auto max-w-sm text-left">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Ministério</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                    placeholder="Ex: Ministério de Louvor"
                  />
                  <div className="mt-4 flex space-x-3">
                    <button type="submit" className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                      Criar
                    </button>
                    <button type="button" onClick={() => setShowCreateGroup(false)} className="w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeGroup.name}</h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Membros: {activeGroup._count.members}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximo Ensaio / Culto */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Próximo Evento</h2>
                  <div className="mt-4">
                    <p className="text-gray-500 dark:text-gray-400 italic">Nenhum evento agendado (Em Breve)</p>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ações Rápidas</h2>
                  <div className="mt-4 flex flex-col space-y-3">
                    <button className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                      + Nova Escala (Em Breve)
                    </button>
                    <button onClick={() => { setSelectedSong(null); setEditMode(true); setSongForm({ title: '', artist: '', key: '', videoLessonUrl: '', lyrics: '', chords: '' }); setShowAddSong(true); }} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                      + Adicionar Música
                    </button>
                    <button onClick={() => alert('Em breve: página de gestão de membros onde você poderá enviar convites por email!')} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                      Convidar Membros (Admin)
                    </button>
                  </div>
                </div>
              </div>

              {/* Repertório Geral */}
              <div className="mt-8 rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Repertório ({songs.length} músicas)</h2>
                  <button onClick={() => { setSelectedSong(null); setEditMode(true); setSongForm({ title: '', artist: '', key: '', videoLessonUrl: '', lyrics: '', chords: '' }); setShowAddSong(true); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    + Adicionar
                  </button>
                </div>
                
                {songs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma música cadastrada ainda.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {songs.map(song => (
                      <li key={song.id} className="py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-4 px-4 rounded transition-colors group cursor-pointer" onClick={() => openSongDetails(song)}>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{song.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {song.artist && <span>{song.artist} </span>}
                            {song.key && <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 ml-2">Tom: {song.key}</span>}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button onClick={(e) => { e.stopPropagation(); handleShareSong(song); }} className="text-sm text-gray-500 hover:text-green-600 dark:hover:text-green-400">
                            Compartilhar
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedSong(song); setSongForm({...song}); setEditMode(true); setShowAddSong(true); }} className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                            Editar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Adicionar/Editar/Detalhes Música */}
      {showAddSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowAddSong(false); }}>
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editMode ? (selectedSong ? 'Editar Música' : 'Adicionar Música') : 'Detalhes da Música'}
              </h3>
              <div className="flex items-center">
                {!editMode && (
                  <div className="flex items-center space-x-3 mr-4 border-r border-gray-200 dark:border-gray-700 pr-4">
                    <button onClick={() => handleShareSong(selectedSong)} className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline">
                      Compartilhar Tudo
                    </button>
                    <button onClick={() => setEditMode(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      Editar
                    </button>
                  </div>
                )}
                <button onClick={() => setShowAddSong(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {editMode ? (
              <form onSubmit={handleSaveSong} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                    <input
                      type="text"
                      required
                      value={songForm.title || ''}
                      onChange={(e) => setSongForm({...songForm, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Artista / Banda</label>
                    <input
                      type="text"
                      value={songForm.artist || ''}
                      onChange={(e) => setSongForm({...songForm, artist: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tom (Ex: C, Am, G#)</label>
                    <input
                      type="text"
                      value={songForm.key || ''}
                      onChange={(e) => setSongForm({...songForm, key: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do YouTube</label>
                    <input
                      type="url"
                      value={songForm.videoLessonUrl || ''}
                      onChange={(e) => setSongForm({...songForm, videoLessonUrl: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Letra</label>
                    <textarea
                      rows={8}
                      value={songForm.lyrics || ''}
                      onChange={(e) => setSongForm({...songForm, lyrics: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors font-mono"
                      placeholder="Cole aqui a letra da música..."
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cifra</label>
                    <textarea
                      rows={8}
                      value={songForm.chords || ''}
                      onChange={(e) => setSongForm({...songForm, chords: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors font-mono"
                      placeholder="Cole aqui a cifra..."
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => { if(selectedSong) { setEditMode(false) } else { setShowAddSong(false) } }} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                    Salvar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSong?.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedSong?.artist && <span>{selectedSong?.artist} • </span>}
                    {selectedSong?.key && <strong>Tom: {selectedSong?.key}</strong>}
                  </p>
                </div>
                
                {selectedSong?.videoLessonUrl && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Referência</h5>
                    <a href={selectedSong.videoLessonUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                      Assistir no YouTube
                    </a>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedSong?.lyrics && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Letra</h5>
                        <button onClick={() => handleCopyText(selectedSong.lyrics, 'Letra')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Copiar Letra</button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm whitespace-pre-wrap">{selectedSong.lyrics}</pre>
                      </div>
                    </div>
                  )}
                  {selectedSong?.chords && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cifra</h5>
                        <button onClick={() => handleCopyText(selectedSong.chords, 'Cifra')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Copiar Cifra</button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm whitespace-pre-wrap">{selectedSong.chords}</pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button type="button" onClick={() => setShowAddSong(false)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Criar Novo Ministério */}
      {showCreateGroup && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowCreateGroup(false); }}>
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Criar Novo Ministério</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Ministério</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  placeholder="Ex: Ministério de Louvor"
                />
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

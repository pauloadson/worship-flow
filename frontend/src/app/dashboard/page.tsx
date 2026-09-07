'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddSong, setShowAddSong] = useState(false);
  const [songForm, setSongForm] = useState({ title: '', artist: '', key: '', videoLessonUrl: '' });

  const router = useRouter();

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
            const songsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupsData[0].id}/songs`, {
              headers: {
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
                'Authorization': `Bearer ${token}`
              }
            });
            if (songsRes.ok) {
              setSongs(await songsRes.json());
            }
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
        setGroups([...groups, { ...newGroup, _count: { members: 1, songs: 0, events: 0 } }]);
        setShowCreateGroup(false);
        setNewGroupName('');
      } else {
        alert('Erro ao criar grupo');
      }
    } catch (err) {
      alert('Erro na conexão');
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songForm.title.trim() || groups.length === 0) return;
    
    const token = localStorage.getItem('worship_token');
    try {
      const payload = {
        title: songForm.title,
        artist: songForm.artist || undefined,
        key: songForm.key || undefined,
        videoLessonUrl: songForm.videoLessonUrl || undefined,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groups[0].id}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newSong = await res.json();
        setSongs([...songs, newSong].sort((a, b) => a.title.localeCompare(b.title)));
        setShowAddSong(false);
        setSongForm({ title: '', artist: '', key: '', videoLessonUrl: '' });
      } else {
        alert('Erro ao adicionar música');
      }
    } catch (err) {
      alert('Erro na conexão');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  const activeGroup = groups.length > 0 ? groups[0] : null;

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
              <span className="text-gray-700 dark:text-gray-300">Olá, {user?.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Sair</button>
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
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ministério: {activeGroup.name}</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">Membros: {activeGroup._count.members}</div>
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
                    <button onClick={() => setShowAddSong(true)} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
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
                  <button onClick={() => setShowAddSong(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    + Adicionar
                  </button>
                </div>
                
                {songs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma música cadastrada ainda.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {songs.map(song => (
                      <li key={song.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{song.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {song.artist && <span>{song.artist} </span>}
                            {song.key && <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 ml-2">Tom: {song.key}</span>}
                          </p>
                        </div>
                        {song.videoLessonUrl && (
                          <a href={song.videoLessonUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            Vídeo / YouTube
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Adicionar Música */}
      {showAddSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Adicionar Música</h3>
            <form onSubmit={handleAddSong} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                <input
                  type="text"
                  required
                  value={songForm.title}
                  onChange={(e) => setSongForm({...songForm, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Artista / Banda</label>
                <input
                  type="text"
                  value={songForm.artist}
                  onChange={(e) => setSongForm({...songForm, artist: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tom (Ex: C, Am, G#)</label>
                <input
                  type="text"
                  value={songForm.key}
                  onChange={(e) => setSongForm({...songForm, key: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do YouTube</label>
                <input
                  type="url"
                  value={songForm.videoLessonUrl}
                  onChange={(e) => setSongForm({...songForm, videoLessonUrl: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddSong(false)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

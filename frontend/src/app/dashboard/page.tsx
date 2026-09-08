'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { X } from 'lucide-react';

interface User {
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  _count: { members: number; songs: number; events: number };
}

interface Song {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  videoLessonUrl?: string;
  lyrics?: string;
  chords?: string;
}

interface EventSong {
  id: string;
  songId: string;
  order: number;
  song: Song;
}

interface EventRsvp {
  userId: string;
  status: string;
  role?: string;
  member: {
    user: {
      name: string;
    }
  }
}

interface EventData {
  id: string;
  title: string;
  date: string;
  eventType?: string;
  groupId: string;
  isVirtual?: boolean;
  rsvps: EventRsvp[];
  songs?: EventSong[];
}

interface Schedule {
  id: string;
  dayOfWeek: number;
  time: string;
  title: string;
  eventType?: string;
}

interface GroupMember {
  userId: string;
  isAdmin: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [songForm, setSongForm] = useState<Partial<Song>>({ title: '', artist: '', key: '', videoLessonUrl: '', lyrics: '', chords: '' });

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', date: '', eventType: 'Culto' });

  const [showConfigSchedule, setShowConfigSchedule] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 0, time: '19:30', title: '', eventType: 'Culto' });

  const [manageEventId, setManageEventId] = useState<string | null>(null);
  const manageEvent = events.find(e => e.id === manageEventId);

  const [shareEventId, setShareEventId] = useState<string | null>(null);
  const shareEvent = events.find(e => e.id === shareEventId);

  const [confirmPresenceEventId, setConfirmPresenceEventId] = useState<string | null>(null);
  const confirmPresenceEvent = events.find(e => e.id === confirmPresenceEventId);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'letra' | 'cifra'>('letra');
  const [mainTab, setMainTab] = useState<'repertorio' | 'eventos' | 'membros'>('repertorio');

  const router = useRouter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // close user menu when clicking outside (simple hack: just close it on main scroll or click)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.user-menu-container')) {
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
    
    // Configura a aba inicial e rolagem baseada na URL
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab === 'eventos' || urlTab === 'membros' || urlTab === 'musicas') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMainTab(urlTab);
    }
    const eventId = params.get('eventId');

    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
          }

          if (eventId) {
            setTimeout(() => {
              const el = document.getElementById(`event-${eventId}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 1000);
          }
        } else {
          localStorage.removeItem('worship_token');
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }
      } catch {
        localStorage.removeItem('worship_token');
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const fetchEvents = async (groupId: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/events`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch {
      showToast('Erro ao carregar eventos');
    }
  };

  const fetchSchedules = async (groupId: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/events/schedules`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSchedules(await res.json());
      }
    } catch {
      showToast('Erro ao carregar agendas');
    }
  };

  const fetchMembers = async (groupId: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/members`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch {
      showToast('Erro ao carregar membros');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('worship_token');
    if (activeGroupId && token && !loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSongs(activeGroupId, token);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEvents(activeGroupId, token);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSchedules(activeGroupId, token);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMembers(activeGroupId, token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId, loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEventId = params.get('eventId');
    const action = params.get('action');
    const urlGroupId = params.get('groupId');
    const token = localStorage.getItem('worship_token');

    if (action === 'join' && urlGroupId && token) {
      // Entrar automaticamente no grupo
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${urlGroupId}/join`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json()).then(data => {
        if (data) {
          showToast('Você entrou no ministério com sucesso!');
          window.history.replaceState({}, '', '/dashboard');
          window.location.reload();
        }
      }).catch(() => {
        showToast('Erro ao entrar no ministério.');
      });
    }

    if (urlEventId && events.length > 0) {
      const exists = events.find(e => e.id === urlEventId);
      if (exists) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConfirmPresenceEventId(urlEventId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  const handleLogout = () => {
    localStorage.removeItem('worship_token');
    router.push('/login');
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title || !scheduleForm.time || !activeGroupId) return;
    
    const token = localStorage.getItem('worship_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleForm)
      });
      if (res.ok) {
        setScheduleForm({ dayOfWeek: 0, time: '19:30', title: '', eventType: 'Culto' });
        if (token) {
          fetchSchedules(activeGroupId, token);
          fetchEvents(activeGroupId, token);
        }
        showToast('Agenda padrão adicionada com sucesso!');
      } else {
        showToast('Erro ao adicionar agenda padrão.');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover Agenda Padrão',
      message: 'Deseja realmente remover esta agenda padrão? Os eventos já agendados não serão afetados, mas os próximos não serão mais gerados.',
      onConfirm: async () => {
        setConfirmDialog(null);
        const token = localStorage.getItem('worship_token');
        if (!token || !activeGroupId) return;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            fetchSchedules(activeGroupId, token);
            fetchEvents(activeGroupId, token);
            showToast('Agenda removida com sucesso!');
          } else {
            showToast('Erro ao remover agenda.');
          }
        } catch {
          showToast('Erro na conexão');
        }
      }
    });
  };

  const handleDeleteEvent = async (eventId: string, isVirtual: boolean) => {
    if (isVirtual) {
      showToast('Este é um evento gerado automaticamente pela Agenda Padrão. Exclua a Agenda se não quiser mais ele.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Evento',
      message: 'Deseja realmente excluir este evento?',
      onConfirm: async () => {
        setConfirmDialog(null);
        const token = localStorage.getItem('worship_token');
        if (!token || !activeGroupId) return;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            fetchEvents(activeGroupId, token);
            showToast('Evento excluído com sucesso!');
          } else {
            showToast('Erro ao excluir evento.');
          }
        } catch {
          showToast('Erro na conexão');
        }
      }
    });
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !activeGroupId) return;
    
    const token = localStorage.getItem('worship_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        setShowAddEvent(false);
        setEventForm({ title: '', date: '', eventType: 'Culto' });
        if (token) fetchEvents(activeGroupId, token);
        showToast('Evento criado com sucesso!');
      } else {
        showToast('Erro ao criar evento. Apenas admins.');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberEmail || !activeGroupId) return;

    const token = localStorage.getItem('worship_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: addMemberEmail })
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowAddMember(false);
        setAddMemberEmail('');
        fetchMembers(activeGroupId, token as string);
        showToast('Membro adicionado com sucesso!');
      } else {
        showToast(data.message || 'Erro ao adicionar membro.');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const handleUpdateRole = async (eventId: string, userId: string, role: string) => {
    const token = localStorage.getItem('worship_token');
    if (!token || !activeGroupId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/${eventId}/rsvp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role, status: 'CONFIRMED' })
      });
      if (res.ok) {
        fetchEvents(activeGroupId, token);
        showToast('Função atualizada!');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const handleAssignSong = async (eventId: string, songId: string) => {
    const token = localStorage.getItem('worship_token');
    if (!token || !activeGroupId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/${eventId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songId })
      });
      if (res.ok) {
        fetchEvents(activeGroupId, token);
        showToast('Música adicionada!');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const handleRemoveSongFromEvent = async (eventId: string, songId: string) => {
    const token = localStorage.getItem('worship_token');
    if (!token || !activeGroupId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/${eventId}/songs/${songId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchEvents(activeGroupId, token);
        showToast('Música removida!');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const handleRsvp = async (eventId: string, status: string) => {
    const token = localStorage.getItem('worship_token');
    if (!token || !activeGroupId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${activeGroupId}/events/${eventId}/rsvp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchEvents(activeGroupId, token);
        showToast(status === 'CONFIRMED' ? 'Presença confirmada!' : 'Ausência sinalizada!');
      } else {
        showToast('Erro ao atualizar presença.');
      }
    } catch {
      showToast('Erro na conexão');
    }
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
        showToast('Erro ao criar grupo');
      }
    } catch {
      showToast('Erro na conexão');
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

    const cleanText = (text?: string) => {
      if (!text) return text;
      return text
        .replace(/">/g, '')          // Remove copy-paste artifacts from sites like Cifra Club
        .replace(/\t/g, '  ')        // Convert tabs to spaces to maintain alignment
        .split('\n')
        .map(line => line.trimEnd()) // Remove trailing spaces on each line
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')  // Reduce 3+ empty lines to max 2
        .trim();                     // Remove leading/trailing empty lines
    };

    try {
      const payload = {
        title: songForm.title,
        artist: songForm.artist || undefined,
        key: songForm.key || undefined,
        videoLessonUrl: songForm.videoLessonUrl || undefined,
        lyrics: cleanText(songForm.lyrics) || undefined,
        chords: cleanText(songForm.chords) || undefined,
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
        showToast('Erro ao salvar música');
      }
    } catch {
      showToast('Erro na conexão');
    }
  };

  const openSongDetails = (song: Song) => {
    setSelectedSong(song);
    setSongForm({
      title: song.title || '',
      artist: song.artist || '',
      key: song.key || '',
      videoLessonUrl: song.videoLessonUrl || '',
      lyrics: song.lyrics || '',
      chords: song.chords || ''
    });
    if (song.lyrics) setActiveTab('letra');
    else if (song.chords) setActiveTab('cifra');
    else setActiveTab('letra');
    setEditMode(false);
    setShowAddSong(true);
  };

  const handleShareSong = (song: Song | null) => {
    if (!song) return;
    const text = `*Música:* ${song.title}\n*Artista:* ${song.artist || 'N/A'}\n*Tom:* ${song.key || 'N/A'}\n\n*Link:* ${song.videoLessonUrl || 'N/A'}`;
    navigator.clipboard.writeText(text);
    showToast('Informações copiadas!');
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copiada!`);
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
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 pb-0 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeGroup.name}</h2>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Membros: {activeGroup._count.members}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setMainTab('repertorio')} className={`pb-4 text-sm font-medium transition-colors ${mainTab === 'repertorio' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Músicas</button>
                    <button onClick={() => setMainTab('eventos')} className={`pb-4 text-sm font-medium transition-colors ${mainTab === 'eventos' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Eventos & Escalas</button>
                    <button onClick={() => setMainTab('membros')} className={`pb-4 text-sm font-medium transition-colors ${mainTab === 'membros' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Membros</button>
                  </div>
                </div>
              </div>

              {mainTab === 'repertorio' && (
                <>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximo Ensaio / Culto */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Próximo Evento</h2>
                  <div className="mt-4">
                    {events.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{events[0].title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(events[0].date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                        <button onClick={() => {
                          setMainTab('eventos');
                          setTimeout(() => {
                            const el = document.getElementById(`event-${events[0].id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }} className="text-sm text-blue-600 hover:underline mt-2 text-left w-fit">
                          Ver Detalhes &rarr;
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">Nenhum evento agendado</p>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ações Rápidas</h2>
                  <div className="mt-4 flex flex-col space-y-3">
                    <button onClick={() => setMainTab('eventos')} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                      📅 Gerenciar Escalas
                    </button>
                    <button onClick={() => { setSelectedSong(null); setEditMode(true); setSongForm({ title: '', artist: '', key: '', videoLessonUrl: '', lyrics: '', chords: '' }); setShowAddSong(true); }} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                      🎵 Adicionar Música
                    </button>
                    <button onClick={() => { setMainTab('membros'); setShowAddMember(true); }} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                      👥 Convidar Membros
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

              {mainTab === 'eventos' && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-gray-900 dark:text-white">Eventos & Escalas</h2>
                    <div className="space-x-3">
                      <button onClick={() => setShowConfigSchedule(true)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        ⚙️ Configurar Agenda Padrão
                      </button>
                      <button onClick={() => setShowAddEvent(true)} className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                        + Evento Avulso
                      </button>
                    </div>
                  </div>
                  
                  {events.length === 0 ? (
                    <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow">
                      <p className="text-gray-500 dark:text-gray-400">Nenhum evento agendado.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {events.map((event) => {
                        const myStatus = event.rsvps.find(r => r.userId === user?.id)?.status || 'PENDING';
                        return (
                        <div key={event.id} id={`event-${event.id}`} className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                          <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })} • {event.eventType}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleRsvp(event.id, myStatus === 'CONFIRMED' ? 'PENDING' : 'CONFIRMED')} className={`rounded px-3 py-1 text-sm font-medium transition-colors ${myStatus === 'CONFIRMED' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>Confirmar</button>
                              <button onClick={() => handleRsvp(event.id, myStatus === 'DECLINED' ? 'PENDING' : 'DECLINED')} className={`rounded px-3 py-1 text-sm font-medium transition-colors ${myStatus === 'DECLINED' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>Ausente</button>
                              <button onClick={() => setManageEventId(event.id)} className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 px-3 py-1 text-sm font-medium transition-colors">⚙️ Escalar</button>
                              <button onClick={() => setShareEventId(event.id)} className="rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1 text-sm font-medium transition-colors">🔗 Enviar Link</button>
                              <button onClick={() => handleDeleteEvent(event.id, !!event.isVirtual)} className="rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-1 text-sm font-medium transition-colors">🗑️ Excluir</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Presenças Confirmadas ({event.rsvps.filter(r => r.status === 'CONFIRMED').length})</h4>
                              <div className="flex flex-col gap-2">
                                {event.rsvps.filter(r => r.status === 'CONFIRMED').map(r => (
                                  <div key={r.userId} className="flex items-center text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    <span className="font-medium text-green-800 dark:text-green-400">{r.member.user.name}</span>
                                    {r.role && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-200 text-green-900">{r.role}</span>}
                                  </div>
                                ))}
                                {event.rsvps.filter(r => r.status === 'CONFIRMED').length === 0 && (
                                  <span className="text-sm text-gray-500 italic">Ninguém confirmou ainda.</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repertório ({event.songs?.length || 0})</h4>
                              <div className="flex flex-col gap-2">
                                {event.songs?.map(es => (
                                  <div key={es.id} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex justify-between items-center">
                                    <span className="font-medium text-blue-800 dark:text-blue-400">{es.song.title}</span>
                                    <span className="text-xs text-blue-600 dark:text-blue-500">{es.song.artist}</span>
                                  </div>
                                ))}
                                {(!event.songs || event.songs.length === 0) && (
                                  <span className="text-sm text-gray-500 italic">Nenhuma música escalada.</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ausências ({event.rsvps.filter(r => r.status === 'DECLINED').length})</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.rsvps.filter(r => r.status === 'DECLINED').map(r => (
                                <span key={r.userId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {r.member.user.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {mainTab === 'membros' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow sm:p-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 dark:text-white">Membros do Ministério</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie a equipe e convoque músicos</p>
                    </div>
                    <button onClick={() => setShowAddMember(true)} className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                      + Adicionar Membro
                    </button>
                  </div>
                  
                  <div className="overflow-hidden bg-white dark:bg-gray-800 shadow rounded-lg">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {members.map(member => (
                        <li key={member.userId} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {member.user.name}
                              {member.isAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">ADMIN</span>
                              )}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</span>
                            {member.user.phone && <span className="text-xs text-gray-400 mt-1">📱 {member.user.phone}</span>}
                          </div>
                          <div>
                            {/* Futuramente: Ações como Remover ou Alterar Função */}
                          </div>
                        </li>
                      ))}
                      {members.length === 0 && (
                        <li className="p-8 text-center text-gray-500">Nenhum membro encontrado neste ministério.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Adicionar Membro */}
      {showAddMember && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowAddMember(false); }}>
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl text-center">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Convidar Membro</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Compartilhe o link abaixo. Se a pessoa ainda não tiver conta, ela será orientada a criar uma e entrará no ministério automaticamente!
            </p>

            <button 
              onClick={() => {
                const inviteUrl = `${window.location.origin}/dashboard?action=join&groupId=${activeGroup.id}`;
                navigator.clipboard.writeText(`Convite para o Worship Flow! Acesse o link para entrar no ministério: ${inviteUrl}`);
                showToast('Link de convite copiado!');
                setShowAddMember(false);
              }}
              className="w-full mb-2 flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Copiar Link de Convite
            </button>
          </div>
        </div>
      )}

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
                      Compartilhar
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
                      onChange={(e) => setSongForm({...songForm, lyrics: e.target.value.replace(/">/g, '').replace(/\t/g, '  ')})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors font-mono"
                      placeholder="Cole aqui a letra da música..."
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cifra</label>
                    <textarea
                      rows={8}
                      value={songForm.chords || ''}
                      onChange={(e) => setSongForm({...songForm, chords: e.target.value.replace(/">/g, '').replace(/\t/g, '  ')})}
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
                      Ouvir música
                    </a>
                  </div>
                )}
                
                {(selectedSong!.lyrics || selectedSong!.chords) && (
                  <div className="mt-6">
                    <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-4 pb-0">
                      {selectedSong!.lyrics && (
                        <button
                          onClick={() => setActiveTab('letra')}
                          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'letra' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-gray-800' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                          Mostrar Letra
                        </button>
                      )}
                      {selectedSong!.chords && (
                        <button
                          onClick={() => setActiveTab('cifra')}
                          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'cifra' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-gray-800' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                          Mostrar Cifra
                        </button>
                      )}
                    </div>
                    
                    {activeTab === 'letra' && selectedSong!.lyrics && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Letra</h4>
                          <button onClick={() => handleCopyText(selectedSong!.lyrics!, 'Letra')} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">Copiar Letra</button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">{selectedSong!.lyrics}</pre>
                      </div>
                    )}

                    {activeTab === 'cifra' && selectedSong!.chords && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Cifra</h4>
                          <button onClick={() => handleCopyText(selectedSong!.chords!, 'Cifra')} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">Copiar Cifra</button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedSong!.chords}</pre>
                      </div>
                    )}
                  </div>
                )}

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

      {/* Modal Agendar Evento */}
      {showAddEvent && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowAddEvent(false); }}>
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Agendar Evento / Escala</h3>
              <button onClick={() => setShowAddEvent(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Evento</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  placeholder="Ex: Culto de Domingo, Ensaio Geral"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data e Hora</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                  <select
                    value={eventForm.eventType}
                    onChange={(e) => setEventForm({...eventForm, eventType: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  >
                    <option value="Culto">Culto</option>
                    <option value="Ensaio">Ensaio</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowAddEvent(false)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Evento (Escalar) */}
      {manageEventId && manageEvent && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setManageEventId(null); }}>
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-4 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Escalar: {manageEvent.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(manageEvent.date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
              <button onClick={() => setManageEventId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
              {/* Escalar Músicas */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Repertório</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-2 mb-4 relative">
                    <input 
                      list="songsList"
                      id="songSearchInput"
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                      placeholder="Buscar e selecionar música..."
                    />
                    <datalist id="songsList">
                      {songs.filter(s => !manageEvent.songs?.find(es => es.songId === s.id)).map(s => (
                        <option key={s.id} value={`${s.title} ${s.artist ? `- ${s.artist}` : ''}`} />
                      ))}
                    </datalist>
                    <button 
                      onClick={() => {
                        const input = document.getElementById('songSearchInput') as HTMLInputElement;
                        const match = songs.find(s => `${s.title} ${s.artist ? `- ${s.artist}` : ''}` === input.value);
                        if (match) {
                          handleAssignSong(manageEvent.id, match.id);
                          input.value = '';
                        }
                      }}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Adicionar
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {manageEvent.songs?.map(es => (
                      <li key={es.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{es.song.title}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{es.song.artist}</span>
                        </div>
                        <button onClick={() => handleRemoveSongFromEvent(manageEvent.id, es.songId)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                          Remover
                        </button>
                      </li>
                    ))}
                    {(!manageEvent.songs || manageEvent.songs.length === 0) && (
                      <p className="text-sm text-gray-500 italic text-center py-2">Nenhuma música adicionada ao repertório ainda.</p>
                    )}
                  </ul>
                </div>
              </div>

              {/* Escalar Membros */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Escala de Membros</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Apenas membros que confirmaram presença podem ser escalados.</p>
                  
                  <ul className="space-y-3">
                    {manageEvent.rsvps.filter(r => r.status === 'CONFIRMED').map(r => (
                      <li key={r.userId} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 gap-3">
                        <span className="font-medium text-gray-900 dark:text-white">{r.member.user.name}</span>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Ex: Bateria, Vocal, Teclado..."
                            defaultValue={r.role || ''}
                            id={`role_${r.userId}`}
                            className="w-full sm:w-48 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-1.5 border transition-colors"
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById(`role_${r.userId}`) as HTMLInputElement;
                              handleUpdateRole(manageEvent.id, r.userId, input.value);
                            }}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            Salvar
                          </button>
                        </div>
                      </li>
                    ))}
                    {manageEvent.rsvps.filter(r => r.status === 'CONFIRMED').length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center py-2">Ninguém confirmou presença ainda.</p>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
              <button onClick={() => setManageEventId(null)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Pronto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Confirm Modal */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setConfirmDialog(null); }}>
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{confirmDialog.message}</p>
            <div className="flex space-x-3 justify-center">
              <button onClick={() => setConfirmDialog(null)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDialog.onConfirm} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Agenda Padrão */}
      {showConfigSchedule && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowConfigSchedule(false); }}>
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurar Agenda Padrão</h3>
              <button onClick={() => setShowConfigSchedule(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Adicione os dias e horários em que os eventos se repetem semanalmente. Eles aparecerão automaticamente na aba de Eventos!
            </p>

            <form onSubmit={handleSaveSchedule} className="space-y-4 mb-8 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Adicionar Novo Horário</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  placeholder="Ex: Culto da Família"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dia</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({...scheduleForm, dayOfWeek: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Segunda</option>
                    <option value={2}>Terça</option>
                    <option value={3}>Quarta</option>
                    <option value={4}>Quinta</option>
                    <option value={5}>Sexta</option>
                    <option value={6}>Sábado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Horário</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                  <select
                    value={scheduleForm.eventType}
                    onChange={(e) => setScheduleForm({...scheduleForm, eventType: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
                  >
                    <option value="Culto">Culto</option>
                    <option value="Ensaio">Ensaio</option>
                    <option value="Reunião">Reunião</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Adicionar
                </button>
              </div>
            </form>

            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Agendas Cadastradas</h4>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma agenda padrão cadastrada.</p>
            ) : (
              <ul className="space-y-3">
                {schedules.map(sched => (
                  <li key={sched.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm block">{sched.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][sched.dayOfWeek]} às {sched.time} • {sched.eventType}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteSchedule(sched.id)} className="text-red-500 hover:text-red-700 text-sm font-medium p-2">
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={() => setShowConfigSchedule(false)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enviar Link Evento */}
      {shareEventId && shareEvent && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShareEventId(null); }}>
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Convocar Participantes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{shareEvent.title}</p>
              </div>
              <button onClick={() => setShareEventId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Envie um lembrete para os membros confirmarem ou recusarem a presença neste evento.
            </p>

            <button 
              onClick={() => {
                const eventUrl = `${window.location.origin}/dashboard?tab=eventos&eventId=${shareEvent.id}`;
                const msg = `Olá! Gostaria de confirmar sua presença no ( *${shareEvent.title}*) que acontecerá no dia ${new Date(shareEvent.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.\nPor favor, acesse o link para confirmar: ${eventUrl}`;
                navigator.clipboard.writeText(msg);
                showToast('Mensagem e link copiados!');
              }}
              className="w-full mb-6 flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Copiar Mensagem
            </button>

            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Enviar no WhatsApp</h4>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
              {members.map(m => {
                const isConfirmed = shareEvent.rsvps.find(r => r.userId === m.userId)?.status === 'CONFIRMED';
                const isDeclined = shareEvent.rsvps.find(r => r.userId === m.userId)?.status === 'DECLINED';
                return (
                  <div key={m.userId} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white block">{m.user.name}</span>
                      {isConfirmed && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Já Confirmado</span>}
                      {isDeclined && <span className="text-xs text-red-600 dark:text-red-400 font-medium">Já Ausente</span>}
                    </div>
                    <button 
                      disabled={!m.user.phone}
                      onClick={() => {
                        if (m.user.phone) {
                          const eventUrl = `${window.location.origin}/dashboard?tab=eventos&eventId=${shareEvent.id}`;
                          const msg = encodeURIComponent(`Olá ${m.user.name.split(' ')[0]}! Gostaria de confirmar sua presença no ( *${shareEvent.title}*) que acontecerá no dia ${new Date(shareEvent.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.\nPor favor, acesse o link para confirmar: ${eventUrl}`);
                          window.open(`https://wa.me/${m.user.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                        }
                      }}
                      className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!m.user.phone ? "Usuário não possui telefone cadastrado" : ""}
                    >
                      WhatsApp
                    </button>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-2">Nenhum membro neste ministério.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Rápida */}
      {confirmPresenceEventId && confirmPresenceEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl text-center border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirmar Presença</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">Você estará presente no evento:</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1">{confirmPresenceEvent.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{new Date(confirmPresenceEvent.date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                await handleRsvp(confirmPresenceEvent.id, 'CONFIRMED');
                setConfirmPresenceEventId(null);
                window.history.replaceState({}, '', '/dashboard?tab=eventos');
              }} className="rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors">
                Sim, estarei presente
              </button>
              <button onClick={async () => {
                await handleRsvp(confirmPresenceEvent.id, 'DECLINED');
                setConfirmPresenceEventId(null);
                window.history.replaceState({}, '', '/dashboard?tab=eventos');
              }} className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors">
                Não poderei ir
              </button>
              <button onClick={() => {
                setConfirmPresenceEventId(null);
                window.history.replaceState({}, '', '/dashboard?tab=eventos');
              }} className="mt-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Responder depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-full shadow-lg font-medium text-sm transition-opacity duration-300 animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

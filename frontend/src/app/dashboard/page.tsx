'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  const activeGroup = groups.length > 0 ? groups[0] : null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
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
                    placeholder="Ex: Louvor IPB"
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
                <div className="text-sm text-gray-500 dark:text-gray-400">Membros: {activeGroup._count.members} | Músicas: {activeGroup._count.songs}</div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximo Ensaio / Culto */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Próximo Evento</h2>
                  <div className="mt-4">
                    <p className="text-gray-500 dark:text-gray-400 italic">Nenhum evento agendado (Em Breve)</p>
                  </div>
                </div>

                {/* Repertório da Semana */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Repertório da Semana</h2>
                  <div className="mt-4">
                    <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma música escalada (Em Breve)</p>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ações Rápidas</h2>
                  <div className="mt-4 flex flex-col space-y-3">
                    <button className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      + Nova Escala (Em Breve)
                    </button>
                    <button className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      + Adicionar Música (Em Breve)
                    </button>
                    <button onClick={() => alert('Em breve: página de gestão de membros onde você poderá enviar convites por email!')} className="rounded bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      Convidar Membros (Admin)
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

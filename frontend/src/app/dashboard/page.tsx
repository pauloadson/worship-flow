'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Worship Flow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {user?.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">Sair</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {!activeGroup ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <h2 className="text-2xl font-semibold text-gray-900">Você ainda não faz parte de nenhum ministério</h2>
              <p className="mt-2 text-gray-500">Crie seu primeiro grupo para começar a adicionar membros, músicas e escalas.</p>
              
              {!showCreateGroup ? (
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-6 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
                >
                  Criar Ministério
                </button>
              ) : (
                <form onSubmit={handleCreateGroup} className="mt-6 mx-auto max-w-sm text-left">
                  <label className="block text-sm font-medium text-gray-700">Nome do Ministério</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="Ex: Louvor IPB"
                  />
                  <div className="mt-4 flex space-x-3">
                    <button type="submit" className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Criar
                    </button>
                    <button type="button" onClick={() => setShowCreateGroup(false)} className="w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Ministério: {activeGroup.name}</h2>
                <div className="text-sm text-gray-500">Membros: {activeGroup._count.members} | Músicas: {activeGroup._count.songs}</div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximo Ensaio / Culto */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900">Próximo Evento</h2>
                  <div className="mt-4">
                    <p className="text-gray-500 italic">Nenhum evento agendado (Em Breve)</p>
                  </div>
                </div>

                {/* Repertório da Semana */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900">Repertório da Semana</h2>
                  <div className="mt-4">
                    <p className="text-gray-500 italic">Nenhuma música escalada (Em Breve)</p>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
                  <div className="mt-4 flex flex-col space-y-3">
                    <button className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                      + Nova Escala (Em Breve)
                    </button>
                    <button className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                      + Adicionar Música (Em Breve)
                    </button>
                    <button onClick={() => alert('Em breve: página de gestão de membros onde você poderá enviar convites por email!')} className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
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

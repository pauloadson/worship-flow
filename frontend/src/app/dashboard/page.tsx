'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Worship Flow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, Líder</span>
              <button className="text-sm text-red-600 hover:text-red-800">Sair</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Próximo Ensaio / Culto */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">Próximo Evento</h2>
              <div className="mt-4">
                <p className="text-2xl font-semibold text-blue-600">Culto de Domingo</p>
                <p className="text-sm text-gray-500">12/05/2027 às 18:00</p>
                <div className="mt-4 flex space-x-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    5 Confirmados
                  </span>
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    2 Pendentes
                  </span>
                </div>
              </div>
            </div>

            {/* Repertório da Semana */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">Repertório da Semana</h2>
              <ul className="mt-4 divide-y divide-gray-200">
                <li className="py-2 flex justify-between">
                  <span className="text-gray-800">1. Ousado Amor</span>
                  <span className="text-sm text-gray-500">G</span>
                </li>
                <li className="py-2 flex justify-between">
                  <span className="text-gray-800">2. Lindo És</span>
                  <span className="text-sm text-gray-500">A</span>
                </li>
                <li className="py-2 flex justify-between">
                  <span className="text-gray-800">3. A Ele a Glória</span>
                  <span className="text-sm text-gray-500">D</span>
                </li>
              </ul>
              <div className="mt-4">
                <Link href="/dashboard/repertoire" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Ver materiais completos &rarr;
                </Link>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
              <div className="mt-4 flex flex-col space-y-3">
                <button className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                  + Nova Escala
                </button>
                <button className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                  + Adicionar Música
                </button>
                <button className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                  Convidar Membros
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

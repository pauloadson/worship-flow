'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message;
        if (Array.isArray(errorMsg)) {
          errorMsg = errorMsg.join('. ');
        }
        throw new Error(errorMsg || 'Erro ao fazer login');
      }

      localStorage.setItem('worship_token', data.accessToken);
      
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro inesperado');
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 shadow rounded-lg">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Worship Flow
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Entre na sua conta para continuar
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded text-sm text-center transition-colors">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
              placeholder="E-mail"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border transition-colors"
              placeholder="Senha"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Entrar
          </button>
        </div>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 transition-colors">
      <ThemeToggle />
      <Suspense fallback={<div>Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

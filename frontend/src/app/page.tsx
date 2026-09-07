import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Worship Flow
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          A plataforma definitiva para gestão de ministérios de louvor e equipes musicais.
        </p>
        
        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Criar Conta
          </Link>
        </div>
      </div>
    </div>
  );
}

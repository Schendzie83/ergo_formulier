'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', {
        username,
        password
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Er is iets misgegaan');
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      {/* Hero / Header Section */}
      <div 
        className="relative h-64 bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
         <div className="absolute inset-0 bg-black/50"></div>
         <h1 className="relative z-10 text-4xl font-bold text-white">Docenten Inlog</h1>
      </div>

      <div className="flex-grow flex items-center justify-center -mt-10 z-20 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-100">
          <p className="text-gray-600 mb-6 text-center">Log in om formulieren te beheren.</p>
          {error && <p className="text-red-500 mb-4 text-center text-sm bg-red-50 p-2 rounded">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Gebruikersnaam</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-white p-3 rounded font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#E30613' }}
            >
              Inloggen
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-12 text-center border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-center gap-4 select-none">
            <img src="/zuyd-logo.png" alt="Zuyd Hogeschool Ergotherapie" className="h-16 w-auto" />
        </div>
      </div>
    </div>
  );
}

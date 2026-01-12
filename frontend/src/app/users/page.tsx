'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setUsername(localStorage.getItem('username') || '');
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = (password: string) => {
    // Simple check: minimal 8 characters
    if (password.length < 8) return false;
    return true;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername || !newPassword) {
        setError('Vul alle verplichte velden in');
        return;
    }

    if (!checkPasswordStrength(newPassword)) {
        setError('Wachtwoord moet minimaal 8 tekens lang zijn');
        return;
    }

    try {
      await api.post('/auth/register', {
        username: newUsername,
        password: newPassword,
        email: newEmail
      });
      
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewEmail('');
      fetchUsers();
      alert('Gebruiker succesvol aangemaakt!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kon gebruiker niet aanmaken');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;
    try {
        await api.delete(`/auth/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
        alert(err.response?.data?.error || 'Kon gebruiker niet verwijderen');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Hero / Header Section */}
       <div 
        className="relative h-64 bg-cover bg-center flex flex-col justify-end pb-8"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
         <div className="absolute inset-0 bg-black/50"></div>
         <div className="relative z-10 max-w-6xl mx-auto w-full px-8 flex justify-between items-end">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors" title="Terug naar Dashboard">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Users className="w-8 h-8" />
                        Gebruikersbeheer
                    </h1>
                    {username && <p className="text-white/80 ml-11">Ingelogd als: <span className="font-medium text-white">{username}</span></p>}
                </div>
            </div>
         </div>
      </div>

      <div className="flex-grow max-w-6xl mx-auto w-full px-8 py-12 -mt-10 relative z-20">
        
        {/* Actions Bar */}
        <div className="flex justify-end mb-6">
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#E30613' }}
            >
                <Plus className="w-4 h-4" />
                Nieuwe Gebruiker
            </button>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-800">Geregistreerde Docenten</h2>
            </div>
            
            {loading ? (
                <div className="p-12 text-center text-gray-500">Laden...</div>
            ) : (
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-medium">Gebruikersnaam</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Geregistreerd op</th>
                            <th className="px-6 py-4 font-medium text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-red-50/30 transition-colors group">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 text-[#E30613] rounded-full flex items-center justify-center text-sm font-bold uppercase ring-2 ring-white shadow-sm">
                                        {user.username.substring(0,2)}
                                    </div>
                                    {user.username}
                                </td>
                                <td className="px-6 py-4 text-gray-600">{user.email || '-'}</td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-gray-400 hover:text-[#E30613] transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                                        title="Verwijderen"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">Geen gebruikers gevonden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-12 text-center border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-center gap-4 select-none">
            <img src="/zuyd-logo.png" alt="Zuyd Hogeschool Ergotherapie" className="h-16 w-auto" />
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Nieuwe Gebruiker</h3>
                
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

                <form onSubmit={handleAddUser} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full rounded-lg border-gray-300 p-3 bg-gray-50 focus:bg-white focus:ring-[#E30613] focus:border-[#E30613] transition-colors outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full rounded-lg border-gray-300 p-3 bg-gray-50 focus:bg-white focus:ring-[#E30613] focus:border-[#E30613] transition-colors outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord <span className="text-red-500">*</span></label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-lg border-gray-300 p-3 bg-gray-50 focus:bg-white focus:ring-[#E30613] focus:border-[#E30613] transition-colors outline-none"
                            required
                            placeholder="Minimaal 8 tekens"
                        />
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button 
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                        >
                            Annuleren
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                            style={{ backgroundColor: '#E30613' }}
                        >
                            Toevoegen
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

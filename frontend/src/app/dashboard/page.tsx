'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, FileText, Trash2, Edit, Users, LogOut, Lock } from 'lucide-react';

interface Form {
  id: number;
  title: string;
  description: string;
  isPublic: boolean;
  isLocked: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setUsername(localStorage.getItem('username') || '');
    fetchForms();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const fetchForms = async () => {
    try {
      const res = await api.get('/forms');
      setForms(res.data);
    } catch (error) {
      console.error('Failed to fetch forms', error);
    } finally {
      setLoading(false);
    }
  };

  const createForm = async () => {
    const title = prompt('Enter form title:');
    if (!title) return;
    
    try {
      const res = await api.post('/forms', {
        title,
        description: 'New form description'
      });
      setForms([...forms, res.data]);
    } catch (error) {
      console.error('Failed to create form', error);
      alert('Failed to create form');
    }
  };

  const deleteForm = async (id: number) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      await api.delete(`/forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
    } catch (error) {
      console.error('Failed to delete form', error);
      alert('Dit formulier kon niet worden verwijderd (mogelijk beveiligd).');
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      {/* Hero / Header Section */}
      <div 
        className="relative h-64 bg-cover bg-center flex flex-col justify-end pb-8"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
         <div className="absolute inset-0 bg-black/50"></div>
         <div className="relative z-10 max-w-6xl mx-auto w-full px-8 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">Mijn Formulieren</h1>
                {username && <p className="text-white/80">Ingelogd als: <span className="font-medium text-white">{username}</span></p>}
            </div>
            <div className="flex gap-3">
                <Link 
                  href="/users"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Gebruikers
                </Link>
                <Link 
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Profiel
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Uitloggen
                </button>
            </div>
         </div>
      </div>

      <div className="flex-grow max-w-6xl mx-auto w-full px-8 py-12 -mt-10 relative z-20">
        {/* Actions Bar */}
        <div className="flex justify-end mb-6">
             <div className="flex gap-4">
                <Link 
                    href="/student"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow hover:text-red-600 transition-all border border-gray-100"
                >
                    <Users className="w-4 h-4" />
                    Student View
                </Link>
                <button 
                    onClick={createForm}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    style={{ backgroundColor: '#E30613' }}
                >
                    <Plus className="w-4 h-4" />
                    Create New Form
                </button>
             </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No forms yet</h3>
            <p className="text-gray-500 mb-4">Create your first form to get started.</p>
            <button 
                onClick={createForm}
                className="text-white px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#E30613' }}
            >
                Create Form
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
              <div key={form.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      href={`/builder/${form.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {form.isLocked ? (
                      <div className="p-2 text-gray-300 cursor-not-allowed" title="Dit formulier is beveiligd">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <button 
                        onClick={() => deleteForm(form.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">{form.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{form.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-100 pt-4">
                  <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {form.isPublic ? 'Public' : 'Draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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

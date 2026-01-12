'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FileText, ArrowRight } from 'lucide-react';

interface Form {
  id: number;
  title: string;
  description: string;
  isPublic: boolean;
}

export default function StudentDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await api.get('/forms');
      setForms(res.data.filter((f: Form) => f.isPublic));
    } catch (error) {
      console.error('Failed to fetch forms', error);
    } finally {
      setLoading(false);
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
         <div className="relative z-10 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Beschikbare Formulieren</h1>
            <p className="text-white/90 text-lg">Selecteer een formulier om te starten</p>
         </div>
      </div>

      <div className="flex-grow max-w-5xl mx-auto w-full px-6 py-12 -mt-10 relative z-20">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">Laden...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">Geen openbare formulieren beschikbaar</h3>
            <p className="text-gray-500 mt-2">Probeer het later opnieuw.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {forms.map(form => (
              <Link 
                key={form.id} 
                href={`/student/${form.id}`}
                className="group bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all flex items-center justify-between transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-xl transition-colors group-hover:bg-red-50" style={{ backgroundColor: '#fff5f5' }}>
                    <FileText className="w-8 h-8 transition-colors" style={{ color: '#E30613' }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">{form.title}</h3>
                    <p className="text-gray-600 leading-relaxed max-w-2xl">{form.description}</p>
                  </div>
                </div>
                <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                    <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-red-600 transition-colors" />
                </div>
              </Link>
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

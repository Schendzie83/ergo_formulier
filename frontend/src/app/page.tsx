import Link from 'next/link';
import { FileText, User } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <div 
        className="relative flex-grow flex items-center bg-cover bg-center min-h-[600px]"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl text-white space-y-8">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Genereer ergotherapeutische formulieren
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-95 leading-relaxed">
              Maak op basis van het beantwoorden van enkele vragen unieke formulieren die passend zijn bij uw cliënt.
            </p>

            <p className="text-base md:text-lg text-gray-200 mt-4 font-light italic">
              * Vanwege het laden van de database kan de wachttijd oplopen tot 1 minuut.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                href="/student" 
                className="inline-flex items-center px-6 py-3.5 text-white font-medium rounded shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#E30613' }}
              >
                <FileText className="mr-2 h-5 w-5" />
                Bekijk formulieren
              </Link>
              <Link 
                href="/login"
                className="inline-flex items-center px-6 py-3.5 text-white font-medium rounded shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#E30613' }}
              >
                <User className="mr-2 h-5 w-5" />
                Log in als administrator
              </Link> 
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Cooperation Section */}
      <div className="bg-white py-16 text-center border-t border-gray-100">
        <div className="flex items-center justify-center gap-4 select-none">
             <img src="/zuyd-logo.png" alt="Zuyd Hogeschool Ergotherapie" className="h-16 w-auto" />
        </div>
      </div>
    </div>
  );
}

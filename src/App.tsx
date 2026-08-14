/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<'login' | 'register' | 'user-dashboard' | 'admin-dashboard'>('login');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  // Dummy Dashboard state
  const [loading, setLoading] = useState(false);
  const EVENTS = [
    { id: 1, name: 'Konser Noah', date: '2026-05-15' },
    { id: 2, name: 'Sheila on 7 Live', date: '2026-06-20' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4 sm:p-8">
      <div className="w-full max-w-5xl h-auto min-h-[768px] bg-[#f8fafc] flex flex-col p-6 sm:p-8 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.02 11.02 0 00-2.396 12.23a11.954 11.954 0 0010.859 6.407a11.954 11.954 0 0010.858-6.407a11.02 11.02 0 00-2.396-12.23z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Secure-Q Ticketing System</h1>
              <p className="text-sm text-slate-500">Project Phase 1: Authentication & Setup</p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
          
          {/* Left Column: Architecture & Structure */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-4 shrink-0">
            {/* Database Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Backend Architecture</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">DB</div>
                  <span className="text-sm font-medium text-slate-700 font-mono">SQLite - local.db</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-mono"># users table</p>
                  <p className="text-xs text-slate-800 font-mono">id, role, username, pwd_hash, master_secret</p>
                  <p className="text-xs text-slate-500 font-mono mt-2"># tickets table</p>
                  <p className="text-xs text-slate-800 font-mono">id, user_id, event_id</p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    FastAPI Endpoints: /register, /login
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    FastAPI Endpoint: /buy_ticket
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Crypto: HMAC-SHA256 & ECDSA
                  </div>
                </div>
              </div>
            </div>

            {/* Folder Structure Card */}
            <div className="bg-slate-900 rounded-xl shadow-lg p-5 flex-1 min-h-[300px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Folder Structure</h3>
              <div className="code-block text-blue-300">
                ├── <span className="text-white font-bold">backend/</span><br />
                │   ├── main.py<br />
                │   ├── models.py<br />
                │   ├── database.py<br />
                │   └── requirements.txt<br />
                ├── <span className="text-white font-bold">mobile/</span><br />
                │   ├── src/<br />
                │   │   ├── screens/<br />
                │   │   │   ├── LoginScreen.tsx<br />
                │   │   │   ├── RegisterScreen.tsx<br />
                │   │   │   ├── UserDashboard.tsx<br />
                │   │   │   └── AdminDashboard.tsx<br />
                │   └── App.tsx
              </div>
            </div>
          </div>

          {/* Right Column: Mobile Mockup */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 rounded-3xl border border-dashed border-slate-300 p-8 min-h-[650px] relative shadow-inner">
            <div className="mobile-mockup">
              <div className="bezel"></div>
              <div className="pt-16 px-6 h-full flex flex-col overflow-y-auto pb-6">
                
                {/* Mobile Screen Header */}
                <div className="mb-8 shrink-0">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {activeScreen === 'login' && 'Welcome'}
                    {activeScreen === 'register' && 'Create Account'}
                    {activeScreen === 'user-dashboard' && 'Dashboard'}
                    {activeScreen === 'admin-dashboard' && 'Admin Panel'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {activeScreen === 'user-dashboard' || activeScreen === 'admin-dashboard' 
                      ? 'Secure E-Ticketing System'
                      : 'Secure E-Ticketing System'
                    }
                  </p>
                </div>

                {/* Mobile Screen Body */}
                <div className="space-y-4 shrink-0 flex-1">
                  
                  {(activeScreen === 'login' || activeScreen === 'register') && (
                    <>
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button 
                          onClick={() => setRole('user')}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'user' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                          Penonton
                        </button>
                        <button 
                          onClick={() => setRole('admin')}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                          Penyelenggara
                        </button>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Username</label>
                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Enter username" />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Password</label>
                        <input type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="••••••••" />
                      </div>

                      {activeScreen === 'register' && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Confirm Password</label>
                          <input type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="••••••••" />
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          if (role === 'admin') setActiveScreen('admin-dashboard');
                          else setActiveScreen('user-dashboard');
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm mt-4 shadow-lg shadow-blue-200 transition-colors"
                      >
                        {activeScreen === 'login' ? 'Login' : 'Register'}
                      </button>

                      <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                        <span className="text-slate-400">
                          {activeScreen === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                        </span>
                        <button 
                          onClick={() => setActiveScreen(activeScreen === 'login' ? 'register' : 'login')}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          {activeScreen === 'login' ? 'Daftar' : 'Login'}
                        </button>
                      </div>
                    </>
                  )}

                  {activeScreen === 'user-dashboard' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm">Daftar Event</h3>
                        <button onClick={() => setActiveScreen('login')} className="text-xs text-red-500 font-bold">Logout</button>
                      </div>
                      
                      {EVENTS.map(event => (
                        <div key={event.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <h4 className="font-bold text-slate-800">{event.name}</h4>
                          <p className="text-xs text-slate-500 mb-3">{event.date}</p>
                          <button 
                            onClick={() => {
                              setLoading(true);
                              setTimeout(() => {
                                setLoading(false);
                                alert('Tiket Berhasil Dibeli!\n(Menggunakan ECDSA & HMAC-SHA256)');
                              }, 1000);
                            }}
                            disabled={loading}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            {loading ? 'Memproses...' : 'Beli Tiket'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeScreen === 'admin-dashboard' && (
                    <div className="space-y-6 flex flex-col items-center pt-8">
                       <button onClick={() => setActiveScreen('login')} className="absolute top-[80px] right-6 text-xs text-red-500 font-bold">Logout</button>
                       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2 border border-slate-200">
                        <span className="text-2xl">🎟️</span>
                       </div>
                       <div className="text-center">
                         <h3 className="text-lg font-bold text-slate-800">Admin Org</h3>
                         <p className="text-sm text-slate-500">Penyelenggara</p>
                       </div>
                       
                       <div className="w-full bg-slate-900 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform">
                         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Terjual</p>
                         <p className="text-white text-4xl font-bold">142</p>
                         <p className="text-slate-400 text-[10px] mt-2">(dummy data)</p>
                       </div>
                    </div>
                  )}
                </div>

                {/* Mobile Tooling Footer */}
                <div className="mt-auto pt-6 flex flex-col items-center shrink-0">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                    </svg>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest text-center">SECURE DYNAMIC QR</p>
                </div>

              </div>
            </div>
            
            <p className="mt-6 text-slate-500 text-sm font-medium flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"></path>
              </svg> 
              Preview: React Native App Mockup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { searchSeniors, logAssistance } from '@/lib/actions/distribution';
import { Search, CheckCircle, User, AlertCircle, Clock, Gift, Users, ShieldCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

type Senior = {
  id: string;
  oscaId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  status: string;
  delegate?: {
    id: string;
    fullName: string;
    relationship: string;
  } | null;
};

type Program = {
  id: string;
  title: string;
  type: string;
};

type Transaction = {
  id: string;
  status: string;
  claimedAt: Date | null;
  senior: { firstName: string; lastName: string; oscaId: string };
  program: { title: string };
  claimedBy?: { fullName: string } | null;
};

export default function DistributionClient({ 
  programs, 
  initialTransactions 
}: { 
  programs: Program[];
  initialTransactions: Transaction[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Senior[]>([]);
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [recipientType, setRecipientType] = useState<'senior' | 'delegate'>('senior');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchSeniors(searchQuery);
        setSearchResults(results as Senior[]);
        setShowDropdown(true);
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSenior = (senior: Senior) => {
    setSelectedSenior(senior);
    setSearchQuery('');
    setShowDropdown(false);
    if (senior.delegate) {
      setRecipientType('senior');
    } else {
      setRecipientType('senior');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSenior || !selectedProgramId) return;

    setIsSubmitting(true);
    setNotification(null);

    const claimedById = recipientType === 'delegate' && selectedSenior.delegate ? selectedSenior.delegate.id : undefined;

    const result = await logAssistance({
      seniorId: selectedSenior.id,
      programId: selectedProgramId,
      claimedById,
    });

    if (result.success && result.claim) {
      setNotification({ type: 'success', message: 'Assistance logged successfully!' });
      
      // Update local transactions
      const newTransaction = {
        id: result.claim.id,
        status: result.claim.status,
        claimedAt: result.claim.claimedAt,
        senior: { 
          firstName: result.claim.senior.firstName, 
          lastName: result.claim.senior.lastName, 
          oscaId: result.claim.senior.oscaId 
        },
        program: { title: result.claim.program.title },
        claimedBy: result.claim.claimedBy ? { fullName: result.claim.claimedBy.fullName } : null,
      };
      
      setTransactions(prev => [newTransaction as Transaction, ...prev].slice(0, 10));
      
      // Reset form
      setSelectedSenior(null);
      setSelectedProgramId('');
      setRecipientType('senior');
      
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification({ type: 'error', message: result.error || 'Something went wrong.' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT PANEL - Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Gift className="w-5 h-5 mr-2 text-blue-600" />
              Log Benefit Distribution
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a senior citizen and the program to record assistance.
            </p>
          </div>

          <div className="p-6">
            {notification && (
              <div className={`mb-6 p-4 rounded-xl flex items-start ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {notification.message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Step 1: Select Senior */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">1. Select Beneficiary</label>
                
                {!selectedSenior ? (
                  <div className="relative" ref={searchRef}>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by OSCA ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm bg-gray-50 text-gray-900"
                      />
                      {isSearching && (
                        <div className="absolute right-3.5 top-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>

                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {searchResults.length > 0 ? (
                          <ul className="max-h-64 overflow-y-auto py-1">
                            {searchResults.map((senior) => (
                              <li 
                                key={senior.id}
                                onClick={() => handleSelectSenior(senior)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0 transition-colors"
                              >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden shrink-0 mr-4">
                                  {senior.photoUrl ? (
                                    <Image src={senior.photoUrl} alt="" width={40} height={40} className="object-cover w-full h-full" />
                                  ) : (
                                    <User className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{senior.lastName}, {senior.firstName}</p>
                                  <p className="text-xs text-gray-500">OSCA ID: {senior.oscaId}</p>
                                </div>
                                {senior.status === 'Active' ? (
                                  <span className="ml-auto inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                    Active
                                  </span>
                                ) : (
                                  <span className="ml-auto inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                    {senior.status}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : searchQuery.length >= 2 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No seniors found matching "{searchQuery}"</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="flex items-center relative z-10">
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden shrink-0 mr-4">
                        {selectedSenior.photoUrl ? (
                          <Image src={selectedSenior.photoUrl} alt="" width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-gray-900">{selectedSenior.lastName}, {selectedSenior.firstName}</p>
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Verified
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 font-medium">OSCA ID: {selectedSenior.oscaId}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedSenior(null)}
                      className="relative z-10 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm transition-all hover:shadow"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Select Program */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">2. Select Assistance / Program</label>
                <div className="relative">
                  <select
                    required
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    disabled={!selectedSenior}
                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm bg-gray-50 text-gray-900 disabled:opacity-50 disabled:bg-gray-100 transition-all font-medium"
                  >
                    <option value="" disabled>Choose a program...</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.type})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Step 3: Recipient Type */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">3. Claimed By</label>
                <div className={`grid grid-cols-2 gap-4 ${!selectedSenior ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${recipientType === 'senior' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="recipient" value="senior" checked={recipientType === 'senior'} onChange={() => setRecipientType('senior')} className="sr-only" />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Beneficiary (Self)</span>
                        <span className="mt-1 flex items-center text-xs text-gray-500">
                          <User className="mr-1.5 h-3.5 w-3.5" /> Present in person
                        </span>
                      </span>
                    </span>
                    <CheckCircle className={`h-5 w-5 ${recipientType === 'senior' ? 'text-blue-600' : 'text-transparent'}`} />
                  </label>

                  <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${recipientType === 'delegate' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-300 bg-white hover:bg-gray-50'} ${!selectedSenior?.delegate ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="radio" name="recipient" value="delegate" disabled={!selectedSenior?.delegate} checked={recipientType === 'delegate'} onChange={() => setRecipientType('delegate')} className="sr-only" />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Authorized Delegate</span>
                        <span className="mt-1 flex items-center text-xs text-gray-500">
                          <Users className="mr-1.5 h-3.5 w-3.5" /> 
                          {selectedSenior?.delegate ? selectedSenior.delegate.fullName : 'No delegate registered'}
                        </span>
                      </span>
                    </span>
                    <CheckCircle className={`h-5 w-5 ${recipientType === 'delegate' ? 'text-blue-600' : 'text-transparent'}`} />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={!selectedSenior || !selectedProgramId || isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-blue-500/30"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Log Distribution Record
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Recent Transactions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              Recent Logs
            </h2>
          </div>
          
          <div className="p-0 flex-1 overflow-y-auto bg-gray-50/30">
            {transactions.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No recent transactions today.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <li key={t.id} className="p-5 hover:bg-white transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {t.senior.firstName} {t.senior.lastName}
                        </p>
                        <p className="text-xs font-medium text-blue-600 mt-0.5 truncate">
                          {t.program.title}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-gray-500 flex items-center">
                            {t.claimedBy ? (
                              <><Users className="w-3 h-3 mr-1" /> Delegate</>
                            ) : (
                              <><User className="w-3 h-3 mr-1" /> Self</>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {t.claimedAt ? format(new Date(t.claimedAt), 'hh:mm a') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-white text-center">
            <a href="/admin/claims" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              View Full Ledger &rarr;
            </a>
          </div>
        </div>
      </div>
      
    </div>
  );
}

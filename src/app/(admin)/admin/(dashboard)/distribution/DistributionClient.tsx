'use client';

import { useState, useEffect, useRef } from 'react';
import { searchSeniors, logAssistanceBatch, getBarangays, getSeniorsByBarangay } from '@/lib/actions/distribution';
import { Search, CheckCircle, User, AlertCircle, Clock, Gift, FileText, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const [selectedSeniors, setSelectedSeniors] = useState<Senior[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [barangays, setBarangays] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [isLoadingBarangay, setIsLoadingBarangay] = useState(false);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    getBarangays().then(setBarangays);
  }, []);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

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
    if (!selectedSeniors.some(s => s.id === senior.id)) {
      setSelectedSeniors(prev => [...prev, senior]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveSenior = (id: string) => {
    setSelectedSeniors(prev => prev.filter(s => s.id !== id));
  };

  const handleBarangayFilter = async (barangay: string) => {
    if (!barangay) return;
    setIsLoadingBarangay(true);
    const seniorsInBarangay = await getSeniorsByBarangay(barangay);

    const newSeniors = seniorsInBarangay.filter(
      (newSen: any) => !selectedSeniors.some(s => s.id === newSen.id)
    );

    if (newSeniors.length > 0) {
      setSelectedSeniors(prev => [...prev, ...newSeniors]);
      setNotification({ type: 'success', message: `Added ${newSeniors.length} seniors from ${barangay}.` });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: 'success', message: `All seniors from ${barangay} are already added.` });
      setTimeout(() => setNotification(null), 3000);
    }

    setIsLoadingBarangay(false);
    setSelectedBarangay('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeniors.length === 0 || !selectedProgramId) return;

    setIsSubmitting(true);
    setNotification(null);

    const result = await logAssistanceBatch({
      seniorIds: selectedSeniors.map(s => s.id),
      programId: selectedProgramId,
    });

    if (result.success) {
      setNotification({ type: 'success', message: `Successfully logged benefit distribution for ${result.count} senior citizen${result.count !== 1 ? 's' : ''}.` });

      setSelectedSeniors([]);
      setSelectedProgramId('');

      router.refresh();
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
          <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-green-600" />
                Select All
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select multiple seniors or filter by barangay to record assistance.
              </p>
            </div>

            {/* Quick Filter by Barangay */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedBarangay}
                onChange={(e) => handleBarangayFilter(e.target.value)}
                disabled={isLoadingBarangay}
                className="text-sm border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 py-1.5 px-3 bg-white disabled:opacity-50"
              >
                <option value="">Filter by Barangay</option>
                {barangays.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {isLoadingBarangay && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>}
            </div>
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
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-900">1. Select Beneficiaries</label>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                    {selectedSeniors.length} Selected
                  </span>
                </div>

                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by OSCA ID or Name to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm bg-gray-50 text-gray-900"
                    />
                    {isSearching && (
                      <div className="absolute right-3.5 top-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      </div>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                      {searchResults.length > 0 ? (
                        <ul className="max-h-64 overflow-y-auto py-1">
                          {searchResults.map((senior) => {
                            const isSelected = selectedSeniors.some(s => s.id === senior.id);
                            return (
                              <li
                                key={senior.id}
                                onClick={() => !isSelected && handleSelectSenior(senior)}
                                className={`px-4 py-3 flex items-center border-b border-gray-50 last:border-0 transition-colors ${isSelected ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'hover:bg-green-50 cursor-pointer'}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden shrink-0 mr-4">
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
                                {isSelected && (
                                  <span className="ml-auto flex items-center text-xs font-medium text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" /> Added
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : searchQuery.length >= 2 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No seniors found matching "{searchQuery}"</div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Selected Badges */}
                {selectedSeniors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
                    {selectedSeniors.map(senior => (
                      <div key={senior.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-3 pr-1 py-1 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{senior.firstName} {senior.lastName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSenior(senior.id)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
                    disabled={selectedSeniors.length === 0}
                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none shadow-sm bg-gray-50 text-gray-900 disabled:opacity-50 disabled:bg-gray-100 transition-all font-medium"
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

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={selectedSeniors.length === 0 || !selectedProgramId || isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-green-500/30"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing {selectedSeniors.length} Record{selectedSeniors.length !== 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Log Distribution for {selectedSeniors.length} Senior{selectedSeniors.length !== 1 ? 's' : ''}
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
                        <p className="text-xs font-medium text-green-600 mt-0.5 truncate">
                          {t.program.title}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-gray-500 flex items-center">
                            Logged
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
            <a href="/admin/claims" className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
              View Full Ledger &rarr;
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

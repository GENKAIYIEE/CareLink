'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  searchSeniors,
  logAssistanceBatch,
  getBarangays,
  getSeniorsByBarangay,
} from '@/lib/actions/distribution';
import { BarangayCombobox } from '@/components/shared/BarangayCombobox';
import { getSeniorByOscaId } from '@/actions/admin/getSeniorByOscaId';
import {
  Search,
  CheckCircle,
  CheckCircle2,
  User,
  AlertCircle,
  Clock,
  Gift,
  FileText,
  ScanFace,
  Loader2,
  Camera,
  X,
  Filter,
  XCircle,
  TriangleAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { loadFaceApiModels, getFaceDescriptor, areFaceApiModelsLoaded } from '@/lib/faceApi';
import { supabase } from '@/lib/supabase';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type Senior = {
  id: string;
  oscaId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  status: string;
  barangay?: string | null;
  delegate?: { id: string; fullName: string; relationship: string } | null;
};

type Program = { id: string; title: string; type: string };

type Transaction = {
  id: string;
  status: string;
  claimedAt: Date | null;
  senior: { firstName: string; lastName: string; oscaId: string };
  program: { title: string };
  claimedBy?: { fullName: string } | null;
};

type ScanState = 'idle' | 'loading_models' | 'ready' | 'scanning' | 'success' | 'no_face' | 'no_match' | 'error';
type RightTab = 'scanner' | 'logs';

// ─── ProgramDropdown sub-component ──────────────────────────────────────────

function ProgramDropdown({
  programs,
  value,
  onChange,
  disabled,
}: {
  programs: Program[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedProgram = programs.find((p) => p.id === value) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-900">2. Select Assistance / Program</label>
      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between pl-4 pr-4 py-3 rounded-xl border transition-all outline-none font-medium text-sm ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
              : 'bg-white border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 shadow-sm'
          }`}
        >
          {selectedProgram ? (
            <span className="truncate">{selectedProgram.title} ({selectedProgram.type})</span>
          ) : (
            <span className="text-gray-500">Choose a program...</span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {programs.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No programs available.</div>
            ) : (
              <ul className="max-h-[250px] overflow-y-auto py-1.5 px-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {programs.map((p) => {
                  const isSelected = p.id === value;
                  return (
                    <li
                      key={p.id}
                      onClick={() => { onChange(p.id); setIsOpen(false); }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                        isSelected
                          ? 'bg-green-50 text-green-700 font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate">{p.title} ({p.type})</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-green-600 ml-auto shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DistributionClient({
  programs,
  initialTransactions,
}: {
  programs: Program[];
  initialTransactions: Transaction[];
}) {
  // ── Left panel state (original bulk selection) ──────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Senior[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSeniors, setSelectedSeniors] = useState<Senior[]>([]);
  const selectedIdsSet = useMemo(() => new Set(selectedSeniors.map((s) => s.id)), [selectedSeniors]);
  // Track how each senior was added: 'face' | 'manual'
  const [verificationMethods, setVerificationMethods] = useState<Record<string, 'face' | 'manual'>>({});

  // ── Selected list view controls (search & pagination) ───────────────────
  const [selectedListSearch, setSelectedListSearch] = useState('');
  const [selectedListPage, setSelectedListPage] = useState(1);
  const SELECTED_PAGE_SIZE = 10;

  const uniqueBarangaysCount = useMemo(
    () => new Set(selectedSeniors.map((s) => s.barangay).filter(Boolean)).size,
    [selectedSeniors]
  );

  const filteredSelectedSeniors = useMemo(() => {
    if (!selectedListSearch.trim()) return selectedSeniors;
    const q = selectedListSearch.toLowerCase().trim();
    return selectedSeniors.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.oscaId.toLowerCase().includes(q) ||
        (s.barangay && s.barangay.toLowerCase().includes(q))
    );
  }, [selectedSeniors, selectedListSearch]);

  const totalSelectedPages = Math.ceil(filteredSelectedSeniors.length / SELECTED_PAGE_SIZE) || 1;

  const paginatedSelectedSeniors = useMemo(() => {
    const start = (selectedListPage - 1) * SELECTED_PAGE_SIZE;
    return filteredSelectedSeniors.slice(start, start + SELECTED_PAGE_SIZE);
  }, [filteredSelectedSeniors, selectedListPage]);

  useEffect(() => {
    if (selectedListPage > totalSelectedPages && totalSelectedPages > 0) {
      setSelectedListPage(totalSelectedPages);
    }
  }, [totalSelectedPages, selectedListPage]);

  const [barangays, setBarangays] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [isLoadingBarangay, setIsLoadingBarangay] = useState(false);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Right panel (tabs + scanner) state ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<RightTab>('scanner');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedSenior, setScannedSenior] = useState<Senior | null>(null);
  const [addedConfirmation, setAddedConfirmation] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    getBarangays().then(setBarangays);
    // PERF FIX: Pre-load face-api models in the background as soon as the page
    // mounts. loadFaceApiModels() is idempotent, so this is safe to call even
    // if the scanner toggle is never activated. It hides the 12+ MB download
    // latency from the user so the scanner is ready the moment they need it.
    loadFaceApiModels().catch((err) =>
      console.warn("Background face model pre-load failed:", err)
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setTransactions(initialTransactions), 0);
    return () => clearTimeout(timer);
  }, [initialTransactions]);

  // Click-outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(async () => {
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
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load face-api models when scanner turns on
  useEffect(() => {
    let cancelled = false;
    if (scannerActive) {
      setScanError(null);
      setScannedSenior(null);

      // KEY FIX: If models are already loaded in memory (from the background
      // pre-load on mount), skip the loading UI entirely and go straight to ready.
      if (areFaceApiModelsLoaded()) {
        setScanState('ready');
        return;
      }

      // Models not yet loaded — show spinner and load now
      setScanState('loading_models');
      loadFaceApiModels()
        .then(() => {
          if (!cancelled) setScanState('ready');
        })
        .catch((err) => {
          console.error('Failed to load face-api models:', err);
          if (!cancelled) {
            setScanState('error');
            setScanError('Failed to load face recognition models. Please refresh the page.');
          }
        });
    } else {
      // Stop webcam stream
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setScanState('idle');
      setScannedSenior(null);
      setScanError(null);
    }
    return () => {
      cancelled = true;
    };
  }, [scannerActive]);

  // ── Left panel handlers ────────────────────────────────────────────────

  const handleSelectSenior = (senior: Senior) => {
    if (!selectedIdsSet.has(senior.id)) {
      setSelectedSeniors((prev) => [...prev, senior]);
      setVerificationMethods((prev) => ({ ...prev, [senior.id]: 'manual' }));
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveSenior = (id: string) => {
    setSelectedSeniors((prev) => prev.filter((s) => s.id !== id));
    setVerificationMethods((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleBarangayFilter = async (barangay: string) => {
    if (!barangay) return;
    setIsLoadingBarangay(true);
    try {
      const seniorsInBarangay = await getSeniorsByBarangay(barangay);
      const currentSelectedIds = new Set(selectedSeniors.map((s) => s.id));
      const newSeniors = seniorsInBarangay
        .filter((newSen) => !currentSelectedIds.has(newSen.id))
        .map((sen) => ({ ...sen, photoUrl: null }));
      const isAll = barangay === 'ALL' || barangay === 'All Barangays';
      const label = isAll ? 'all barangays' : `Barangay ${barangay}`;

      if (newSeniors.length > 0) {
        setSelectedSeniors((prev) => [...prev, ...newSeniors]);
        const methods: Record<string, 'face' | 'manual'> = {};
        newSeniors.forEach((s) => { methods[s.id] = 'manual'; });
        setVerificationMethods((prev) => ({ ...prev, ...methods }));
        setNotification({ type: 'success', message: `Added ${newSeniors.length} seniors from ${label}.` });
      } else {
        setNotification({ type: 'success', message: `All eligible seniors from ${label} are already added.` });
      }
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error("Error filtering seniors by barangay:", err);
      setNotification({ type: 'error', message: 'Failed to fetch beneficiaries for selected barangay.' });
    } finally {
      setIsLoadingBarangay(false);
      setSelectedBarangay('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeniors.length === 0 || !selectedProgramId) return;

    setIsSubmitting(true);
    setNotification(null);

    const result = await logAssistanceBatch({
      seniorIds: selectedSeniors.map((s) => s.id),
      programId: selectedProgramId,
      seniorVerificationMethods: verificationMethods,
    });

    if (result.success) {
      const count = result.count ?? 0;
      const alreadyClaimedCount = selectedSeniors.length - count;
      let msg = `Successfully logged benefit distribution for ${count} senior citizen${count !== 1 ? 's' : ''}.`;
      if (alreadyClaimedCount > 0) {
        msg += ` (${alreadyClaimedCount} already claimed previously and were skipped).`;
      }
      setNotification({
        type: 'success',
        message: msg,
      });
      toast.success(msg);
      setSelectedSeniors([]);
      setSelectedProgramId('');
      setVerificationMethods({});
      setSelectedListSearch('');
      setSelectedListPage(1);
      router.refresh();
      setTimeout(() => setNotification(null), 5000);
    } else {
      const err = result.error || 'Something went wrong.';
      setNotification({ type: 'error', message: err });
      toast.error(err);
    }

    setIsSubmitting(false);
  };

  // ── Right panel / scanner handlers ────────────────────────────────────

  const handleScan = useCallback(async () => {
    if (!webcamRef.current) return;
    setScanState('scanning');
    setScanError(null);
    setScannedSenior(null);

    try {
      const video = webcamRef.current.video;
      if (!video) {
        setScanState('error');
        setScanError('Webcam not ready. Please wait and try again.');
        return;
      }

      const descriptor = await getFaceDescriptor(video);
      if (!descriptor) {
        setScanState('no_face');
        return;
      }

      const { data, error } = await supabase.rpc('match_face', {
        query_embedding: Array.from(descriptor),
        match_threshold: 0.6,
        match_count: 1,
      });

      if (error) {
        console.error("Supabase RPC error:", error);
      }

      if (error || !data || data.length === 0) {
        setScanState('no_match');
        return;
      }

      const senior = await getSeniorByOscaId(data[0].oscaId);
      if (!senior) {
        setScanState('no_match');
        return;
      }

      setScannedSenior(senior as Senior);
      setScanState('success');
    } catch (err) {
      console.error('Scan error:', err);
      setScanState('error');
      setScanError('An unexpected error occurred. Please try again.');
    }
  }, []);

  const handleAddToSelection = () => {
    if (!scannedSenior) return;
    if (!selectedSeniors.some((s) => s.id === scannedSenior.id)) {
      setSelectedSeniors((prev) => [...prev, scannedSenior]);
      setVerificationMethods((prev) => ({ ...prev, [scannedSenior.id]: 'face' }));
    }
    setAddedConfirmation(true);
    setTimeout(() => {
      setAddedConfirmation(false);
      setScannedSenior(null);
      setScanState('ready');
      setScanError(null);
    }, 2000);
  };

  const handleResetScanner = () => {
    setScannedSenior(null);
    setScanState('ready');
    setScanError(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <LiveUpdate interval={10000} />

      {/* ── LEFT PANEL ── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-green-600" />
                Select Beneficiaries
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select multiple seniors or filter by barangay to record assistance.
              </p>
            </div>

            {/* Quick Filter by Barangay */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <BarangayCombobox
                value={selectedBarangay}
                onChange={handleBarangayFilter}
                disabled={isLoadingBarangay}
                placeholder="Filter by Barangay"
                inputClassName="text-sm py-1.5 px-3"
                className="w-60"
                includeAllOption={true}
                allOptionLabel="All Barangays"
              />
              {isLoadingBarangay && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 shrink-0" />
              )}
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

              {/* Step 1: Select Beneficiaries */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-900">1. Select Beneficiaries</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                      {selectedSeniors.length} Selected
                    </span>
                    {selectedSeniors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeniors([]);
                          setVerificationMethods({});
                          setSelectedListSearch('');
                          setSelectedListPage(1);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Search combobox */}
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
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                      </div>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                      {searchResults.length > 0 ? (
                        <ul className="max-h-64 overflow-y-auto py-1">
                          {searchResults.map((senior) => {
                            const isSelected = selectedIdsSet.has(senior.id);
                            return (
                              <li
                                key={senior.id}
                                onClick={() => !isSelected && handleSelectSenior(senior)}
                                className={`px-4 py-3 flex items-center border-b border-gray-50 last:border-0 transition-colors ${isSelected ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'hover:bg-green-50 cursor-pointer'}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden shrink-0 mr-4">
                                  {senior.photoUrl ? (
                                    <img src={senior.photoUrl} alt="" className="object-cover w-full h-full" />
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
                        <div className="p-4 text-center text-sm text-gray-500">No seniors found matching &quot;{searchQuery}&quot;</div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Professional Selected Beneficiaries List / Table */}
                {selectedSeniors.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    {/* List Toolbar / Header */}
                    <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Selected Beneficiaries
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-[#006b2c]">
                          {selectedSeniors.length} {selectedSeniors.length === 1 ? 'senior' : 'seniors'}
                        </span>
                        {uniqueBarangaysCount > 1 && (
                          <span className="text-xs text-gray-400 hidden sm:inline">
                            • {uniqueBarangaysCount} barangays
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {selectedSeniors.length > 5 && (
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Filter selected..."
                              value={selectedListSearch}
                              onChange={(e) => {
                                setSelectedListSearch(e.target.value);
                                setSelectedListPage(1);
                              }}
                              className="pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 w-36 sm:w-48 text-gray-800 shadow-2xs"
                            />
                            {selectedListSearch && (
                              <button
                                type="button"
                                onClick={() => setSelectedListSearch('')}
                                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeniors([]);
                            setVerificationMethods({});
                            setSelectedListSearch('');
                            setSelectedListPage(1);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium transition-colors border border-transparent hover:border-red-100 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Clean Table View with Smooth Scroll */}
                    <div className="overflow-x-auto max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 text-[11px] font-bold text-gray-500 border-b border-gray-200 uppercase tracking-wider shadow-2xs">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-3">Beneficiary</th>
                            <th className="py-2.5 px-3">Barangay</th>
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3 text-right w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {paginatedSelectedSeniors.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                                No selected beneficiaries match &quot;{selectedListSearch}&quot;
                              </td>
                            </tr>
                          ) : (
                            paginatedSelectedSeniors.map((senior, idx) => {
                              const globalIndex = (selectedListPage - 1) * SELECTED_PAGE_SIZE + idx + 1;
                              const isFace = verificationMethods[senior.id] === 'face';
                              return (
                                <tr
                                  key={senior.id}
                                  className="hover:bg-green-50/50 transition-colors group"
                                >
                                  <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-400">
                                    {globalIndex}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-green-100 text-[#006b2c] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-green-200/50">
                                        {senior.photoUrl ? (
                                          <img src={senior.photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <span>{senior.firstName[0]}{senior.lastName[0]}</span>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-xs truncate leading-tight">
                                          {senior.lastName}, {senior.firstName}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-mono leading-tight">
                                          OSCA ID: {senior.oscaId}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
                                      {senior.barangay || '—'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {isFace ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#006b2c] border border-emerald-200/70">
                                        <ScanFace className="w-3 h-3 text-[#006b2c]" /> Face Verified
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200/60">
                                        Manual
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSenior(senior.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Remove from selection"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer with Pagination Controls */}
                    {filteredSelectedSeniors.length > SELECTED_PAGE_SIZE && (
                      <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Showing{' '}
                          <strong className="text-gray-700 font-semibold">
                            {(selectedListPage - 1) * SELECTED_PAGE_SIZE + 1}–
                            {Math.min(selectedListPage * SELECTED_PAGE_SIZE, filteredSelectedSeniors.length)}
                          </strong>{' '}
                          of <strong className="text-gray-700 font-semibold">{filteredSelectedSeniors.length}</strong>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={selectedListPage <= 1}
                            onClick={() => setSelectedListPage((p) => Math.max(1, p - 1))}
                            className="p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors shadow-2xs"
                            title="Previous Page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-2 text-gray-600 font-medium">
                            Page {selectedListPage} of {totalSelectedPages}
                          </span>
                          <button
                            type="button"
                            disabled={selectedListPage >= totalSelectedPages}
                            onClick={() => setSelectedListPage((p) => Math.min(totalSelectedPages, p + 1))}
                            className="p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors shadow-2xs"
                            title="Next Page"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Program */}
              <ProgramDropdown
                programs={programs}
                value={selectedProgramId}
                onChange={setSelectedProgramId}
                disabled={selectedSeniors.length === 0}
              />

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={selectedSeniors.length === 0 || !selectedProgramId || isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-[#006b2c] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-green-500/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
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

      {/* ── RIGHT PANEL (tabbed) ── */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

          {/* Tab switcher */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'scanner'
                  ? 'text-[#006b2c] border-b-2 border-[#006b2c]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              Face Scanner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'logs'
                  ? 'text-[#006b2c] border-b-2 border-[#006b2c]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent Logs
            </button>
          </div>

          {/* ── TAB 1: Face Scanner ── */}
          {activeTab === 'scanner' && (
            <div className="flex flex-col flex-1">
              {/* Scanner header + toggle */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40">
                <p className="text-base font-bold text-gray-900">Face Scanner</p>
                {/* Toggle switch */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-medium text-gray-500">
                    {scannerActive ? 'Active' : 'Off'}
                  </span>
                  <div
                    onClick={() => setScannerActive((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${scannerActive ? 'bg-[#006b2c]' : 'bg-gray-300'}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${scannerActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </label>
              </div>

              <div className="p-5 flex flex-col items-center flex-1">
                {/* Idle state */}
                {!scannerActive && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
                      Enable the scanner to identify seniors via face recognition.
                    </p>
                  </div>
                )}

                {/* Scanner active */}
                {scannerActive && (
                  <>
                    {/* Loading models */}
                    {scanState === 'loading_models' && (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-[#006b2c]" />
                        <p className="text-xs text-gray-500 font-medium">Loading models...</p>
                      </div>
                    )}

                    {/* Success card */}
                    {scanState === 'success' && scannedSenior && (
                      <div className="w-full space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-green-200 shrink-0 flex items-center justify-center">
                            {scannedSenior.photoUrl ? (
                              <img
                                src={scannedSenior.photoUrl}
                                alt="Senior"
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-base font-bold text-[#006b2c]">
                                {scannedSenior.firstName[0]}{scannedSenior.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-[#006b2c] shrink-0" />
                              <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                                {scannedSenior.firstName} {scannedSenior.lastName}
                              </p>
                            </div>
                            <span className="inline-block bg-[#006b2c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                              {scannedSenior.oscaId}
                            </span>
                            {scannedSenior.barangay && (
                              <p className="text-xs text-gray-500 truncate">{scannedSenior.barangay}</p>
                            )}
                          </div>
                        </div>

                        {/* Confirmation text */}
                        {addedConfirmation && (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                            Added to selection!
                          </div>
                        )}

                        {!addedConfirmation && (
                          <>
                            <button
                              type="button"
                              onClick={handleAddToSelection}
                              className="w-full py-3 rounded-lg bg-[#006b2c] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Add to Selection
                            </button>
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={handleResetScanner}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                              >
                                Not the right person?
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Webcam + outcomes */}
                    {(scanState === 'ready' || scanState === 'scanning' || scanState === 'no_face' || scanState === 'no_match' || scanState === 'error') && (
                      <div className="w-full space-y-4">
                        {/* Webcam */}
                        <div className="relative w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-200 shadow-inner" style={{ aspectRatio: '4/3' }}>
                          <Webcam
                            ref={webcamRef}
                            audio={false}
                            mirrored={true}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ width: 320, height: 240, facingMode: 'user' }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {/* Oval guide */}
                          <div className="absolute inset-0 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice">
                              <defs>
                                <mask id="oval-dist-mask">
                                  <rect width="320" height="240" fill="white" />
                                  <ellipse cx="160" cy="120" rx="80" ry="100" fill="black" />
                                </mask>
                              </defs>
                              <rect width="320" height="240" fill="rgba(0,0,0,0.48)" mask="url(#oval-dist-mask)" />
                              <ellipse cx="160" cy="120" rx="80" ry="100" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="8 4" />
                            </svg>
                          </div>
                          {/* Scanning spinner */}
                          {scanState === 'scanning' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                              <Loader2 className="w-8 h-8 animate-spin text-green-400 mb-2" />
                              <span className="text-xs text-white font-medium">Scanning...</span>
                            </div>
                          )}
                        </div>

                        {/* Outcome: No face */}
                        {scanState === 'no_face' && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
                            <TriangleAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-amber-800">No face detected.</p>
                              <p className="text-xs text-amber-700 mt-0.5">Ask the senior to look directly at the camera in good lighting.</p>
                            </div>
                          </div>
                        )}

                        {/* Outcome: No match */}
                        {scanState === 'no_match' && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
                            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-red-800">Face not recognized.</p>
                              <p className="text-xs text-red-700 mt-0.5">This senior may not have face data enrolled. Use the manual search instead.</p>
                            </div>
                          </div>
                        )}

                        {/* Outcome: Generic error */}
                        {scanState === 'error' && scanError && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{scanError}</p>
                          </div>
                        )}

                        {/* Scan button */}
                        <button
                          type="button"
                          onClick={handleScan}
                          disabled={scanState === 'scanning'}
                          className="w-full py-3.5 rounded-lg bg-[#006b2c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ScanFace className="w-5 h-5" />
                          {scanState === 'no_face' || scanState === 'no_match' || scanState === 'error' ? 'Try Again' : 'Scan Face'}
                        </button>

                        <p className="text-xs text-gray-400 text-center leading-snug">
                          Ask the senior to look at the camera then click Scan Face.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: Recent Logs ── */}
          {activeTab === 'logs' && (
            <div className="flex flex-col flex-1">
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
                              <p className="text-xs text-gray-500">Logged</p>
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
          )}

        </div>
      </div>

    </div>
  );
}

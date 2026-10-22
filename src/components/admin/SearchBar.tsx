"use client";

import { Suspense } from "react";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

// ─── Inner component — must be wrapped in <Suspense> because it calls
//     useSearchParams(), which opts the page into client-side rendering.
function SearchBarInner({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQ = searchParams.get("q")?.toString() || "";
  const [query, setQuery] = useState(urlQ);

  // Sync internal state if URL changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    // If the input value matches what is already in the URL query, do nothing.
    // This prevents resetting `page` when pagination buttons or other query params change.
    if (query.trim() === urlQ.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = query.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      // Reset to page 1 only when a search query is actually typed or changed
      params.delete("page");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams, urlQ]);

  return (
    <div className="flex max-w-md bg-white rounded-md shadow-sm border border-gray-300 px-3 py-2 relative">
      <Search className={`h-5 w-5 ${isPending ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="ml-2 flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
      />
    </div>
  );
}

// ─── Public export — always wraps the inner component in Suspense so
//     parent Server Components don't require a Suspense boundary themselves.
export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex max-w-md bg-white rounded-md shadow-sm border border-gray-300 px-3 py-2">
          <Search className="h-5 w-5 text-gray-300" />
          <div className="ml-2 flex-1 h-5 bg-gray-100 rounded animate-pulse" />
        </div>
      }
    >
      <SearchBarInner placeholder={placeholder} />
    </Suspense>
  );
}

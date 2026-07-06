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
  const [query, setQuery] = useState(searchParams.get("q")?.toString() || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      
      // Always reset pagination when searching
      params.delete("page");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

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

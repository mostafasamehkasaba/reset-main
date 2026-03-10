import { Search, SlidersHorizontal } from "lucide-react";

type SuppliersFiltersProps = {
  query: string;
  statusFilter: string;
  hasActiveFilters: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onReset: () => void;
};

export function SuppliersFilters({
  query,
  statusFilter,
  hasActiveFilters,
  onQueryChange,
  onStatusFilterChange,
  onReset,
}: SuppliersFiltersProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            أدوات التصفية
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            بحث وتنقل أسرع بين الموردين
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          إعادة التعيين
        </button>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(220px,260px)]">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو البريد أو البنك أو الرقم الضريبي"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
          />
        </label>

        <label className="relative block">
          <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
          >
            <option value="all">كل الحالات</option>
            <option value="نشط">نشط</option>
            <option value="موقوف">موقوف</option>
            <option value="مؤرشف">مؤرشف</option>
          </select>
        </label>
      </div>
    </section>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  Mail,
  MoreHorizontal,
  PencilLine,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import ActionDrawer from "@/components/ActionDrawer";
import ViewModeToggle from "@/components/ViewModeToggle";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { createUser, deleteUser, listUsers, updateUser } from "../../services/users";
import type { AppUser, UserRole, UserStatus } from "../../types";

const defaultRole: UserRole = "محاسب";
const defaultStatus: UserStatus = "نشط";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "مدير", label: "مدير" },
  { value: "محاسب", label: "محاسب" },
  { value: "مشاهدة فقط", label: "مشاهدة فقط" },
];

const statusOptions: Array<{ value: UserStatus; label: string }> = [
  { value: "نشط", label: "نشط" },
  { value: "معلّق", label: "معلّق" },
];

const roleLabelMap: Record<string, string> = {
  مدير: "مدير",
  admin: "مدير",
  owner: "مدير",
  manager: "مدير",
  محاسب: "محاسب",
  accountant: "محاسب",
  finance: "محاسب",
  "مشاهدة فقط": "مشاهدة فقط",
  viewer: "مشاهدة فقط",
  read_only: "مشاهدة فقط",
};

const statusLabelMap: Record<string, string> = {
  نشط: "نشط",
  active: "نشط",
  enabled: "نشط",
  "معلّق": "معلّق",
  معلق: "معلّق",
  inactive: "معلّق",
  disabled: "معلّق",
  suspended: "معلّق",
};

const fieldClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]";

const getRoleLabel = (value: string) => roleLabelMap[value] ?? value;
const getStatusLabel = (value: string) => statusLabelMap[value] ?? value;
const isActiveStatus = (value: string) => getStatusLabel(value) === "نشط";

const formatJoinedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(date);
};

function StatCard({ title, value, tone = "default" }: { title: string; value: string | number; tone?: "default" | "success" | "accent" }) {
  const toneClass =
    tone === "success" ? "text-emerald-700" : tone === "accent" ? "text-sky-700" : "text-slate-900";

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </article>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        isActiveStatus(value)
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {getStatusLabel(value)}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-left font-medium text-slate-900">{value || "-"}</span>
    </div>
  );
}

function UserModal({
  open,
  mode,
  form,
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  form: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    password: string;
    passwordConfirmation: string;
  };
  errorMessage: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (updater: (prev: typeof form) => typeof form) => void;
}) {
  if (!open) return null;

  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" dir="rtl">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{isCreate ? "إضافة مستخدم" : "تعديل المستخدم"}</h2>
            <p className="mt-2 text-sm text-slate-500">{isCreate ? "أدخل البيانات الأساسية ثم احفظ." : "حدّث البيانات ثم احفظ التعديلات."}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" aria-label="إغلاق">×</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-5">
          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">الاسم<input className={fieldClassName} value={form.name} onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))} required /></label>
            <label className="text-sm font-medium text-slate-700">رقم الهاتف<input type="tel" inputMode="tel" dir="rtl" className={`${fieldClassName} text-right`} value={form.phone} onChange={(event) => onChange((prev) => ({ ...prev, phone: event.target.value }))} required /></label>
            <label className="text-sm font-medium text-slate-700">البريد الإلكتروني<input type="email" className={fieldClassName} value={form.email} onChange={(event) => onChange((prev) => ({ ...prev, email: event.target.value }))} required /></label>
            <label className="text-sm font-medium text-slate-700">الصلاحية<select className={fieldClassName} value={form.role} onChange={(event) => onChange((prev) => ({ ...prev, role: event.target.value as UserRole }))}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">الحالة<select className={fieldClassName} value={form.status} onChange={(event) => onChange((prev) => ({ ...prev, status: event.target.value as UserStatus }))}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            {isCreate ? (
              <>
                <label className="text-sm font-medium text-slate-700">كلمة المرور<input type="password" className={fieldClassName} value={form.password ?? ""} onChange={(event) => onChange((prev) => ({ ...prev, password: event.target.value }))} autoComplete="new-password" minLength={8} required /></label>
                <label className="text-sm font-medium text-slate-700">تأكيد كلمة المرور<input type="password" className={fieldClassName} value={form.passwordConfirmation ?? ""} onChange={(event) => onChange((prev) => ({ ...prev, passwordConfirmation: event.target.value }))} autoComplete="new-password" minLength={8} required /></label>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isCreate ? <UserRoundPlus className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
              {isSubmitting ? "جارٍ الحفظ..." : isCreate ? "حفظ المستخدم" : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [viewUserId, setViewUserId] = useState<number | null>(null);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode("reset-main-view-mode-users");
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "", passwordConfirmation: "", role: defaultRole, status: defaultStatus });
  const [editUser, setEditUser] = useState({ name: "", email: "", phone: "", password: "", passwordConfirmation: "", role: defaultRole, status: defaultStatus });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await listUsers();
        if (!active) return;
        setUsers(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل المستخدمين."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((user) => [user.name, user.email, user.phone, user.role, getRoleLabel(user.role), user.status, getStatusLabel(user.status)].join(" ").toLowerCase().includes(normalizedQuery));
  }, [query, users]);

  const activeUsers = useMemo(() => users.filter((user) => isActiveStatus(user.status)).length, [users]);
  const adminUsers = useMemo(() => users.filter((user) => getRoleLabel(user.role) === "مدير").length, [users]);
  const suspendedUsers = users.length - activeUsers;
  const selectedActionUser = useMemo(() => users.find((user) => user.id === openActionId) ?? null, [openActionId, users]);
  const selectedViewUser = useMemo(() => users.find((user) => user.id === viewUserId) ?? null, [users, viewUserId]);
  const selectedDeleteUser = useMemo(() => users.find((user) => user.id === deleteUserId) ?? null, [users, deleteUserId]);

  const resetCreateForm = () => {
    setNewUser({ name: "", email: "", phone: "", password: "", passwordConfirmation: "", role: defaultRole, status: defaultStatus });
  };

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.phone.trim() || !newUser.password || !newUser.passwordConfirmation) return;
    setActionError("");
    if (newUser.password !== newUser.passwordConfirmation) {
      setActionError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await createUser({ name: newUser.name.trim(), email: newUser.email.trim(), phone: newUser.phone.trim(), password: newUser.password, passwordConfirmation: newUser.passwordConfirmation, role: newUser.role, status: newUser.status });
      setUsers((prev) => [user, ...prev]);
      resetCreateForm();
      setShowAddModal(false);
    } catch (error) {
      setActionError(getErrorMessage(error, "تعذر حفظ المستخدم."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (user: AppUser) => {
    setActionError("");
    setEditUserId(user.id);
    setEditUser({ name: user.name, email: user.email, phone: user.phone, password: "", passwordConfirmation: "", role: user.role, status: user.status });
    setOpenActionId(null);
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUserId || !editUser.name.trim() || !editUser.email.trim() || !editUser.phone.trim()) return;
    setActionError("");
    setIsSubmitting(true);
    try {
      const updated = await updateUser(editUserId, { name: editUser.name.trim(), email: editUser.email.trim(), phone: editUser.phone.trim(), role: editUser.role, status: editUser.status });
      setUsers((prev) => prev.map((user) => (user.id === editUserId ? updated : user)));
      setEditUserId(null);
    } catch (error) {
      setActionError(getErrorMessage(error, "تعذر تحديث بيانات المستخدم."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setActionError("");
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setDeleteUserId(null);
      setOpenActionId(null);
      if (viewUserId === userId) setViewUserId(null);
      if (editUserId === userId) setEditUserId(null);
    } catch (error) {
      setActionError(getErrorMessage(error, "تعذر حذف المستخدم."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="المستخدمين" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="إجمالي المستخدمين" value={users.length} />
            <StatCard title="المستخدمون النشطون" value={activeUsers} tone="success" />
            <StatCard title="المديرون" value={adminUsers} tone="accent" />
            <StatCard title="الحسابات المعلّقة" value={suspendedUsers} />
          </section>

          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
          {actionError && !showAddModal && !editUserId ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div> : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">إدارة المستخدمين</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">قائمة المستخدمين</h2>
                <p className="mt-2 text-sm text-slate-500">{isLoading ? "يتم تحميل المستخدمين الآن..." : `يعرض ${filteredUsers.length} من أصل ${users.length} مستخدم.`}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button type="button" onClick={() => { setActionError(""); resetCreateForm(); setShowAddModal(true); }} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"><UserRoundPlus className="h-4 w-4" />مستخدم جديد</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]" placeholder="ابحث بالاسم أو البريد أو الهاتف أو الصلاحية" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">{isTableView ? "عرض جدولي" : "عرض بالكروت"}</div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">{filteredUsers.length} نتيجة</div>
            </div>
          </section>

          {isTableView ? (
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-950">قائمة المستخدمين</h3>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{filteredUsers.length} نتيجة</div>
              </div>

              {isLoading ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">جارٍ تحميل المستخدمين...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400"><UsersRound className="h-6 w-6" /></div>
                  <p className="mt-4 text-sm text-slate-500">لا توجد نتائج مطابقة.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-right">
                    <thead className="bg-slate-50/90 text-sm text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-medium">#</th>
                        <th className="px-4 py-4 font-medium">المستخدم</th>
                        <th className="px-4 py-4 font-medium">الصلاحية</th>
                        <th className="px-4 py-4 font-medium">التواصل</th>
                        <th className="px-4 py-4 font-medium">الحالة</th>
                        <th className="px-4 py-4 font-medium">تاريخ الانضمام</th>
                        <th className="px-4 py-4 text-center font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                          <td className="px-4 py-4 text-sm font-medium text-slate-700">#{user.id}</td>
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-slate-950">{user.name}</p><p className="mt-1 text-sm text-slate-500">{user.email}</p></td>
                          <td className="px-4 py-4"><span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{getRoleLabel(user.role)}</span></td>
                          <td className="px-4 py-4 text-sm text-slate-600">{user.phone || "-"}</td>
                          <td className="px-4 py-4"><StatusPill value={user.status} /></td>
                          <td className="px-4 py-4 text-sm text-slate-600">{formatJoinedAt(user.joinedAt)}</td>
                          <td className="px-4 py-4 text-center"><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" onClick={() => setOpenActionId(user.id)} aria-label="إجراءات المستخدم"><MoreHorizontal className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : isLoading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">جارٍ تحميل المستخدمين...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">لا توجد بيانات مطابقة للبحث الحالي.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((user) => (
                <article key={user.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-950">{user.name}</h3><p className="mt-1 text-sm text-slate-500">{user.email}</p></div><StatusPill value={user.status} /></div>
                  <div className="mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{getRoleLabel(user.role)}</span><span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{formatJoinedAt(user.joinedAt)}</span></div>
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><p className="text-xs text-slate-400">رقم الهاتف</p><p className="mt-1 text-sm font-medium text-slate-800">{user.phone || "-"}</p></div>
                  <div className="mt-5 flex items-center justify-between gap-3"><div className="text-sm text-slate-500">#{user.id}</div><button type="button" onClick={() => setOpenActionId(user.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><MoreHorizontal className="h-4 w-4" />الإجراءات</button></div>
                </article>
              ))}
            </div>
          )}
        </main>

        <Sidebar activeLabel="المستخدمين" />
      </div>

      <ActionDrawer open={selectedActionUser !== null} title="إجراءات المستخدم" subtitle={selectedActionUser?.name} onClose={() => setOpenActionId(null)} actions={selectedActionUser ? [{ id: "view", label: "عرض البيانات", description: "ملخص سريع لبيانات الحساب الحالية.", icon: Eye, onClick: () => { setViewUserId(selectedActionUser.id); setOpenActionId(null); } }, { id: "edit", label: "تعديل المستخدم", description: "حدّث الاسم والتواصل والصلاحية والحالة.", icon: PencilLine, onClick: () => handleStartEdit(selectedActionUser) }, { id: "delete", label: "حذف المستخدم", description: "احذف الحساب نهائيًا بعد رسالة التأكيد.", icon: Trash2, tone: "danger" as const, onClick: () => { setDeleteUserId(selectedActionUser.id); setOpenActionId(null); } }] : []}>
        {selectedActionUser ? <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"><div className="flex items-center justify-between text-sm"><span className="text-slate-500">البريد</span><span className="font-medium text-slate-900">{selectedActionUser.email}</span></div><DetailRow label="الهاتف" value={selectedActionUser.phone} /><DetailRow label="الصلاحية" value={getRoleLabel(selectedActionUser.role)} /><DetailRow label="الحالة" value={getStatusLabel(selectedActionUser.status)} /></div> : null}
      </ActionDrawer>

      {selectedViewUser ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" dir="rtl">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5"><div><h2 className="text-xl font-semibold text-slate-950">بيانات المستخدم</h2><p className="mt-2 text-sm text-slate-500">ملخص سريع لمعلومات الحساب.</p></div><button type="button" onClick={() => setViewUserId(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" aria-label="إغلاق">×</button></div>
            <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />البريد</div><p className="mt-3 text-sm font-semibold text-slate-900">{selectedViewUser.email}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><Phone className="h-4 w-4" />الهاتف</div><p className="mt-3 text-sm font-semibold text-slate-900">{selectedViewUser.phone}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4" />الصلاحية</div><p className="mt-3 text-sm font-semibold text-slate-900">{getRoleLabel(selectedViewUser.role)}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" />الانضمام</div><p className="mt-3 text-sm font-semibold text-slate-900">{formatJoinedAt(selectedViewUser.joinedAt)}</p></div>
            </div>
          </div>
        </div>
      ) : null}

      <UserModal open={showAddModal} mode="create" form={newUser} errorMessage={actionError} isSubmitting={isSubmitting} onClose={() => { if (isSubmitting) return; setShowAddModal(false); setActionError(""); }} onSubmit={handleAddUser} onChange={setNewUser} />
      <UserModal open={editUserId !== null} mode="edit" form={editUser} errorMessage={actionError} isSubmitting={isSubmitting} onClose={() => { if (isSubmitting) return; setEditUserId(null); setActionError(""); }} onSubmit={handleUpdateUser} onChange={setEditUser} />

      <ConfirmDeleteModal open={deleteUserId !== null} title="تأكيد حذف المستخدم" message={selectedDeleteUser ? `هل تريد حذف المستخدم "${selectedDeleteUser.name}"؟` : "هل تريد حذف هذا المستخدم؟"} isProcessing={isDeleting} onClose={() => { if (isDeleting) return; setDeleteUserId(null); }} onConfirm={() => { if (deleteUserId === null || isDeleting) return; void handleDeleteUser(deleteUserId); }} />
    </div>
  );
}

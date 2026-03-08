"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { createUser, deleteUser, listUsers, updateUser } from "../../services/users";
import type { AppUser, UserRole, UserStatus } from "../../types";

const defaultRole = "ظ…ط­ط§ط³ط¨" as UserRole;
const defaultStatus = "ظ†ط´ط·" as UserStatus;

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "ظ…ط¯ظٹط±" as UserRole, label: "مدير" },
  { value: "ظ…ط­ط§ط³ط¨" as UserRole, label: "محاسب" },
  { value: "ظ…ط´ط§ظ‡ط¯ط© ظپظ‚ط·" as UserRole, label: "مشاهدة فقط" },
];

const statusOptions: Array<{ value: UserStatus; label: string }> = [
  { value: "ظ†ط´ط·" as UserStatus, label: "نشط" },
  { value: "ظ…ط¹ظ„ظ‘ظ‚" as UserStatus, label: "معلق" },
];

const roleLabelMap: Record<string, string> = {
  "ظ…ط¯ظٹط±": "مدير",
  "مدير": "مدير",
  "admin": "مدير",
  "owner": "مدير",
  "manager": "مدير",
  "ظ…ط­ط§ط³ط¨": "محاسب",
  "محاسب": "محاسب",
  "accountant": "محاسب",
  "finance": "محاسب",
  "ظ…ط´ط§ظ‡ط¯ط© ظپظ‚ط·": "مشاهدة فقط",
  "مشاهدة فقط": "مشاهدة فقط",
  "viewer": "مشاهدة فقط",
  "read_only": "مشاهدة فقط",
};

const statusLabelMap: Record<string, string> = {
  "ظ†ط´ط·": "نشط",
  "نشط": "نشط",
  "active": "نشط",
  "enabled": "نشط",
  "ظ…ط¹ظ„ظ‘ظ‚": "معلق",
  "ظ…ط¹ظ„ظ‚": "معلق",
  "معلق": "معلق",
  "inactive": "معلق",
  "disabled": "معلق",
  "suspended": "معلق",
};

const getRoleLabel = (value: string) => roleLabelMap[value] ?? value;
const getStatusLabel = (value: string) => statusLabelMap[value] ?? value;
const isActiveStatus = (value: string) => getStatusLabel(value) === "نشط";

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
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
    role: defaultRole,
    status: defaultStatus,
  });
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: defaultRole,
    status: defaultStatus,
  });

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

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const roleLabel = getRoleLabel(user.role);
      const statusLabel = getStatusLabel(user.status);
      return [user.name, user.email, user.phone, user.role, roleLabel, user.status, statusLabel]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, users]);

  const activeUsers = useMemo(
    () => users.filter((user) => isActiveStatus(user.status)).length,
    [users]
  );
  const admins = useMemo(
    () => users.filter((user) => getRoleLabel(user.role) === "مدير").length,
    [users]
  );

  const selectedActionUser = useMemo(
    () => users.find((user) => user.id === openActionId) ?? null,
    [openActionId, users]
  );
  const selectedViewUser = useMemo(
    () => users.find((user) => user.id === viewUserId) ?? null,
    [users, viewUserId]
  );
  const selectedDeleteUser = useMemo(
    () => users.find((user) => user.id === deleteUserId) ?? null,
    [users, deleteUserId]
  );

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.phone.trim() ||
      !newUser.password ||
      !newUser.passwordConfirmation
    ) {
      return;
    }

    setActionError("");

    if (newUser.password !== newUser.passwordConfirmation) {
      setActionError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await createUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        password: newUser.password,
        passwordConfirmation: newUser.passwordConfirmation,
        role: newUser.role,
        status: newUser.status,
      });

      setUsers((prev) => [user, ...prev]);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        password: "",
        passwordConfirmation: "",
        role: defaultRole,
        status: defaultStatus,
      });
      setShowAddModal(false);
    } catch (error) {
      setActionError(getErrorMessage(error, "تعذر حفظ المستخدم."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (user: AppUser) => {
    setEditUserId(user.id);
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    });
    setOpenActionId(null);
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUserId || !editUser.name.trim() || !editUser.email.trim() || !editUser.phone.trim()) {
      return;
    }

    setActionError("");
    setIsSubmitting(true);

    try {
      const updated = await updateUser(editUserId, {
        name: editUser.name.trim(),
        email: editUser.email.trim(),
        phone: editUser.phone.trim(),
        role: editUser.role,
        status: editUser.status,
      });

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
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">إجمالي المستخدمين</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{users.length}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">المستخدمون النشطون</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{activeUsers}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">عدد المدراء</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{admins}</p>
            </article>
          </section>

          <div
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-[1fr_auto_1fr] md:items-center"
            dir="ltr"
          >
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                مستخدم جديد
              </button>
            </div>
            <div className="flex justify-center">
              <div className="app-search">
                <input
                  className="app-search-input h-10 w-52 px-3 text-right text-sm outline-none"
                  placeholder="ابحث عن مستخدم"
                  dir="rtl"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="app-search-icon h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </div>
            </div>
            <div className="text-right text-lg font-semibold text-slate-700" dir="rtl">
              المستخدمين
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">#</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-right">الاسم</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">البريد</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الهاتف</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الصلاحية</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الحالة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">تاريخ الانضمام</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center" aria-label="الإجراءات">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        جارٍ تحميل المستخدمين...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        لا يوجد مستخدمون من الـ API حاليًا.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {user.id}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-right font-semibold text-slate-800">
                          {user.name}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {user.phone}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {getRoleLabel(user.role)}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              isActiveStatus(user.status)
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {getStatusLabel(user.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {user.joinedAt}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-500">
                          <button
                            type="button"
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
                            onClick={() => setOpenActionId(user.id)}
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                              <circle cx="12" cy="5" r="1.6" />
                              <circle cx="12" cy="12" r="1.6" />
                              <circle cx="12" cy="19" r="1.6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="المستخدمين" />
      </div>

      {selectedActionUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          dir="rtl"
          onClick={() => setOpenActionId(null)}
        >
          <div
            className="w-[340px] max-w-[92vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">إجراءات المستخدم</p>
                <p className="text-xs text-slate-500">{selectedActionUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenActionId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <button
                type="button"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setViewUserId(selectedActionUser.id);
                  setOpenActionId(null);
                }}
              >
                عرض
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                onClick={() => handleStartEdit(selectedActionUser)}
              >
                تعديل
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                onClick={() => {
                  setDeleteUserId(selectedActionUser.id);
                  setOpenActionId(null);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedViewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">بيانات المستخدم</h2>
                <p className="text-sm text-slate-500">{selectedViewUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewUserId(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">البريد</p>
                <p className="mt-1 font-semibold">{selectedViewUser.email}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الهاتف</p>
                <p className="mt-1 font-semibold">{selectedViewUser.phone}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الصلاحية</p>
                <p className="mt-1 font-semibold">{getRoleLabel(selectedViewUser.role)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">الحالة</p>
                <p className="mt-1 font-semibold">{getStatusLabel(selectedViewUser.status)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                <p className="text-slate-500">تاريخ الانضمام</p>
                <p className="mt-1 font-semibold">{selectedViewUser.joinedAt}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">تعديل المستخدم</h2>
                <p className="text-sm text-slate-500">حدّث البيانات ثم احفظ التعديلات.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditUserId(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  الاسم *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editUser.name}
                    onChange={(event) => setEditUser((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الهاتف *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editUser.phone}
                    onChange={(event) => setEditUser((prev) => ({ ...prev, phone: event.target.value }))}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  البريد *
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editUser.email}
                    onChange={(event) => setEditUser((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الصلاحية
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editUser.role}
                    onChange={(event) =>
                      setEditUser((prev) => ({
                        ...prev,
                        role: event.target.value as UserRole,
                      }))
                    }
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={editUser.status}
                    onChange={(event) =>
                      setEditUser((prev) => ({
                        ...prev,
                        status: event.target.value as UserStatus,
                      }))
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="hidden">
                  كلمة المرور *
                  <input
                    type="hidden"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, password: event.target.value }))
                    }
                    autoComplete="new-password"
                    minLength={8}
                  />
                </label>

                <label className="hidden">
                  تأكيد كلمة المرور *
                  <input
                    type="hidden"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.passwordConfirmation}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        passwordConfirmation: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    minLength={8}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEditUserId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm text-white hover:bg-brand-800"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">إضافة مستخدم جديد</h2>
                <p className="text-sm text-slate-500">أدخل البيانات وسيتم إضافته إلى القائمة.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  الاسم *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.name}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الهاتف *
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.phone}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, phone: event.target.value }))}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  البريد *
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.email}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  الصلاحية
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.role}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        role: event.target.value as UserRole,
                      }))
                    }
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-600 md:col-span-2">
                  الحالة
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.status}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        status: event.target.value as UserStatus,
                      }))
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-600">
                  كلمة المرور *
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, password: event.target.value }))
                    }
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                <label className="text-sm text-slate-600">
                  تأكيد كلمة المرور *
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-800"
                    value={newUser.passwordConfirmation}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        passwordConfirmation: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm text-white hover:bg-brand-800"
                >
                  حفظ المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteUserId !== null}
        title="تأكيد حذف المستخدم"
        message={
          selectedDeleteUser
            ? `هل تريد حذف المستخدم "${selectedDeleteUser.name}"؟`
            : "هل تريد حذف هذا المستخدم؟"
        }
        isProcessing={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteUserId(null);
        }}
        onConfirm={() => {
          if (deleteUserId === null || isDeleting) return;
          void handleDeleteUser(deleteUserId);
        }}
      />
    </div>
  );
}

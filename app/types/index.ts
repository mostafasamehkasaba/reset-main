export type SidebarLabel =
  | "لوحة البيانات"
  | "الفواتير"
  | "المنتجات"
  | "وسائل الدفع"
  | "العملاء"
  | "المستخدمين"
  | "التصنيفات"
  | "الموردين"
  | "الإعدادات"
  | "البريد"
  | "حول";

export type SidebarProps = {
  activeLabel: SidebarLabel | string;
};

export type SidebarContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  close: () => void;
};

export type SidebarProviderProps = {
  children: React.ReactNode;
};

export type SidebarToggleProps = {
  className?: string;
};

export type Theme = "light" | "dark";

export type EntityStatus = "نشط" | "معلّق";
export type SupplierStatus = "نشط" | "موقوف" | "مؤرشف";

export type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  taxNumber: string;
  paymentTermDays: 30 | 60;
  creditLimit: number;
  openingBalance: number;
  bankAccountNumber: string;
  bankName: string;
  iban: string;
  status: SupplierStatus;
  notes: string;
  balance: number;
  orders: number;
  joinedAt: string;
};

export type UserRole = "مدير" | "محاسب" | "مشاهدة فقط";
export type UserStatus = EntityStatus;

export type AppUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
};

export type CategoryStatus = EntityStatus;

export type MainCategory = {
  id: number;
  name: string;
  code: string;
  status: CategoryStatus;
  products: number;
};

export type SubCategory = {
  id: number;
  name: string;
  mainCategoryId: number;
  status: CategoryStatus;
  products: number;
};

export type ClientStats = {
  total: number;
  paid: number;
  discount: number;
  due: number;
};

export type ClientRecentInvoice = {
  id: number;
  products: number;
  total: number;
  paid: number;
  discount: number;
  due: number;
  currency: string;
  status: string;
  date: string;
  dueDate: string;
};

export type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  currency: string;
  invoices: number;
  due: number;
  stats: ClientStats;
  recentInvoices: ClientRecentInvoice[];
};

export type ClientViewPageProps = {
  params: { id: string };
};

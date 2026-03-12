export type SidebarLabel =
  | "لوحة البيانات"
  | "الفواتير"
  | "المنتجات"
  | "وسائل الدفع"
  | "العملاء"
  | "المستخدمين"
  | "التصنيفات"
  | "الموردين"
  | "الفروع"
  | "المندوبين"
  | "العملات"
  | "وحدات قياس"
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
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
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
  backendId?: string;
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
  backendId?: string;
  name: string;
  code: string;
  status: CategoryStatus;
  products: number;
  isLocal?: boolean;
  subCategories?: SubCategory[];
};

export type SubCategory = {
  id: number;
  backendId?: string;
  name: string;
  mainCategoryId: number; // This should ideally use backendId of parent
  mainCategoryName?: string;
  status: CategoryStatus;
  products: number;
  isLocal?: boolean;
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
  backendId?: number;
  name: string;
  type?: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  taxNumber?: string;
  commercialRegister?: string;
  creditLimit?: number;
  openingBalance?: number;
  defaultPaymentMethod?: string;
  internalNotes?: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
  invoices: number;
  due: number;
  stats: ClientStats;
  recentInvoices: ClientRecentInvoice[];
};

export type ClientViewPageProps = {
  params: { id: string };
};

export type AuthUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export type InvoiceStatus =
  | "مدفوعة"
  | "غير مدفوعة"
  | "مدفوعة جزئيا"
  | "مسودة"
  | "ملغاة";

export type Invoice = {
  id: string;
  backendId?: string;
  num: number;
  products: number;
  total: number;
  paid: number;
  discount: number;
  due: number;
  currency: string;
  status: InvoiceStatus | string;
  date: string;
  dueDate: string;
  client: string;
};

export type Branch = {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
};

export type Delegate = {
  id: number;
  name: string;
  phone: string;
  email: string;
  region: string;
  status: EntityStatus;
};

export type Currency = {
  id: number;
  name: string;
  symbol: string;
  code: string;
  isDefault: boolean;
};

export type ProductUnit = {
  id: number;
  name: string;
  isDefault: boolean;
};

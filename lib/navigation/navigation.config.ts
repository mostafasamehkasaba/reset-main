import type { LucideIcon } from "lucide-react";
import {
  FileText,
  FolderTree,
  Info,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  aliases?: string[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    id: "main",
    label: "الرئيسية",
    items: [
      {
        id: "dashboard",
        label: "لوحة البيانات",
        href: "/dashboard",
        icon: LayoutDashboard,
        aliases: ["/projects-pages/home"],
      },
      {
        id: "invoices",
        label: "الفواتير",
        href: "/invoices",
        icon: FileText,
        aliases: ["/projects-pages/invoices"],
      },
      {
        id: "customers",
        label: "العملاء",
        href: "/customers",
        icon: Users,
        aliases: ["/projects-pages/clients"],
      },
      {
        id: "products",
        label: "المنتجات",
        href: "/products",
        icon: Package,
        aliases: ["/projects-pages/products"],
      },
      {
        id: "categories",
        label: "التصنيفات",
        href: "/projects-pages/categories",
        icon: FolderTree,
      },
      {
        id: "payment-methods",
        label: "وسائل الدفع",
        href: "/projects-pages/payment-methods",
        icon: WalletCards,
      },
    ],
  },
  {
    id: "management",
    label: "الإدارة",
    items: [
      {
        id: "users",
        label: "المستخدمون",
        href: "/projects-pages/users",
        icon: ShieldCheck,
      },
      {
        id: "suppliers",
        label: "الموردون",
        href: "/projects-pages/Suppliers",
        icon: Truck,
      },
    ],
  },
  {
    id: "system",
    label: "النظام",
    items: [
      {
        id: "settings",
        label: "الإعدادات",
        href: "/projects-pages/settings",
        icon: Settings,
      },
      {
        id: "mail",
        label: "البريد",
        href: "/projects-pages/mail",
        icon: Mail,
      },
      {
        id: "about",
        label: "حول",
        href: "/projects-pages/about",
        icon: Info,
      },
    ],
  },
];

export const isNavigationItemActive = (
  pathname: string,
  item: NavigationItem
) => {
  const normalizedPath = pathname.toLowerCase();
  const candidates = [item.href, ...(item.aliases || [])].map((value) =>
    value.toLowerCase()
  );

  return candidates.some((candidate) => {
    if (candidate === "/") {
      return normalizedPath === "/";
    }

    return (
      normalizedPath === candidate ||
      normalizedPath.startsWith(`${candidate}/`)
    );
  });
};

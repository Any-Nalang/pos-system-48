import {
  CalculatorIcon,
  ClipboardTextIcon,
  CurrencyDollarIcon,
  ListIcon,
  PackageIcon,
  ShoppingCartIcon,
  SignOutIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/integrations/better-auth/auth-client";
import { cn } from "@/lib/utils";
import {
  defaultPosFormValues,
  usePosStore,
} from "@/features/staff/pos/stores/usePosStore";
import {
  emptyCashCountValues,
  useXReadingStore,
} from "@/features/staff/xreading/stores/useXReadingStore";

const navLinks = [
  { label: "POS", path: "/staff/pos", icon: ShoppingCartIcon },
  { label: "Inventory", path: "/staff/inventory", icon: PackageIcon },
  { label: "Cash Logs", path: "/staff/expenses", icon: CurrencyDollarIcon },
  { label: "Orders", path: "/staff/orders", icon: ClipboardTextIcon },
  { label: "X-Reading", path: "/staff/xreading", icon: CalculatorIcon },
];

const staffTo = (path: string) => path as never;

function StaffHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    usePosStore.persist.clearStorage();
    usePosStore.setState({
      cart: [],
      formValues: defaultPosFormValues,
      lastOrder: null,
      search: "",
    });
    useXReadingStore.persist.clearStorage();
    useXReadingStore.setState({ cashCount: emptyCashCountValues });
    await authClient.signOut();
    navigate({ to: "/" });
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/staff") return location.pathname === "/staff";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="top-0 z-50 w-full border-b border-(--light-gray) bg-(--pure-white)/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-screen-2xl items-center gap-2 px-3 lg:h-16 lg:gap-4 lg:px-8">
        {/* Logo */}
        <Link
          to={staffTo("/staff/pos")}
          className="flex shrink-0 items-center gap-1.5 no-underline lg:gap-2.5"
        >
          <div className="flex size-10 items-center justify-center overflow-hidden lg:size-16">
            <img
              src="/logo.png"
              alt="48 Coffee Co. Logo"
              className="size-10 object-contain lg:size-16"
            />
          </div>
        </Link>

        <Separator
          orientation="vertical"
          className="hidden h-10 bg-(--light-gray) sm:block lg:h-16"
        />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={staffTo(link.path)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors no-underline",
                  isActive(link.path)
                    ? "bg-[var(--light-mint)] text-[var(--deep-forest)]"
                    : "text-[var(--medium-gray)] hover:bg-[var(--pale-yellow)] hover:text-[var(--deep-forest)]",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden flex-1 lg:block" />

        {/* User Info + Logout (Desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {!sessionLoading && session?.user ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-(--deep-forest)">
                  <UserCircleIcon
                    weight="fill"
                    className="size-6 text-(--pale-yellow)"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-(--deep-forest)">
                    {session.user.name ?? "User"}
                  </span>
                  <span className="text-xs text-(--medium-gray)">
                    {session?.user?.role ?? "Staff"}
                  </span>
                </div>
              </div>
              <Separator
                orientation="vertical"
                className="h-8 bg-(--light-gray)"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-[var(--medium-gray)] hover:text-[var(--coral)] hover:bg-[var(--soft-peach)]/30"
                title="Log out"
              >
                <SignOutIcon className="size-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 animate-pulse rounded-full bg-[var(--light-gray)]" />
              <div className="space-y-1">
                <span className="block h-3 w-20 animate-pulse rounded bg-[var(--light-gray)]" />
                <span className="block h-2.5 w-12 animate-pulse rounded bg-[var(--light-gray)]" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="ml-auto flex size-7 items-center justify-center rounded-lg text-[var(--medium-gray)] hover:bg-[var(--pale-yellow)] hover:text-[var(--deep-forest)] lg:hidden lg:size-9 lg:rounded-xl"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <XIcon className="size-3.5 lg:size-5" />
          ) : (
            <ListIcon className="size-3.5 lg:size-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--light-gray)] bg-[var(--pure-white)] px-4 pb-4 pt-2 lg:hidden animate-fade-in-up">
          {/* Mobile Nav */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={staffTo(link.path)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors no-underline",
                    isActive(link.path)
                      ? "bg-[var(--light-mint)] text-[var(--deep-forest)]"
                      : "text-[var(--medium-gray)] hover:bg-[var(--pale-yellow)] hover:text-[var(--deep-forest)]",
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-3 bg-[var(--light-gray)]" />

          {/* Mobile User Info */}
          {!sessionLoading && session?.user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-full bg-[var(--deep-forest)]">
                  <UserCircleIcon
                    weight="fill"
                    className="size-6 text-[var(--pale-yellow)]"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-[var(--deep-forest)]">
                    {session.user.name ?? "User"}
                  </span>
                  <span className="text-xs text-[var(--medium-gray)]">
                    {session?.user?.role ?? "Staff"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex size-9 items-center justify-center rounded-xl text-[var(--medium-gray)] hover:bg-[var(--soft-peach)]/30 hover:text-[var(--coral)]"
                aria-label="Log out"
              >
                <SignOutIcon className="size-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="size-9 animate-pulse rounded-full bg-[var(--light-gray)]" />
              <div className="space-y-1">
                <span className="block h-3 w-24 animate-pulse rounded bg-[var(--light-gray)]" />
                <span className="block h-2.5 w-16 animate-pulse rounded bg-[var(--light-gray)]" />
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export { StaffHeader };

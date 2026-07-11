import {
	CurrencyDollarIcon,
	ListIcon,
	PackageIcon,
	SignOutIcon,
	SquaresFourIcon,
	UserCircleIcon,
	UsersIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { sessionQueryOptions } from "@/features/auth/queryOptions";
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
	{ label: "Dashboard", path: "/admin", icon: SquaresFourIcon },
	{ label: "Menu", path: "/admin/menu", icon: ListIcon },
	{ label: "Inventory", path: "/admin/inventory", icon: PackageIcon },
	{ label: "Cash Logs", path: "/admin/cash-logs", icon: CurrencyDollarIcon },
	{ label: "Accounts", path: "/admin/accounts", icon: UsersIcon },
];

const adminTo = (path: string) => path as never;

function AdminHeader() {
	const location = useLocation();
	const navigate = useNavigate();
	const { data } = useSuspenseQuery(sessionQueryOptions);
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
		if (location.pathname) setMobileMenuOpen(false);
	}, [location.pathname]);

	const isActive = (path: string) => {
		if (path === "/admin") return location.pathname === "/admin";
		return location.pathname.startsWith(path);
	};

	const currentRole = data?.user.role ?? "Admin";

	return (
		<header className="sticky top-0 z-50 w-full border-b border-(--light-gray) bg-(--pure-white)/95 backdrop-blur-sm">
			<div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
				<Link
					to={adminTo("/admin")}
					className="flex shrink-0 items-center gap-2 no-underline"
				>
					<div className="flex size-16 items-center justify-center overflow-hidden">
						<img src="/logo.png" alt="48 Coffee Co. Logo" className="size-16 object-contain" />
					</div>
				</Link>

				<Separator
						  orientation="vertical"
						  className="hidden h-16 bg-(--light-gray) sm:block"
						/>

				<nav className="hidden items-center gap-1 lg:flex">
					{navLinks.map((link) => {
						const Icon = link.icon;
						return (
							<Link
								key={link.path}
								to={adminTo(link.path)}
								className={cn(
									"flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors no-underline",
									isActive(link.path)
										? "bg-(--light-mint) text-(--deep-forest)"
										: "text-(--medium-gray) hover:bg-(--pale-yellow) hover:text-(--deep-forest)",
								)}
							>
								<Icon className="size-4" />
								{link.label}
							</Link>
						);
					})}
				</nav>

				<div className="hidden flex-1 lg:block" />

				<div className="hidden items-center gap-3 lg:flex">
					{data?.user ? (
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
										{data.user.name ?? "User"}
									</span>
									<span className="text-xs text-(--medium-gray)">
										{currentRole}
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
								className="text-(--medium-gray) hover:text-(--coral) hover:bg-(--soft-peach)/30"
								title="Log out"
							>
								<SignOutIcon className="size-4" />
							</Button>
						</>
					) : (
						<div className="flex items-center gap-2">
							<span className="h-8 w-8 animate-pulse rounded-full bg-(--light-gray)" />
							<div className="space-y-1">
								<span className="block h-3 w-20 animate-pulse rounded bg-(--light-gray)" />
								<span className="block h-2.5 w-12 animate-pulse rounded bg-(--light-gray)" />
							</div>
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="ml-auto flex size-9 items-center justify-center rounded-xl text-(--medium-gray) hover:bg-(--pale-yellow) hover:text-(--deep-forest) lg:hidden"
					aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
				>
					{mobileMenuOpen ? (
						<XIcon className="size-5" />
					) : (
						<ListIcon className="size-5" />
					)}
				</button>
			</div>

			{mobileMenuOpen && (
				<div className="border-t border-(--light-gray) bg-(--pure-white) px-4 pb-4 pt-2 lg:hidden animate-fade-in-up">
					<nav className="flex flex-col gap-1">
						{navLinks.map((link) => {
							const Icon = link.icon;
							return (
								<Link
									key={link.path}
									to={adminTo(link.path)}
									className={cn(
										"flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors no-underline",
										isActive(link.path)
											? "bg-(--light-mint) text-(--deep-forest)"
											: "text-(--medium-gray) hover:bg-(--pale-yellow) hover:text-(--deep-forest)",
									)}
								>
									<Icon className="size-4" />
									{link.label}
								</Link>
							);
						})}
					</nav>

					<Separator className="my-3 bg-(--light-gray)" />

					{data ? (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="flex size-9 items-center justify-center rounded-full bg-(--deep-forest)">
									<UserCircleIcon
										weight="fill"
										className="size-6 text-(--pale-yellow)"
									/>
								</div>
								<div className="flex flex-col leading-tight">
									<span className="text-sm font-semibold text-(--deep-forest)">
										{data?.user.name ?? "User"}
									</span>
									<span className="text-xs text-(--medium-gray)">
										{currentRole}
									</span>
								</div>
							</div>
							<button
								type="button"
								onClick={handleLogout}
								className="flex size-9 items-center justify-center rounded-xl text-(--medium-gray) hover:bg-(--soft-peach)/30 hover:text-(--coral)"
								aria-label="Log out"
							>
								<SignOutIcon className="size-5" />
							</button>
						</div>
					) : (
						<div className="flex items-center gap-3">
							<span className="size-9 animate-pulse rounded-full bg-(--light-gray)" />
							<div className="space-y-1">
								<span className="block h-3 w-24 animate-pulse rounded bg-(--light-gray)" />
								<span className="block h-2.5 w-16 animate-pulse rounded bg-(--light-gray)" />
							</div>
						</div>
					)}
				</div>
			)}
		</header>
	);
}

export { AdminHeader };

import { useLocation } from "wouter";
import homeNavIcon from "@assets/20260228_010602_1787388821497.png";
import productsNavIcon from "@/assets/chargepoint-products-nav.svg";
import teamNavIcon from "@/assets/team-nav.svg";
import accountNavIcon from "@assets/20260228_010619_1787388821589.png";

const navItems = [
  { path: "/",            label: "home",    icon: homeNavIcon },
  { path: "/products",    label: "products", icon: productsNavIcon },
  { path: "/team",        label: "team",   icon: teamNavIcon },
  { path: "/account",     label: "account", icon: accountNavIcon },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const isTeam = location === "/team" || location.startsWith("/team-details");
  const isHome = location === "/";
  const isProducts = location === "/products";
  const isAccount = location === "/account";
  const isAbout = location === "/about";
  const isRules = location === "/rules";
  const usesOrangeBrand = isTeam || isHome || isProducts || isAccount || isAbout || isRules;

  return (
    <nav
      className={`bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-1px_2px_rgba(0,0,0,.05)] ${isHome ? "cp-bottom-nav" : ""}`}
      style={{ borderColor: usesOrangeBrand ? "rgba(255, 122, 20, 0.3)" : "rgba(0, 204, 44, 0.2)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[59px] max-w-[500px] items-center justify-around pb-1">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === "/team" && isTeam);
          const homeLabel = item.path === "/" ? "Home" : item.path === "/products" ? "Products" : item.path === "/team" ? "Team" : "My account";

          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (item.path === "/") {
                  window.dispatchEvent(new Event("home-tab-clicked"));
                }
              }}
              className="flex h-full flex-1 flex-col items-center justify-center gap-[2px]"
              data-testid={`nav-${item.label.toLowerCase()}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                aria-hidden="true"
                className="bottom-nav-icon h-[32px] w-[32px]"
                style={{
                  backgroundColor: isActive ? (usesOrangeBrand ? "#ff7a14" : "#00cc2c") : "#8f969b",
                  WebkitMaskImage: `url("${item.icon}")`,
                  maskImage: `url("${item.icon}")`,
                }}
              />
              <span
                className="text-[11px] font-medium leading-none"
                  style={{ color: isActive ? (usesOrangeBrand ? "#9e4100" : "#00cc2c") : "#55565a" }}
              >
                {isHome ? homeLabel : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

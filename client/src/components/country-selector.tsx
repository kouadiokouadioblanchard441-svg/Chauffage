import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FALLBACK_API_COUNTRIES, type ApiCountry } from "@/lib/countries";
import { Check, Loader2, Search, X } from "lucide-react";

interface CountrySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
  selectedCountryCode?: string;
}

export function CountrySelector({ open, onClose, onSelect, selectedCountryCode }: CountrySelectorProps) {
  const [search, setSearch] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { data: apiCountries, isLoading, isError } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const touchDevice = window.matchMedia("(pointer: coarse)").matches;
    (touchDevice ? closeButtonRef.current : searchInputRef.current)?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSearch("");
        onCloseRef.current();
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const closePicker = () => {
    setSearch("");
    onClose();
  };

  const countrySource = isError ? FALLBACK_API_COUNTRIES : apiCountries || [];
  const countries = countrySource
    .filter(c => c.isActive)
    .map(c => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix }))
    .filter(country => {
      const query = search.trim().toLowerCase();
      return !query || country.name.toLowerCase().includes(query) || country.phonePrefix.includes(query);
    });

  return (
    <div className="country-picker-overlay" onClick={closePicker}>
      <section
        ref={dialogRef}
        className="country-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-picker-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="country-picker-header">
          <h2 id="country-picker-heading">Choose a country</h2>
          <button ref={closeButtonRef} type="button" className="country-picker-close" onClick={closePicker} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="country-picker-search">
          <Search aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for a country"
            aria-label="Search for a country"
          />
        </div>
        <div className="country-picker-list">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading countries...</span>
            </div>
          ) : countries.map((country) => {
            const selected = country.code === selectedCountryCode;
            return (
              <button
                type="button"
                key={country.code}
                className={`country-picker-row${selected ? " is-selected" : ""}`}
                onClick={() => { onSelect(country.code); closePicker(); }}
                aria-pressed={selected}
                data-testid={`country-option-${country.code}`}
              >
                <span className="country-picker-name">{country.name}</span>
                <span className="country-picker-prefix">+{country.phonePrefix}</span>
                {selected && <Check className="country-picker-check" aria-hidden="true" />}
              </button>
            );
          })}
          {!isLoading && isError && (
            <p className="country-picker-empty" role="status">
              Temporary local list: the country server is unavailable.
            </p>
          )}
          {!isLoading && countries.length === 0 && <p className="country-picker-empty">{search ? "No results" : "No countries available"}</p>}
        </div>
      </section>
    </div>
  );
}
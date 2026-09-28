import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { FALLBACK_COUNTRIES, type ApiCountry } from "@/lib/countries";
import { CountrySelector } from "@/components/country-selector";
import { ChevronDown, Code2, Eye, EyeOff, Globe2, Loader2, LockKeyhole } from "lucide-react";
import registerIllustration from "@/assets/auth-chargepoint-combined.png";

const registerSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().min(2, "Sélectionnez un pays"),
  password: z.string().min(6, "Au moins 6 caractères"),
  confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  invitationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const params = new URLSearchParams(searchString);
  // Referral links use /html/register?code=ABC123.
  const currentInvitationMatch = searchString.match(/[?&]code=([^&?#]+)/i);
  const refCode = currentInvitationMatch?.[1]
    || params.get("money")
    || params.get("reg")
    || params.get("code")
    || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      country: "PH",
      password: "",
      confirmPassword: "",
      invitationCode: refCode,
    },
  });

  const { data: apiCountries, isLoading: countriesLoading } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const selectedCountry = form.watch("country");

  useEffect(() => {
    if (!apiCountries || apiCountries.length === 0) return;
    const isValid = apiCountries.some(ac => ac.code === selectedCountry && ac.isActive);
    if (!isValid) {
      const first = apiCountries.find(ac => ac.isActive);
      if (first) form.setValue("country", first.code);
    }
  }, [apiCountries, selectedCountry, form]);

  const countryData = (() => {
    if (apiCountries !== undefined) {
      const c = apiCountries.find(ac => ac.code === selectedCountry && ac.isActive);
      if (c) return { phonePrefix: c.phonePrefix, name: c.name };
      return null;
    }
    const f = FALLBACK_COUNTRIES.find(fc => fc.code === selectedCountry);
    return f ? { phonePrefix: f.phonePrefix, name: f.name } : null;
  })();

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      await register({
        fullName: `User_${data.phone}`,
        phone: data.phone,
        country: data.country,
        password: data.password,
        invitationCode: data.invitationCode,
      });
      toast({ title: "Inscription réussie !", description: "Bienvenue sur ChargePoint !" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Inscription impossible", description: error.message || "Vérifiez vos informations et réessayez.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const displayedPrefix = countryData?.phonePrefix || (countriesLoading ? "..." : "");

  return (
    <main className="auth-reference auth-register">
      <style>{`
          .auth-reference { width: 100%; min-height: 100dvh; overflow-x: hidden; background: #ffffff; color: #111827; font-family: Arial, sans-serif; }
        .auth-reference *, .auth-reference *::before, .auth-reference *::after { box-sizing: border-box; }
         .auth-reference .auth-screen { width: 100%; max-width: 512px; min-height: 100dvh; margin: 0 auto; overflow: hidden; background: #ffffff; }
         .auth-reference .auth-panel { min-height: 100dvh; box-sizing: border-box; background: #ffffff; }
        .auth-register .auth-panel { width: 100%; padding: 18px clamp(16px, 6.05vw, 31px) 40px; }
          .auth-register .auth-title { margin: 0 0 20px; color: #111827; font-size: clamp(36px, 9.4vw, 50px); font-weight: 600; line-height: 1.2; }
        .auth-reference form { width: 100%; min-width: 0; }
         .auth-reference .auth-fields { display: grid; gap: 16px; }
        .auth-reference .auth-field { display: flex; width: 100%; min-width: 0; height: 67px; align-items: center; overflow: hidden; border: 2px solid #111827; border-radius: 11px; padding: 0 clamp(12px, 3.9vw, 20px); background: #fff; box-shadow: 0 2px 5px rgba(17, 24, 39, .14); transition: border-color .15s ease, box-shadow .15s ease; }
         .auth-reference .auth-field:focus-within { border-color: #ff7a14; box-shadow: 0 0 0 3px rgba(255, 122, 20, .2), 0 2px 5px rgba(17, 24, 39, .14); }
         .auth-reference .auth-field.has-error, .auth-reference .auth-field.has-error:focus-within { border-color: #b42318; }
         .auth-reference .auth-field input { width: 0; min-width: 0; flex: 1 1 auto; overflow: hidden; border: 0; outline: 0; background: transparent; color: #111827; font-size: clamp(14px, 3.7vw, 17px); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
         .auth-reference .auth-field input::placeholder { color: #4b5563; opacity: 1; }
        .auth-reference .auth-prefix { display: flex; flex: 0 1 auto; min-width: 0; align-items: center; gap: clamp(6px, 2.15vw, 11px); margin-right: clamp(5px, 1.56vw, 8px); border: 0; padding: 0; background: transparent; color: #111827; font-size: clamp(20px, 5.47vw, 28px); line-height: 1; white-space: nowrap; }
        .auth-reference .auth-prefix svg { width: clamp(25px, 6.25vw, 32px); height: clamp(25px, 6.25vw, 32px); flex: none; stroke-width: 2.7; }
         .auth-reference .auth-prefix .auth-country-arrow { width: 17px; height: 17px; stroke-width: 2; }
        .auth-reference .auth-field-icon { width: clamp(27px, 6.64vw, 34px); height: clamp(27px, 6.64vw, 34px); flex: none; margin-right: clamp(7px, 1.95vw, 10px); color: #111827; stroke-width: 2.9; }
         .auth-reference .auth-visibility { display: grid; width: 34px; height: 42px; flex: none; place-items: center; margin-left: 6px; border: 0; padding: 0; background: transparent; color: #374151; cursor: pointer; }
         .auth-reference .auth-visibility svg { width: 21px; height: 21px; }
         .auth-reference .auth-visibility:focus-visible, .auth-reference .auth-prefix:focus-visible { outline: 2px solid #ff7a14; outline-offset: 2px; border-radius: 5px; }
          .auth-reference .auth-switch { display: block; max-width: 100%; width: fit-content; margin: 18px 0 0 auto; border: 0; padding: 0; background: transparent; color: #111827; font-size: clamp(16px, 3.9vw, 20px); font-weight: 400; line-height: 28px; text-align: right; text-decoration: underline; text-underline-offset: 2px; }
        .auth-reference .auth-submit { display: grid; width: 100%; min-height: 68px; place-items: center; margin-top: 15px; border: 2px solid #111827; border-radius: 11px; background: #ff7a14; color: #111827; font-size: clamp(23px, 5.66vw, 29px); font-weight: 800; line-height: 1.2; box-shadow: 0 4px 0 #111827, 0 7px 14px rgba(17, 24, 39, .22); cursor: pointer; transition: transform .12s ease, filter .12s ease, box-shadow .12s ease; }
        .auth-reference .auth-submit:hover:not(:disabled) { filter: brightness(.94); }
        .auth-reference .auth-submit:focus-visible { outline: 3px solid #111827; outline-offset: 4px; }
        .auth-reference .auth-submit:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 #111827, 0 3px 7px rgba(17, 24, 39, .22); }
        .auth-reference .auth-submit:disabled { cursor: wait; }
         .auth-reference .auth-error { margin: -10px 0 -6px 4px; color: #b42318; font-size: 13px; font-weight: 600; line-height: 1.35; }
          .auth-reference .auth-illustration-frame { width: 100%; margin: 4px auto 23px; overflow: hidden; border: 2px solid #111827; border-radius: 12px; background: #fff; box-shadow: 0 5px 0 #111827, 0 10px 18px rgba(17, 24, 39, .18); -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
         .auth-reference .auth-illustration { display: block; width: 100%; height: auto; -webkit-user-drag: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
        @media (max-width: 370px) {
          .auth-register .auth-panel { padding-right: 22px; padding-left: 22px; }
          .auth-reference .auth-field { height: 64px; }
          .auth-reference .auth-fields { gap: 16px; }
          .auth-reference .auth-prefix { margin-right: 5px; }
          .auth-reference .auth-field-icon { margin-right: 8px; }
          .auth-reference .auth-submit { min-height: 64px; }
        }
      `}</style>

      <div className="auth-screen">
        <section className="auth-panel">
          <h1 className="auth-title">ChargePoint</h1>
          <div className="auth-illustration-frame" onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}>
            <img className="auth-illustration" src={registerIllustration} alt="Borne domestique et station de recharge ChargePoint" draggable={false} />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <input type="hidden" {...form.register("country")} />

            <div className="auth-fields">
               <div className={`auth-field${form.formState.errors.phone || form.formState.errors.country ? " has-error" : ""}`}>
                 <button type="button" className="auth-prefix" onClick={() => setCountryModalOpen(true)} data-testid="button-select-country" aria-label={`Choisir le pays${countryData ? `, ${countryData.name}, indicatif +${displayedPrefix}` : ""}`} aria-haspopup="dialog" aria-expanded={countryModalOpen} aria-describedby={form.formState.errors.country ? "register-country-error" : undefined}>
                   <Globe2 aria-hidden="true" />
                  <span>+{displayedPrefix}</span>
                   <ChevronDown className="auth-country-arrow" aria-hidden="true" />
                </button>
                 <input {...form.register("phone")} type="tel" inputMode="tel" autoComplete="username" placeholder="Numéro de téléphone" aria-label="Numéro de téléphone" aria-invalid={!!form.formState.errors.phone} aria-describedby={form.formState.errors.phone ? "register-phone-error" : undefined} data-testid="input-phone" />
              </div>
               {form.formState.errors.country && <p id="register-country-error" role="alert" className="auth-error">{form.formState.errors.country.message}</p>}
               {form.formState.errors.phone && <p id="register-phone-error" role="alert" className="auth-error">{form.formState.errors.phone.message}</p>}

               <div className={`auth-field${form.formState.errors.password ? " has-error" : ""}`}>
                <LockKeyhole className="auth-field-icon" aria-hidden="true" />
                 <input {...form.register("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Mot de passe" aria-label="Mot de passe" aria-invalid={!!form.formState.errors.password} aria-describedby={form.formState.errors.password ? "register-password-error" : undefined} data-testid="input-password" />
                 <button type="button" className="auth-visibility" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword}>
                   {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                 </button>
              </div>
               {form.formState.errors.password && <p id="register-password-error" role="alert" className="auth-error">{form.formState.errors.password.message}</p>}

               <div className={`auth-field${form.formState.errors.confirmPassword ? " has-error" : ""}`}>
                <LockKeyhole className="auth-field-icon" aria-hidden="true" />
                 <input {...form.register("confirmPassword")} type={showConfirmation ? "text" : "password"} autoComplete="new-password" placeholder="Confirmer le mot de passe" aria-label="Confirmer le mot de passe" aria-invalid={!!form.formState.errors.confirmPassword} aria-describedby={form.formState.errors.confirmPassword ? "register-confirm-error" : undefined} data-testid="input-confirm-password" />
                 <button type="button" className="auth-visibility" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? "Masquer la confirmation" : "Afficher la confirmation"} aria-pressed={showConfirmation}>
                   {showConfirmation ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                 </button>
              </div>
               {form.formState.errors.confirmPassword && <p id="register-confirm-error" role="alert" className="auth-error">{form.formState.errors.confirmPassword.message}</p>}

              <div className="auth-field">
                <Code2 className="auth-field-icon" aria-hidden="true" />
                 <input {...form.register("invitationCode")} placeholder="Code d'invitation" aria-label="Code d'invitation" data-testid="input-invitation-code" />
              </div>
            </div>

            <button type="button" className="auth-switch" onClick={() => navigate("/login")} data-testid="link-login">Aller à la connexion &gt;</button>
            <button type="submit" disabled={isLoading} className="auth-submit" data-testid="button-register">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "S'inscrire"}
            </button>
          </form>
        </section>
      </div>

      <CountrySelector selectedCountryCode={selectedCountry} open={countryModalOpen} onClose={() => setCountryModalOpen(false)} onSelect={(code) => form.setValue("country", code, { shouldValidate: true })} />
    </main>
  );
}

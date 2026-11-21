import { Crest } from "@/components/Crest";
import { BRAND } from "@/lib/brand";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="royal-panel grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Crest className="mx-auto h-14 w-14" />
          <p className="mt-3 text-3xl font-semibold tracking-wide text-gold-200 font-[family-name:var(--font-display)]">{BRAND.name}</p>
          <div className="gold-rule mt-3" />
        </div>
        <div className="card border-gold-500 p-6">
          <h1 className="text-2xl font-semibold text-royal-900">Curator sign in</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

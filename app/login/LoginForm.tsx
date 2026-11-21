"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-gold w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

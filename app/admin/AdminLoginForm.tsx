"use client";

import { useActionState } from "react";
import { signInAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className="admin-form-error">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

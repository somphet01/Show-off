"use client";

import { useActionState, useEffect } from "react";
import { playFeedbackTone } from "../lib/feedback-tone";
import { signInAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);

  useEffect(() => {
    if (state.error) {
      playFeedbackTone("error");
    }
  }, [state.error]);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        <span>ອີເມວ</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>ລະຫັດຜ່ານ</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className="admin-form-error">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "ກຳລັງເຂົ້າ..." : "ເຂົ້າລະບົບ"}
      </button>
    </form>
  );
}

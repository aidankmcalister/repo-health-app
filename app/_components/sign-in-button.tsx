"use client";

import { signIn } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      onClick={() => signIn.social({ provider: "github", callbackURL: "/" })}
    >
      Sign in with GitHub
    </Button>
  );
}

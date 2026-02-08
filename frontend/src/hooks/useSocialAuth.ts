import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useCallback } from "react";

export type SocialProvider = "oauth_google" | "oauth_facebook" | "oauth_apple";

export function useClerkSocial() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const loginWithSocial = useCallback(
    async (provider: SocialProvider) => {
      if (!signInLoaded || !signUpLoaded) {
        throw new Error("Clerk not loaded yet");
      }

      try {
        // Versuche zuerst Sign In
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: "/auth/callback",
          redirectUrlComplete: "/dashboard",
        });
      } catch (error) {
        console.error(`${provider} login error:`, error);
        throw error;
      }
    },
    [signIn, signInLoaded, signUpLoaded]
  );

  const loginWithGoogle = useCallback(
    () => loginWithSocial("oauth_google"),
    [loginWithSocial]
  );
  const loginWithFacebook = useCallback(
    () => loginWithSocial("oauth_facebook"),
    [loginWithSocial]
  );
  const loginWithApple = useCallback(
    () => loginWithSocial("oauth_apple"),
    [loginWithSocial]
  );

  return {
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
    loginWithSocial,
  };
}

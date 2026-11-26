import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
      onboarded: boolean;
      defaultCurrency: string;
      country: string;
    } & Omit<NonNullable<DefaultSession["user"]>, "id" | "name" | "image">;
  }
}

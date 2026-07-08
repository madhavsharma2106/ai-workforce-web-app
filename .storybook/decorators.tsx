import type { Decorator } from "@storybook/react-vite";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const mockRouter: AppRouterInstance = {
  push: (href) => console.log("router.push", href),
  replace: (href) => console.log("router.replace", href),
  refresh: () => console.log("router.refresh"),
  back: () => console.log("router.back"),
  forward: () => console.log("router.forward"),
  prefetch: () => {},
};

/** Stubs the Next.js App Router context so components calling `useRouter()` don't throw. */
export const withAppRouterMock: Decorator = (Story) => (
  <AppRouterContext.Provider value={mockRouter}>
    <Story />
  </AppRouterContext.Provider>
);

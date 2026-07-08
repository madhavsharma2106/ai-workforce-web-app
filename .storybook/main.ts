import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(viteConfig, {
      plugins: [tsconfigPaths(), tailwindcss()],
      // next/link and next/navigation read `process.env.*` at module load
      // time; Vite doesn't polyfill `process` in the browser like webpack
      // does, so without this every story importing them throws.
      define: {
        "process.env": {},
      },
    });
  },
};

export default config;

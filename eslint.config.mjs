import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["node_modules/**", "scripts/create-sub-lane.js"],
  },
];

export default eslintConfig;

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // Existing components synchronize browser APIs and UI state after mount.
      // Keep the rule visible as a warning while that baseline is migrated.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;

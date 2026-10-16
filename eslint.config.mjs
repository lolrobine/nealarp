import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // Browser snapshots and derived UI no longer need cascading effect updates.
      // Reject regressions instead of restoring the old warning baseline.
      "react-hooks/set-state-in-effect": "error",
    },
  },
];

export default eslintConfig;

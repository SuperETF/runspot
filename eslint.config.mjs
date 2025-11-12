import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Kakao Maps API는 TypeScript 타입이 없으므로 any 타입 허용
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      // React Hook 의존성 경고를 완화
      "react-hooks/exhaustive-deps": "warn",
      // 사용하지 않는 변수 경고로 변경
      "@typescript-eslint/no-unused-vars": "warn",
      // JSX에서 이스케이프되지 않은 엔티티 경고로 변경
      "react/no-unescaped-entities": "warn",
      // Next.js 이미지 경고로 변경
      "@next/next/no-img-element": "warn",
      "@next/next/no-before-interactive-script-outside-document": "warn",
    },
  },
];

export default eslintConfig;

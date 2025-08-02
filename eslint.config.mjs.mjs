import next from 'eslint-plugin-next';

export default [
  {
    plugins: { next },
    extends: ['next/core-web-vitals'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];

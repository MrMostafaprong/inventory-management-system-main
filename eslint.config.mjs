// Flat config بسيط — يمنع كسر `npm run lint` (كانت المشكلة: لا يوجد أي ملف إعداد).
export default [
  { ignores: ['.next/**', 'dist/**', 'node_modules/**'] },
  {
    rules: {
      'no-debugger': 'error',
      'no-eval': 'error',
    },
  },
]

/**
 * saras/semantic-colors
 *
 * Flags raw Tailwind colour classes (e.g. `text-slate-700`, `bg-indigo-600`)
 * outside `src/components/ui/`. Modules must use semantic tokens via
 * arbitrary value syntax: `text-[color:var(--color-text)]`,
 * `bg-[color:var(--color-accent)]`, etc.
 *
 * Background: v2 leaked colour decisions across all 14 modules. Re-theming
 * (or fixing a colour decision once) required edits in dozens of files.
 * v3 forces semantic tokens. UI primitives are exempt — they're the
 * one place that owns the design language.
 */

const TW_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]
const TW_PROPS = [
  'text', 'bg', 'border', 'ring', 'fill', 'stroke', 'from', 'via', 'to',
  'placeholder', 'caret', 'accent', 'decoration', 'divide', 'outline',
  'shadow',
]

// Build regex once: matches e.g. `text-slate-700`, `bg-indigo-600/50`, `hover:text-blue-500`
const RAW_COLOR_REGEX = new RegExp(
  `(?:^|\\s|:)(?:${TW_PROPS.join('|')})-(?:${TW_COLORS.join('|')})-\\d{2,3}(?:/\\d{1,3})?\\b`,
)

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Raw Tailwind colour classes (text-slate-700 etc) only allowed in src/components/ui/. Use semantic tokens elsewhere.',
    },
    schema: [],
    messages: {
      raw:
        'Raw Tailwind colour "{{ match }}" found outside src/components/ui/. Use semantic tokens (text-[color:var(--color-text)] etc).',
    },
  },
  create(context) {
    // Allow this rule's logic to skip files inside the design-system home
    const filename = context.filename || context.getFilename?.() || ''
    const normalized = filename.replace(/\\/g, '/')
    if (
      normalized.includes('/src/components/ui/') ||
      normalized.includes('/eslint-plugin-saras/') ||
      normalized.endsWith('.test.ts') ||
      normalized.endsWith('.test.tsx')
    ) {
      return {}
    }

    /** Check a string literal value for raw color classes. */
    function checkString(value, node) {
      if (typeof value !== 'string') return
      const m = RAW_COLOR_REGEX.exec(value)
      if (m) {
        context.report({ node, messageId: 'raw', data: { match: m[0].trim() } })
      }
    }

    return {
      Literal(node) {
        checkString(node.value, node)
      },
      TemplateElement(node) {
        checkString(node.value && node.value.cooked, node)
      },
      // JSX className={`...`} as a JSXExpressionContainer — handled via TemplateElement above
    }
  },
}

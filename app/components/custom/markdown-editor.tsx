import { useEffect, useRef } from "react"
import { Textarea } from "../ui/textarea"

interface Props {
  value: string
  onChange: (v: string) => void
}

/**
 * Plain native <textarea> editor.
 * Native textareas have full touch support for multi-line selection,
 * unlike contenteditable / CodeMirror which often break on touch devices.
 */
export function MarkdownEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Tab key inserts two spaces instead of moving focus
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault()
        const start = el.selectionStart
        const end = el.selectionEnd
        const next = el.value.slice(0, start) + "  " + el.value.slice(end)
        onChange(next)
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2
        })
      }
    }
    el.addEventListener("keydown", onKey)
    return () => el.removeEventListener("keydown", onKey)
  }, [onChange])

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      className="h-full w-full resize-none border-0 bg-card p-6 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-0"
      style={{
        WebkitUserSelect: "text",
        userSelect: "text",
        touchAction: "manipulation",
      }}
    />
  )
}

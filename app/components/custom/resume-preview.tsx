import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkDeflist from "remark-deflist"
import rehypeRaw from "rehype-raw"
import yaml from "js-yaml"
import { forwardRef, useMemo } from "react"
import { Icon } from "@iconify/react"

interface HeaderItem {
  text: string
  link?: string
  newLine?: boolean
}

interface Props {
  markdown: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  paperSize: "A4" | "Letter"
}

// Replace <span class="iconify" data-icon="..."></span> with <Icon /> components.
// We render the body via react-markdown's rehype-raw, but iconify spans render
// as empty spans by default. We post-process the resulting markdown body by
// converting iconify spans to inline SVG markup using @iconify/react isn't
// trivial in the markdown pipeline, so we render header items separately and
// strip iconify spans inside body markdown into plain text-friendly icons via
// a custom span renderer.
function renderInline(text: string) {
  // Split into pieces, replacing iconify spans with <Icon/>
  const parts: (string | { icon: string })[] = []
  const re = /<span\s+class="iconify"\s+data-icon="([^"]+)"\s*><\/span>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push({ icon: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i} dangerouslySetInnerHTML={{ __html: p }} />
    ) : (
      <Icon key={i} icon={p.icon} className="resume-icon" inline />
    )
  )
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(
  function ResumePreview(
    { markdown, fontFamily, fontSize, lineHeight, paperSize }: Props,
    ref
  ) {
    const dims =
      paperSize === "A4"
        ? { w: "210mm", minH: "297mm" }
        : { w: "8.5in", minH: "11in" }

    const { name, header, body } = useMemo(() => {
      const m = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
      if (!m) return { name: "", header: [] as HeaderItem[], body: markdown }
      try {
        const data = (yaml.load(m[1]) as any) || {}
        return {
          name: (data.name as string) || "",
          header: (data.header as HeaderItem[]) || [],
          body: m[2],
        }
      } catch {
        return { name: "", header: [] as HeaderItem[], body: markdown }
      }
    }, [markdown])

    // Group header items into lines using `newLine: true` as a line break marker.
    const headerLines: HeaderItem[][] = []
    header.forEach((item) => {
      if (item.newLine || headerLines.length === 0) headerLines.push([item])
      else headerLines[headerLines.length - 1].push(item)
    })

    // Custom renderer that converts inline iconify spans inside markdown body
    const components = {
      span: ({ node, ...props }: any) => {
        if (props.className === "iconify" && props["data-icon"]) {
          return (
            <Icon icon={props["data-icon"]} className="resume-icon" inline />
          )
        }
        return <span {...props} />
      },
    }

    return (
      <div
        ref={ref}
        className="resume-paper"
        style={{ width: dims.w, minHeight: dims.minH }}
      >
        <div
          className="resume-content"
          style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
        >
          {name && <div className="resume-header-name">{name}</div>}
          {headerLines.length > 0 && (
            <div className="resume-header">
              {headerLines.map((line, i) => (
                <div key={i} className="resume-header-line">
                  {line.map((item, j) => (
                    <span
                      key={j}
                      className={`resume-header-item${j === line.length - 1 ? "no-separator" : ""}`}
                    >
                      {item.link ? (
                        <a href={item.link}>
                          {renderInline((item.text ?? "").trim())}
                        </a>
                      ) : (
                        renderInline((item.text ?? "").trim())
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkDeflist]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {body}
          </ReactMarkdown>
        </div>
      </div>
    )
  }
)

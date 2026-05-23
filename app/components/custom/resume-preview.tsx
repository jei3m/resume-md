import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkDeflist from "remark-deflist"
import rehypeRaw from "rehype-raw"
import yaml from "js-yaml"
import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react"
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

interface Section {
  heading: string
  content: string
}

function splitBodyIntoSections(body: string): Section[] {
  const sections: Section[] = []
  const lines = body.split("\n")
  let currentSection: string[] = []
  let currentHeading = ""

  const flush = () => {
    const trimmed = currentSection.join("\n").trim()
    if (currentHeading || trimmed) {
      sections.push({ heading: currentHeading, content: trimmed })
    }
    currentSection = []
  }

  for (const line of lines) {
    const m = line.match(/^## (.+)$/)
    if (m) {
      flush()
      currentHeading = m[1]
    } else {
      currentSection.push(line)
    }
  }
  flush()

  return sections
}

function renderInline(text: string) {
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

const markdownComponents = {
  span: ({ node, ...props }: any) => {
    if (props.className === "iconify" && props["data-icon"]) {
      return (
        <Icon icon={props["data-icon"]} className="resume-icon" inline />
      )
    }
    return <span {...props} />
  },
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(
  function ResumePreview(
    { markdown, fontFamily, fontSize, lineHeight, paperSize }: Props,
    ref
  ) {
    const dims =
      paperSize === "A4"
        ? { w: "210mm", h: "297mm" }
        : { w: "8.5in", h: "11in" }

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

    const headerLines: HeaderItem[][] = []
    header.forEach((item) => {
      if (item.newLine || headerLines.length === 0) headerLines.push([item])
      else headerLines[headerLines.length - 1].push(item)
    })

    const sections = useMemo(() => splitBodyIntoSections(body), [body])

    const contentBlocks = useMemo(() => {
      const blocks: React.ReactNode[] = []
      let key = 0

      if (name) {
        blocks.push(
          <div key={key++} className="resume-header-name">
            {name}
          </div>
        )
      }

      if (headerLines.length > 0) {
        blocks.push(
          <div key={key++} className="resume-header">
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
        )
      }

      for (const section of sections) {
        blocks.push(
          <div key={key++} className="resume-section">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkDeflist]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {section.heading
                ? `## ${section.heading}\n\n${section.content}`
                : section.content}
            </ReactMarkdown>
          </div>
        )
      }

      return blocks
    }, [name, headerLines, sections])

    const [pageBlockIndices, setPageBlockIndices] = useState<number[][] | null>(
      null
    )
    const measuringRef = useRef<HTMLDivElement>(null)
    const prevSplitKey = useRef("")

    useLayoutEffect(() => {
      const container = measuringRef.current
      if (!container) return

      const contentEl = container.querySelector(".resume-content")
      if (!contentEl) return

      const children = Array.from(contentEl.children)
      if (children.length === 0) {
        setPageBlockIndices([])
        return
      }

      const style = getComputedStyle(container)
      const padTop = parseFloat(style.paddingTop) || 0
      const padBottom = parseFloat(style.paddingBottom) || 0
      // The -10px margin-top on .resume-content gives 10px extra effective space
      const contentAreaHeight = container.clientHeight - padTop - padBottom + 10

      if (contentAreaHeight <= 0) return

      const breaks: number[] = []
      let acc = 0

      for (let i = 0; i < children.length; i++) {
        const h = children[i].getBoundingClientRect().height
        if (acc + h > contentAreaHeight + 0.5 && acc > 0) {
          breaks.push(i)
          acc = h
        } else {
          acc += h
        }
      }

      const groups: number[][] = []
      let start = 0
      for (const b of breaks) {
        groups.push(
          Array.from({ length: b - start }, (_, i) => start + i)
        )
        start = b
      }
      if (start < children.length) {
        groups.push(
          Array.from({ length: children.length - start }, (_, i) => start + i)
        )
      }

      const key = groups.map((g) => g.join(",")).join("|")
      if (key !== prevSplitKey.current) {
        prevSplitKey.current = key
        setPageBlockIndices(groups)
      }
    }, [markdown, fontFamily, fontSize, lineHeight, paperSize])

    return (
      <div ref={ref} style={{ position: "relative" }}>
        <div
          ref={measuringRef}
          className="resume-paper resume-measurer"
          style={{
            width: dims.w,
            height: dims.h,
            overflow: "hidden",
            visibility: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: -1,
            border: 0,
          }}
        >
          <div
            className="resume-content"
            style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
          >
            {contentBlocks}
          </div>
        </div>

        <div className="resume-pages">
          {pageBlockIndices
            ? pageBlockIndices.map((indices, pageIdx) => (
                <div
                  key={pageIdx}
                  className="resume-paper"
                  style={{
                    width: dims.w,
                    height: dims.h,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    className="resume-content"
                    style={{
                      fontFamily,
                      fontSize: `${fontSize}px`,
                      lineHeight,
                    }}
                  >
                    {indices.map((idx) => contentBlocks[idx])}
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    )
  }
)

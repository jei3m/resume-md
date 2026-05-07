import { useCallback, useEffect, useRef, useState } from "react"
import { MarkdownEditor } from "~/components/custom/markdown-editor"
import { ResumePreview } from "~/components/custom/resume-preview"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Slider } from "~/components/ui/slider"
import { DEFAULT_RESUME } from "~/lib/default-resume"
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch"

const FONTS = [
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Source Sans", value: "'Source Sans 3', sans-serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
]

const STORAGE_KEY = "open-resume-md"

function ZoomControls({ scaleDisplay }: { scaleDisplay: number }) {
  const { zoomIn, zoomOut } = useControls()
  const scale = Math.round(scaleDisplay * 100) || 100

  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-muted-foreground">Zoom</Label>
      <Button
        size="sm"
        variant="outline"
        onClick={() => zoomOut(0.3)}
        className="h-7 w-7 p-0"
      >
        −
      </Button>
      <span className="w-10 text-center text-xs tabular-nums">{scale}%</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => zoomIn(0.3)}
        className="h-7 w-7 p-0"
      >
        +
      </Button>
    </div>
  )
}

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_RESUME)
  const [fontFamily, setFontFamily] = useState(FONTS[0].value)
  const [fontSize, setFontSize] = useState(14)
  const [lineHeight, setLineHeight] = useState(1.4)
  const [paperSize, setPaperSize] = useState<"A4" | "Letter">("A4")
  const [tab, setTab] = useState<"editor" | "preview">("editor")
  const [scaleDisplay, setScaleDisplay] = useState(1)
  const resumeRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = useCallback(() => {
    const size = paperSize === "A4" ? "210mm 297mm" : "8.5in 11in"
    document.documentElement.style.setProperty("--print-paper-size", size)
    window.print()
  }, [paperSize])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setMarkdown(saved)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORAGE_KEY, markdown), 300)
    return () => clearTimeout(t)
  }, [markdown])

  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.1}
      maxScale={4}
      wheel={{ disabled: true }}
      pinch={{ disabled: false, step: 0.05 }}
      limitToBounds={true}
      centerOnInit
      doubleClick={{ disabled: true }}
      onZoomStop={(ref) => {
        setScaleDisplay(ref.state.scale)
      }}
    >
      <div className="flex h-screen flex-col bg-background text-foreground">
        {/* Top bar */}
        <header className="print-hidden flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
          <h1 className="mr-2 text-base font-semibold tracking-tight">
            RESUME.md
          </h1>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Font</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <div className="w-24">
                <Slider
                  value={[fontSize]}
                  min={10}
                  max={18}
                  step={0.5}
                  onValueChange={(v) => setFontSize(v[0])}
                />
              </div>
              <span className="w-8 text-xs text-muted-foreground tabular-nums">
                {fontSize}
              </span>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <Label className="text-xs text-muted-foreground">Line</Label>
              <div className="w-24">
                <Slider
                  value={[lineHeight]}
                  min={1.1}
                  max={1.8}
                  step={0.05}
                  onValueChange={(v) => setLineHeight(v[0])}
                />
              </div>
              <span className="w-10 text-xs text-muted-foreground tabular-nums">
                {lineHeight.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <ZoomControls scaleDisplay={scaleDisplay} />
            </div>

            <Select
              value={paperSize}
              onValueChange={(v) => setPaperSize(v as "A4" | "Letter")}
            >
              <SelectTrigger className="h-8 w-[90px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY)
                window.location.reload()
              }}
              className="h-8"
            >
              Delete
            </Button>

            <Button
              size="sm"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, markdown)
              }}
              className="h-8"
            >
              Save
            </Button>

            <Button size="sm" onClick={handleExportPDF} className="h-8">
              Export PDF
            </Button>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="print-hidden flex border-b border-border bg-card md:hidden">
          <button
            onClick={() => setTab("editor")}
            className={`flex-1 py-2 text-sm font-medium ${
              tab === "editor"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setTab("preview")}
            className={`flex-1 py-2 text-sm font-medium ${
              tab === "preview"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Preview
          </button>
        </div>

        {/* Split */}
        <main className="flex min-h-0 flex-1 flex-col md:flex-row">
          <section
            className={`print-hidden min-h-0 flex-1 border-r border-border bg-card ${
              tab === "editor" ? "flex" : "hidden"
            } md:flex`}
          >
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
          </section>

          <section
            className={`print-visible min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/40 ${
              tab === "preview" ? "flex" : "hidden"
            } md:flex`}
          >
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
            >
              <ResumePreview
                ref={resumeRef}
                markdown={markdown}
                fontFamily={fontFamily}
                fontSize={fontSize}
                lineHeight={lineHeight}
                paperSize={paperSize}
              />
            </TransformComponent>
          </section>
        </main>
      </div>
    </TransformWrapper>
  )
}

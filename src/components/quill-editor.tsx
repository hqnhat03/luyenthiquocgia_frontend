"use client"

import Quill from "quill"
import "quill/dist/quill.snow.css"
import * as React from "react"

interface QuillEditorProps {
  value: string
  onChange: (html: string) => void
  /** Fired when user clicks the image button — parent should open file picker */
  onImageUpload?: () => void
  /** Receives a function to call with the uploaded URL to insert the image at cursor */
  onInsertImageReady?: (insertFn: (url: string) => void) => void
  placeholder?: string
  minHeight?: number
  showImage?: boolean
}

export function QuillEditor({
  value,
  onChange,
  onInsertImageReady,
  placeholder = "Nhập nội dung...",
  minHeight = 180,
}: QuillEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const quillRef = React.useRef<Quill | null>(null)
  const onChangeRef = React.useRef(onChange)
  const isInternalChange = React.useRef(false)

  // Keep latest callback refs without re-mounting
  React.useEffect(() => { onChangeRef.current = onChange }, [onChange])

  React.useEffect(() => {
    if (!containerRef.current || quillRef.current) return
    const container = containerRef.current

    // Clear container to prevent duplicate toolbars on re-mount/HMR
    container.innerHTML = ""
    // Create a dedicated editor element inside the container
    const editorDiv = document.createElement("div")
    container.appendChild(editorDiv)

    const toolbarOptions = [
      ["bold", "italic", "underline", "strike"],
      [{ header: [1, 2, 3, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ]

    const quill = new Quill(editorDiv, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {},
        },
      },
    })

    quill.root.style.minHeight = `${minHeight}px`
    quill.root.style.fontFamily = "inherit"

    // Seed initial HTML value
    if (value) {
      quill.root.innerHTML = value
    }

    // Expose insert-image function to parent
    onInsertImageReady?.((url: string) => {
      const range = quill.getSelection(true)
      quill.insertEmbed(range.index, "image", url, Quill.sources.USER)
      quill.setSelection(range.index + 1, 0, Quill.sources.SILENT)
    })

    quill.on("text-change", () => {
      isInternalChange.current = true
      const html = quill.root.innerHTML
      onChangeRef.current(html === "<p><br></p>" ? "" : html)
      isInternalChange.current = false
    })

    quillRef.current = quill

    return () => {
      quillRef.current = null
      if (container) {
        container.innerHTML = ""
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync value coming from API load only (not from internal edits)
  React.useEffect(() => {
    const quill = quillRef.current
    if (!quill || isInternalChange.current) return
    if (quill.root.innerHTML !== value) {
      quill.root.innerHTML = value || ""
    }
  }, [value])

  return <div ref={containerRef} className="quill-custom" />
}

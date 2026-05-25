"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

import api from "@/lib/axios"
import {
  AlertCircle,
  ChevronLeft,
  Copy,
  Edit2,
  GripVertical,
  HelpCircle,
  Plus,
  Save,
  Trash2
} from "lucide-react"
import dynamic from "next/dynamic"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

// Dynamic import — Quill touches `document` so we skip SSR
const QuillEditor = dynamic(
  () => import("@/components/quill-editor").then((m) => m.QuillEditor),
  { ssr: false, loading: () => <div className="min-h-[100px] animate-pulse bg-muted/30 rounded-b-xl" /> }
)

interface Question {
  id: string
  exam_id: number
  question: string
  type: "multiple_choice" | "essay"
  options: string[] | null
  correct_answer: string | null
  score: number
  order_number: number
  choice_ids?: (number | null)[]
}

export default function ExamQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = params.id as string
  const isViewOnly = searchParams.get("mode") === "view"

  const [questions, setQuestions] = React.useState<Question[]>([])
  const [editingIds, setEditingIds] = React.useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const [classTestTitle, setClassTestTitle] = React.useState<string>("")
  const [deletedIds, setDeletedIds] = React.useState<number[]>([])

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  // Per-question refs to Quill insertEmbed (passed via callback from QuillEditor)
  const insertImageRefs = React.useRef<Record<string, (url: string) => void>>({})
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uploadingQIdRef = React.useRef<string | null>(null)

  const fetchQuestions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/teacher/test-questions", {
        params: { test_id: examId }
      })
      const testTitle = response.data?.data?.class_test_title || ""
      setClassTestTitle(testTitle)

      const questionsData = response.data?.data?.questions || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = questionsData.map((bq: any, index: number) => {
        const options = bq.choices && bq.choices.length > 0
          ? Array.from({ length: 4 }, (_, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const choice = bq.choices.find((c: any) => Number(c.choice_no) === idx + 1)
              return choice ? choice.content : ""
            })
          : ["", "", "", ""]

        const choice_ids = bq.choices && bq.choices.length > 0
          ? Array.from({ length: 4 }, (_, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const choice = bq.choices.find((c: any) => Number(c.choice_no) === idx + 1)
              return choice ? choice.id : null
            })
          : [null, null, null, null]

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const correctChoice = bq.choices?.find((c: any) => Number(c.choice_no) === Number(bq.correct_answer))
        const correct_answer = correctChoice ? correctChoice.content : ""

        return {
          id: String(bq.id),
          exam_id: bq.test_id,
          question: bq.content || "",
          type: "multiple_choice",
          options,
          correct_answer,
          score: bq.score || 1,
          order_number: bq.question_no || index + 1,
          choice_ids
        }
      })

      mapped.sort((a: Question, b: Question) => (a.order_number || 0) - (b.order_number || 0))
      setQuestions(mapped)
    } catch (error) {
      console.error("Failed to fetch questions:", error)
      toast.error("Không thể tải danh sách câu hỏi")
    } finally {
      setIsLoading(false)
    }
  }, [examId])

  React.useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const addQuestion = () => {
    const newId = uuidv4()
    setQuestions((prev) => {
      const nextOrder = prev.length > 0 ? Math.max(...prev.map((q) => q.order_number || 0)) + 1 : 1
      const newQuestion: Question = {
        id: newId,
        exam_id: parseInt(examId),
        question: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correct_answer: "",
        score: 1,
        order_number: nextOrder,
      }
      return [...prev, newQuestion]
    })
    setEditingIds((prev) => [...prev, newId])
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    }, 100)
  }

  const removeQuestion = (id: string) => {
    const numericId = Number(id)
    if (!isNaN(numericId)) {
      setDeletedIds((prev) => [...prev, numericId])
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    setEditingIds((prev) => prev.filter((eId) => eId !== id))
    delete insertImageRefs.current[id]
  }

  const duplicateQuestion = (q: Question) => {
    const newId = uuidv4()
    setQuestions((prev) => {
      const index = prev.findIndex((item) => item.id === q.id)
      if (index === -1) return prev

      const sourceQuestion = prev[index]
      const duplicated: Question = {
        ...sourceQuestion,
        id: newId,
        options: sourceQuestion.options ? [...sourceQuestion.options] : ["", "", "", ""],
        choice_ids: undefined,
        order_number: sourceQuestion.order_number + 1,
      }

      const nextQuestions = [...prev]
      nextQuestions.splice(index + 1, 0, duplicated)

      return nextQuestions.map((item, idx) => ({
        ...item,
        order_number: idx + 1,
      }))
    })

    setEditingIds((prev) => [...prev, newId])
    toast.success("Đã nhân bản câu hỏi")
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const updateOption = (qId: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId && q.options) {
          const oldVal = q.options[index]
          const newOptions = [...q.options]
          newOptions[index] = value

          // If the edited option was the correct one, update the correct_answer value
          const wasCorrect = q.correct_answer === oldVal
          return {
            ...q,
            options: newOptions,
            correct_answer: wasCorrect ? value : q.correct_answer
          }
        }
        return q
      })
    )
  }

  const toggleEdit = (id: string, editing: boolean) => {
    if (editing) {
      setEditingIds((prev) => [...prev, id])
    } else {
      setEditingIds((prev) => prev.filter((eId) => eId !== id))
    }
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      return
    }
    // Reorder
    setQuestions((prev) => {
      const newQuestions = [...prev]
      const [removed] = newQuestions.splice(draggedIndex, 1)
      newQuestions.splice(targetIndex, 0, removed)
      return newQuestions.map((q, i) => ({ ...q, order_number: i + 1 }))
    })
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // ------------------------------

  const handleSaveQuestion = (q: Question) => {
    const hasImage = q.question.includes("<img")
    const hasText = q.question.replace(/<[^>]*>/g, "").trim().length > 0
    
    if (!hasImage && !hasText) {
      toast.error(`Câu hỏi đang để trống`)
      return
    }
    if (q.type === "multiple_choice") {
      if (!q.options?.every((opt) => opt.trim())) {
        toast.error(`Vui lòng điền đầy đủ đáp án`)
        return
      }
      if (!q.correct_answer) {
        toast.error(`Vui lòng chọn đáp án đúng`)
        return
      }
    }
    toggleEdit(q.id, false)
  }

  // Called by QuillEditor when user clicks the image button in the toolbar
  const handleImageRequest = (qId: string) => {
    uploadingQIdRef.current = qId
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const currentQId = uploadingQIdRef.current
    if (!file || !currentQId) return

    const uploadProcess = async () => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", "questions")
      const { data } = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data.data.public_url as string
    }

    toast.promise(uploadProcess(), {
      loading: "Đang tải ảnh lên...",
      success: (url) => {
        // Insert image into Quill at cursor via the registered callback
        insertImageRefs.current[currentQId]?.(url)
        return "Tải ảnh lên thành công!"
      },
      error: (err) => {
        console.error("Upload failed:", err)
        return "Lỗi tải ảnh. Vui lòng thử lại."
      },
    })

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const onSave = async () => {
    if (questions.length === 0) {
      toast.error("Vui lòng thêm ít nhất một câu hỏi")
      return
    }

    const createdPayload: any[] = []
    const updatedPayload: any[] = []

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const hasImage = q.question.includes("<img")
      const hasText = q.question.replace(/<[^>]*>/g, "").trim().length > 0

      if (!hasImage && !hasText) {
        toast.error(`Câu hỏi số ${i + 1} đang để trống`)
        return
      }
      if (!q.options?.every((opt) => opt.trim())) {
        toast.error(`Vui lòng điền đầy đủ 4 đáp án cho câu hỏi số ${i + 1}`)
        return
      }
      if (!q.correct_answer) {
        toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi số ${i + 1}`)
        return
      }

      const choiceIndex = q.options.indexOf(q.correct_answer)
      const correct_answer = choiceIndex !== -1 ? choiceIndex + 1 : 1

      const mappedChoices = Array.from({ length: 4 }, (_, idx) => {
        const choiceContent = q.options?.[idx] || ""
        const choiceId = q.choice_ids?.[idx]
        if (choiceId) {
          return {
            id: choiceId,
            choice_no: idx + 1,
            content: choiceContent
          }
        }
        return {
          choice_no: idx + 1,
          content: choiceContent
        }
      })

      const numericId = Number(q.id)
      if (!isNaN(numericId)) {
        updatedPayload.push({
          id: numericId,
          question_no: q.order_number || i + 1,
          content: q.question,
          correct_answer,
          choices: mappedChoices
        })
      } else {
        createdPayload.push({
          question_no: q.order_number || i + 1,
          content: q.question,
          correct_answer,
          choices: mappedChoices.map(c => ({
            choice_no: c.choice_no,
            content: c.content
          }))
        })
      }
    }

    setIsSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        test_id: parseInt(examId)
      }
      if (createdPayload.length > 0) payload.created = createdPayload
      if (updatedPayload.length > 0) payload.updated = updatedPayload
      if (deletedIds.length > 0) payload.deleted = deletedIds

      await api.post("/teacher/test-questions/create", payload)
      toast.success("Cập nhật câu hỏi thành công")
      router.push("/exams")
    } catch (error) {
      console.error("Failed to save questions:", error)
      toast.error("Có lỗi xảy ra khi lưu câu hỏi")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Đang tải câu hỏi...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Hidden file input triggered by Quill's image handler */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Sticky header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary">
              {isViewOnly ? "Chi tiết câu hỏi" : "Cập nhật câu hỏi"}: {classTestTitle || "Bài kiểm tra"}
            </h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
              Exam ID: {examId}
            </p>
          </div>
        </div>
        {!isViewOnly && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={addQuestion}
              className="rounded-lg font-bold border-2 border-primary/20 hover:border-primary/40"
            >
              <Plus className="size-4 mr-2" />
              Thêm câu hỏi
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="rounded-lg font-black px-8 shadow-lg shadow-primary/20 bg-primary hover:scale-105 transition-transform"
            >
              {isSaving ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Question list */}
      <div className="space-y-8 pb-24">
        {questions.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl space-y-4 bg-muted/30">
            <div className="mx-auto size-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <HelpCircle className="size-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black">Chưa có câu hỏi nào</h3>
              <p className="text-muted-foreground font-medium">
                Bắt đầu bằng cách thêm câu hỏi đầu tiên cho bài kiểm tra này.
              </p>
            </div>
            <Button onClick={addQuestion} size="lg" className="rounded-xl font-bold shadow-xl shadow-primary/10">
              <Plus className="size-5 mr-2" />
              Thêm câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          questions.map((q, index) => {
            const isEditing = !isViewOnly && editingIds.includes(q.id)
            const isDragOver = dragOverIndex === index
            const isDragged = draggedIndex === index

            if (!isEditing) {
              return (
                <Card
                  key={q.id}
                  draggable={!isViewOnly}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group overflow-hidden border rounded-lg hover:border-primary/30 transition-all shadow-sm bg-card cursor-pointer ${isDragged ? 'opacity-40 scale-[0.98] border-dashed border-primary ring-2 ring-primary/20' : ''
                    } ${isDragOver && !isDragged ? 'border-primary border-t-4 border-t-primary scale-[1.01] shadow-lg' : ''}`}
                  onClick={() => {
                    if (!isViewOnly) {
                      toggleEdit(q.id, true)
                    }
                  }}
                >
                  <CardContent className="p-4 flex gap-4 items-start relative">
                    <div className={`flex flex-col items-center gap-1 mt-1 text-muted-foreground/30 transition-colors ${!isViewOnly ? 'cursor-grab active:cursor-grabbing hover:text-primary' : ''}`}>
                      {!isViewOnly && <GripVertical className="size-4" />}
                      <div className="bg-primary/5 border border-primary/10 text-primary size-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
                        {q.order_number || index + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 pr-10">
                      <div
                        className="text-sm font-medium text-foreground [&>p]:m-0 [&>p]:leading-relaxed [&>img]:max-h-[150px] [&>img]:rounded-lg [&>img]:mt-2 [&>img]:shadow-sm whitespace-normal break-words"
                        dangerouslySetInnerHTML={{ __html: q.question }}
                      />
                      {q.type === "multiple_choice" ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                          {["A", "B", "C", "D"].map((label, idx) => (
                            <div
                              key={label}
                              className={`flex items-center gap-2 p-1.5 px-3 rounded-lg border text-sm ${q.correct_answer === q.options?.[idx] && q.options?.[idx] !== ""
                                ? "border-primary/40 bg-primary/10"
                                : "border-border/40 text-muted-foreground bg-muted/20"
                                }`}
                            >
                              <span
                                className={
                                  q.correct_answer === q.options?.[idx] && q.options?.[idx] !== "" ? "font-bold text-primary" : "font-medium"
                                }
                              >
                                {label}.
                              </span>
                              <span className="truncate">{q.options?.[idx]}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50/50 rounded-md inline-block border border-blue-100 mt-2">
                          Câu hỏi tự luận
                        </div>
                      )}
                    </div>

                    {!isViewOnly && (
                      <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md shadow-sm p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleEdit(q.id, true)
                          }}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateQuestion(q)
                          }}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeQuestion(q.id)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            return (
              <Card
                key={q.id}
                draggable={false}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`group overflow-hidden border-2 rounded-xl hover:border-primary/50 transition-all duration-300 shadow-xl shadow-black/5 hover:shadow-primary/10 bg-card/50 backdrop-blur-sm ${isDragOver ? 'border-primary border-t-4 border-t-primary scale-[1.01] shadow-lg' : ''
                  }`}
              >
                {/* Card header */}
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between p-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground size-8 rounded-lg flex items-center justify-center font-black text-sm shadow-md">
                      {q.order_number || index + 1}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateQuestion(q)}
                      className="size-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-transform"
                    >
                      <Copy className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(q.id)}
                      className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-transform"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Card content */}
                <CardContent className="p-4 space-y-4">
                  {/* Quill editor */}
                  <div className="space-y-1">
                    <div className="border rounded-lg overflow-hidden focus-within:border-primary transition-colors bg-background shadow-inner">
                      <QuillEditor
                        value={q.question}
                        onChange={(html) => updateQuestion(q.id, { question: html })}
                        onImageUpload={() => handleImageRequest(q.id)}
                        onInsertImageReady={(fn) => {
                          insertImageRefs.current[q.id] = fn
                        }}
                        placeholder="Nhập nội dung câu hỏi..."
                        minHeight={60}
                      />
                    </div>
                  </div>

                  {/* Multiple choice options */}
                  {q.type === "multiple_choice" && (
                    <div className="pt-2 border-t border-dashed">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {["A", "B", "C", "D"].map((label, idx) => (
                          <div
                            key={label}
                            className={`flex items-center gap-2 p-2 px-3 rounded-lg border transition-all duration-300 ${q.correct_answer === q.options?.[idx] && q.options?.[idx] !== ""
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                              : "border-border/60 bg-muted/10 hover:border-primary/20"
                              }`}
                          >
                            <Checkbox
                              id={`q-${q.id}-opt-${idx}`}
                              checked={q.correct_answer === q.options?.[idx] && q.options?.[idx] !== ""}
                              onCheckedChange={() =>
                                updateQuestion(q.id, { correct_answer: q.options?.[idx] || "" })
                              }
                              className="size-4 rounded border-2"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              <span
                                className={`font-black text-sm transition-colors ${q.correct_answer === q.options?.[idx] && q.options?.[idx] !== ""
                                  ? "text-primary"
                                  : "text-muted-foreground/60"
                                  }`}
                              >
                                {label}.
                              </span>
                              <Input
                                value={q.options?.[idx] || ""}
                                onChange={(e) => updateOption(q.id, idx, e.target.value)}
                                className="border-none bg-transparent shadow-none focus-visible:ring-0 font-medium text-sm h-auto p-0 placeholder:font-normal placeholder:text-muted-foreground/50"
                                placeholder={`Đáp án...`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Essay note */}
                  {q.type === "essay" && (
                    <div className="p-6 rounded-lg bg-blue-50/50 border-2 border-blue-100 border-dashed flex items-start gap-5">
                      <div className="p-3 rounded-lg bg-blue-100 text-blue-600 shadow-sm">
                        <AlertCircle className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-blue-900 text-lg">Chế độ Tự luận</h4>
                        <p className="text-sm text-blue-700 font-bold leading-relaxed">
                          Đối với câu hỏi tự luận, học sinh sẽ trả lời bằng văn bản dài.{" "}
                          <span className="underline decoration-blue-300">
                            Giáo viên sẽ chấm điểm thủ công
                          </span>{" "}
                          sau khi bài kiểm tra kết thúc.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-muted/10 px-4 py-3 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => removeQuestion(q.id)} className="font-bold rounded-lg border-2">
                    Xóa
                  </Button>
                  <Button size="sm" onClick={() => handleSaveQuestion(q)} className="font-bold rounded-lg shadow-md px-6">
                    Hoàn tất
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Floating add button */}
      {!isViewOnly && questions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 group">
          <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <Button
            onClick={addQuestion}
            className="relative rounded-full h-12 px-6 font-bold text-base shadow-xl shadow-primary/30 border-2 border-background hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="size-5 mr-2" />
            Thêm câu hỏi
          </Button>
        </div>
      )}
    </div>
  )
}

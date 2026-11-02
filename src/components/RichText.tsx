'use client'

// React Imports
import { useEffect, useMemo } from 'react'

// Third-party Imports
import DOMPurify from 'dompurify'
import classnames from 'classnames'
import type { Editor } from '@tiptap/react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'

// Style Imports
import '@/libs/styles/tiptapEditor.css'

// Admin authored HTML, sanitized before rendering
export const RichTextView = ({ html, className }: { html?: string | null; className?: string }) => {
  const clean = useMemo(() => (html ? DOMPurify.sanitize(html) : ''), [html])

  if (!clean) {
    return null
  }

  return <div className={classnames('rich-text', className)} dangerouslySetInnerHTML={{ __html: clean }} />
}

const TOOLS = [
  { icon: 'tabler-bold', active: 'bold', run: (e: Editor) => e.chain().focus().toggleBold().run() },
  { icon: 'tabler-italic', active: 'italic', run: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { icon: 'tabler-underline', active: 'underline', run: (e: Editor) => e.chain().focus().toggleUnderline().run() },
  { icon: 'tabler-h-3', active: 'heading', run: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { icon: 'tabler-list', active: 'bulletList', run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  {
    icon: 'tabler-list-numbers',
    active: 'orderedList',
    run: (e: Editor) => e.chain().focus().toggleOrderedList().run()
  }
]

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const state = useEditorState({
    editor,
    selector: ctx => Object.fromEntries(TOOLS.map(tool => [tool.active, ctx.editor?.isActive(tool.active) ?? false]))
  })

  if (!editor || !state) {
    return null
  }

  return (
    <div className='flex flex-wrap gap-2 pli-4 pbs-3'>
      {TOOLS.map(tool => (
        <CustomIconButton
          key={tool.icon}
          size='small'
          variant='tonal'
          {...(state[tool.active] && { color: 'primary' })}
          onClick={() => tool.run(editor)}
        >
          <i className={classnames(tool.icon, { 'text-textSecondary': !state[tool.active] })} />
        </CustomIconButton>
      ))}
    </div>
  )
}

type EditorProps = {
  value: string | null
  onChange: (html: string) => void
  placeholder?: string
}

export const RichTextEditor = ({ value, onChange, placeholder = 'Write instructions…' }: EditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML())
  })

  // Sync when a different record is loaded into the form
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '')
    }
  }, [editor, value])

  return (
    <div className='border rounded'>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className='bs-[180px] overflow-y-auto' />
    </div>
  )
}

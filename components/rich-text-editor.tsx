'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ImageUploadDialog } from './image-upload-dialog'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Undo,
  Redo,
  Eye,
  EyeOff
} from 'lucide-react'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

function addIdsToHeadings(html: string): string {
  // Function to convert heading text to ID
  const textToId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim()
  }

  // Add IDs to h2, h3, and h4 headings
  return html
    .replace(/<h2>([^<]+)<\/h2>/g, (match, text) => {
      const id = textToId(text)
      return `<h2 id="${id}">${text}</h2>`
    })
    .replace(/<h3>([^<]+)<\/h3>/g, (match, text) => {
      const id = textToId(text)
      return `<h3 id="${id}">${text}</h3>`
    })
    .replace(/<h4>([^<]+)<\/h4>/g, (match, text) => {
      const id = textToId(text)
      return `<h4 id="${id}">${text}</h4>`
    })
}

export default function RichTextEditor({ content = '', onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const [editorContent, setEditorContent] = useState(content)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('paragraph')
  const [isInitialized, setIsInitialized] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only update editor content on initial load or when content changes from external source
    if (!isInitialized && editorRef.current) {
      editorRef.current.innerHTML = content
      setEditorContent(content)
      setIsInitialized(true)
    } else if (editorRef.current && content !== editorRef.current.innerHTML) {
      // Only update if content is significantly different (external change, not user typing)
      const currentText = editorRef.current.textContent || ''
      const newText = content.replace(/<[^>]*>/g, '') // Strip HTML for comparison
      
      // If text content is significantly different (more than just formatting), update it
      if (Math.abs(currentText.length - newText.length) > 5 || currentText.trim() === '') {
        // Store cursor position
        const selection = window.getSelection()
        let cursorPosition = 0
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          cursorPosition = range.startOffset
        }
        
        editorRef.current.innerHTML = content
        setEditorContent(content)
        
        // Restore cursor position
        try {
          if (selection && editorRef.current.firstChild) {
            const range = document.createRange()
            range.setStart(editorRef.current.firstChild, Math.min(cursorPosition, editorRef.current.textContent?.length || 0))
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }
  }, [content, isInitialized])

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setEditorContent(newContent)
      onChange?.(newContent)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  const applyFormat = (format: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    let tag = 'p'
    switch (format) {
      case 'h1': tag = 'h1'; break
      case 'h2': tag = 'h2'; break
      case 'h3': tag = 'h3'; break
      case 'h4': tag = 'h4'; break
      case 'blockquote': tag = 'blockquote'; break
      default: tag = 'p'
    }

    execCommand('formatBlock', `<${tag}>`)
    setSelectedFormat(format)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertImage = () => {
    setShowImageDialog(true)
  }

  const handleImageInsert = (url: string, altText?: string) => {
    // Create proper img tag with alt attribute
    const imgTag = `<img src="${url}" alt="${altText || 'Inserted image'}" style="max-width: 100%; height: auto;" />`
    execCommand('insertHTML', imgTag)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b p-2 bg-muted/50">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Format Dropdown */}
          <Select value={selectedFormat} onValueChange={applyFormat}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="h4">Heading 4</SelectItem>
              <SelectItem value="blockquote">Quote</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('strikeThrough')}
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyLeft')}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Insert Elements */}
          <Button
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={insertImage}
            className="h-8 w-8 p-0"
          >
            <Image className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertHTML', '<code></code>')}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('undo')}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('redo')}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Preview Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="h-8 w-8 p-0"
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="min-h-[300px]">
        {isPreviewMode ? (
          <div className="p-4 prose max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: addIdsToHeadings(editorContent) }} />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            className="min-h-[300px] p-4 prose max-w-none dark:prose-invert focus:outline-none"
            style={{ wordBreak: 'break-word' }}
            onInput={handleContentChange}
            onPaste={handleContentChange}
            onKeyUp={handleContentChange}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Editor Styles */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        
        [contenteditable] {
          outline: none;
        }
        
        [contenteditable] h1,
        [contenteditable] h2,
        [contenteditable] h3,
        [contenteditable] h4 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          line-height: 1.25;
        }
        
        [contenteditable] h1 { font-size: 2rem; }
        [contenteditable] h2 { font-size: 1.5rem; }
        [contenteditable] h3 { font-size: 1.25rem; }
        [contenteditable] h4 { font-size: 1.125rem; }
        
        [contenteditable] p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        [contenteditable] li {
          margin-bottom: 0.25rem;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        
        [contenteditable] code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
        }
      `}</style>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onImageSelect={handleImageInsert}
      />
    </div>
  )
}

"use client";

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Undo,
  Redo,
  Table as TableIcon,
  PlusSquare,
  MinusSquare,
  Trash2,
  Loader2,
  Columns,
  Rows
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/app/admin/banners/actions';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline font-bold' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-2xl max-w-full h-auto my-4 shadow-lg border border-gray-100' },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-indigo max-w-none focus:outline-none min-h-[200px] px-4 py-4 bg-white rounded-b-2xl border-x border-b border-gray-100 font-medium leading-relaxed tiptap-content',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter the URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'blogs');
      formData.append('folder', 'blog-content');

      const result = await uploadMedia(formData);

      if (result.success && result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col w-full border border-gray-100 rounded-2xl overflow-hidden focus-within:border-primary/30 transition-all shadow-sm">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*" 
      />
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/80 border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8", editor.isActive('bold') && "bg-primary/10 text-primary")}
          type="button"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8", editor.isActive('italic') && "bg-primary/10 text-primary")}
          type="button"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("h-8 w-8", editor.isActive('underline') && "bg-primary/10 text-primary")}
          type="button"
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-primary/10 text-primary")}
          type="button"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-primary/10 text-primary")}
          type="button"
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={addLink}
          className={cn("h-8 w-8", editor.isActive('link') && "bg-primary/10 text-primary")}
          type="button"
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 text-gray-500 hover:text-primary"
          type="button"
          disabled={uploading}
          title="Upload Image"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        
        <div className="w-px h-4 bg-gray-200 mx-1" />
        
        {/* Table Management */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="h-8 w-8 text-gray-500 hover:text-primary"
          type="button"
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('table') && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="h-8 w-8 text-emerald-500"
              type="button"
              title="Add Column After"
            >
              <Columns className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="h-8 w-8 text-emerald-500"
              type="button"
              title="Add Row After"
            >
              <Rows className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="h-8 w-8 text-rose-500"
              type="button"
              title="Delete Table"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}

        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          className="h-8 w-8"
          type="button"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          className="h-8 w-8"
          type="button"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />

      <style jsx global>{`
        .tiptap-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        .tiptap-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        .tiptap-content li {
          margin-bottom: 0.5rem !important;
          display: list-item !important;
        }
        .tiptap-content p {
          margin-bottom: 1rem !important;
        }
        .tiptap-content a {
          color: #4F46E5 !important;
          text-decoration: underline !important;
        }
        .tiptap-content table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 2rem 0;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
        }
        .tiptap-content table td, .tiptap-content table th {
          min-width: 1em;
          border: 1px solid #E2E8F0;
          padding: 12px 15px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap-content table th {
          font-weight: bold;
          text-align: left;
          background-color: #F8FAFC;
        }
        .tiptap-content table .selectedCell:after {
          z-index: 2;
          content: "";
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(79, 70, 229, 0.05);
          pointer-events: none;
        }
        .tiptap-content table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #818CF8;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { createLowlight, common } from 'lowlight';
import { EditorToolbar } from './EditorToolbar';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing your thoughts..."
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: 'slack-code-block bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4 leading-relaxed',
          style: 'background-color: #f8f9fa; border: 1px solid #e9ecef; color: #495057; font-family: "SFMono-Regular", "Monaco", "Inconsolata", "Liberation Mono", "Courier New", monospace; line-height: 1.6;'
        },
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 px-1 rounded',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 transition-colors cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-gray-200',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (editable) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none focus:outline-none ${editable ? 'min-h-[500px]' : 'min-h-[200px]'} p-6`,
        style: 'white-space: pre-wrap;',
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url) {
      // Validate URL format
      try {
        new URL(url);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        alert('Please enter a valid URL');
      }
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-6 min-h-[200px] flex items-center justify-center">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {editable && (
        <EditorToolbar editor={editor} onAddImage={addImage} />
      )}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className={`${editable ? 'min-h-[600px]' : 'min-h-[200px]'} bg-white`}
        />
        {editable && !content && (
          <div className="absolute top-6 left-6 text-gray-400 pointer-events-none text-lg">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Custom CSS for Slack-like code blocks */}
      <style jsx global>{`
        .slack-code-block {
          background-color: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          color: #495057 !important;
          font-family: "SFMono-Regular", "Monaco", "Inconsolata", "Liberation Mono", "Courier New", monospace !important;
          line-height: 1.6 !important;
          border-radius: 8px !important;
          padding: 16px !important;
          margin: 16px 0 !important;
          overflow-x: auto !important;
          font-size: 14px !important;
        }
        
        .slack-code-block pre {
          background: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
        }
        
        .slack-code-block code {
          background: transparent !important;
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
          padding: 0 !important;
        }
        
        /* Syntax highlighting for Slack theme */
        .slack-code-block .hljs-keyword,
        .slack-code-block .hljs-selector-tag,
        .slack-code-block .hljs-literal,
        .slack-code-block .hljs-section,
        .slack-code-block .hljs-link {
          color: #d73a49 !important;
        }
        
        .slack-code-block .hljs-function .hljs-keyword {
          color: #d73a49 !important;
        }
        
        .slack-code-block .hljs-subst {
          color: #24292e !important;
        }
        
        .slack-code-block .hljs-string,
        .slack-code-block .hljs-title,
        .slack-code-block .hljs-name,
        .slack-code-block .hljs-type,
        .slack-code-block .hljs-attribute,
        .slack-code-block .hljs-symbol,
        .slack-code-block .hljs-bullet,
        .slack-code-block .hljs-addition,
        .slack-code-block .hljs-variable,
        .slack-code-block .hljs-template-tag,
        .slack-code-block .hljs-template-variable {
          color: #032f62 !important;
        }
        
        .slack-code-block .hljs-comment,
        .slack-code-block .hljs-quote,
        .slack-code-block .hljs-deletion,
        .slack-code-block .hljs-meta {
          color: #6a737d !important;
        }
        
        .slack-code-block .hljs-keyword,
        .slack-code-block .hljs-selector-tag,
        .slack-code-block .hljs-literal,
        .slack-code-block .hljs-title,
        .slack-code-block .hljs-section,
        .slack-code-block .hljs-doctag,
        .slack-code-block .hljs-type,
        .slack-code-block .hljs-name,
        .slack-code-block .hljs-strong {
          font-weight: bold !important;
        }
        
        .slack-code-block .hljs-number {
          color: #005cc5 !important;
        }
        
        .slack-code-block .hljs-emphasis {
          font-style: italic !important;
        }
      `}</style>
    </div>
  );
};
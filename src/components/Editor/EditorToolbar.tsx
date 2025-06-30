import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Code, Highlighter as Highlight, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Minus, Link, Image, Table, Type, Palette, ChevronDown, Code2, Heading1, Heading2, Heading3 } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  onAddImage: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onAddImage }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);

  const colors = [
    '#000000', '#374151', '#6B7280', '#EF4444', '#F97316', 
    '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
  ];

  const fonts = [
    { name: 'Default', value: 'Inter, system-ui, sans-serif' },
    { name: 'Serif', value: 'Georgia, serif' },
    { name: 'Mono', value: 'JetBrains Mono, monospace' },
    { name: 'Cursive', value: 'Dancing Script, cursive' }
  ];

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50/50 p-3">
      <div className="flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
        </div>

        {/* Font and Color */}
        <div className="flex items-center gap-1 mr-3">
          <div className="relative">
            <button
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="flex items-center gap-1 p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600"
              title="Font Family"
            >
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {showFontPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                {fonts.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font.value).run();
                      setShowFontPicker(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                <div className="grid grid-cols-6 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600'
            }`}
            title="Highlight"
          >
            <Highlight className="h-4 w-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 mr-3">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Lists and Blocks */}
        <div className="flex items-center gap-1 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('code') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
              editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
            }`}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>

        {/* Insert Elements */}
        <div className="flex items-center gap-1">
          <button
            onClick={addLink}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600"
            title="Add Link"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            onClick={onAddImage}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600"
            title="Add Image"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            onClick={insertTable}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600"
            title="Insert Table"
          >
            <Table className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600"
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
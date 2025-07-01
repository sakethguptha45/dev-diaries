import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Highlighter as Highlight, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Minus, Link, Image, Table, Type, Palette, ChevronDown, Heading1, Heading2, Heading3 } from 'lucide-react';

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
      try {
        new URL(url);
        editor.chain().focus().setLink({ href: url }).run();
      } catch (error) {
        alert('Please enter a valid URL');
      }
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleImageClick = () => {
    onAddImage();
  };

  // Custom Code Block Icon Component (</> style)
  const CodeBlockIcon = ({ className }: { className?: string }) => (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </svg>
  );

  return (
    <div className="border-b border-gray-200 bg-gray-50/50 p-3">
      <div className="flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 mr-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-blue-50 ${
              editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Bold (Ctrl+B)
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-blue-50 ${
              editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Italic (Ctrl+I)
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-blue-50 ${
              editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
            }`}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Underline (Ctrl+U)
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-blue-50 ${
              editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Strikethrough
            </div>
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 mr-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Heading 1
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Heading 2
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'
            }`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Heading 3
            </div>
          </button>
        </div>

        {/* Font and Color */}
        <div className="flex items-center gap-1 mr-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="group relative flex items-center gap-1 p-2 rounded-lg transition-all duration-200 hover:bg-green-50 text-gray-600 hover:text-green-600"
              title="Font Family"
            >
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Font Family
              </div>
            </button>
            {showFontPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                {fonts.map((font) => (
                  <button
                    key={font.value}
                    type="button"
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
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="group relative flex items-center gap-1 p-2 rounded-lg transition-all duration-200 hover:bg-green-50 text-gray-600 hover:text-green-600"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Text Color
              </div>
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                <div className="grid grid-cols-6 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
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
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-yellow-50 ${
              editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-yellow-600'
            }`}
            title="Highlight"
          >
            <Highlight className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Highlight Text
            </div>
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 mr-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Align Left
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Align Center
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Align Right
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'
            }`}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Justify Text
            </div>
          </button>
        </div>

        {/* Lists and Blocks */}
        <div className="flex items-center gap-1 mr-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-orange-50 ${
              editor.isActive('bulletList') ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:text-orange-600'
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Bullet List
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-orange-50 ${
              editor.isActive('orderedList') ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:text-orange-600'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Numbered List
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-orange-50 ${
              editor.isActive('blockquote') ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:text-orange-600'
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Quote Block
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`group relative p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
              editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Code Block"
          >
            <CodeBlockIcon className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Code Block
            </div>
          </button>
        </div>

        {/* Insert Elements */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={addLink}
            className="group relative p-2 rounded-lg transition-all duration-200 hover:bg-cyan-50 text-gray-600 hover:text-cyan-600"
            title="Add Link"
          >
            <Link className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Add Link
            </div>
          </button>
          
          <button
            type="button"
            onClick={handleImageClick}
            className="group relative p-2 rounded-lg transition-all duration-200 hover:bg-cyan-50 text-gray-600 hover:text-cyan-600"
            title="Add Image"
          >
            <Image className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Add Image
            </div>
          </button>
          
          <button
            type="button"
            onClick={insertTable}
            className="group relative p-2 rounded-lg transition-all duration-200 hover:bg-cyan-50 text-gray-600 hover:text-cyan-600"
            title="Insert Table"
          >
            <Table className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Insert Table
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="group relative p-2 rounded-lg transition-all duration-200 hover:bg-cyan-50 text-gray-600 hover:text-cyan-600"
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Horizontal Line
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Heart, FileHeart as HeartFilled, Tag, Link as LinkIcon, Upload, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import { RichTextEditor } from '../components/Editor/RichTextEditor';
import { useCardStore } from '../store/cardStore';
import { useAuthStore } from '../store/authStore';
import { Card } from '../types';

export const EditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cards, addCard, updateCard, deleteCard, toggleFavorite } = useCardStore();
  
  const [isEditing, setIsEditing] = useState(!id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentCard = id ? cards.find(card => card.id === id) : null;

  useEffect(() => {
    if (currentCard) {
      setTitle(currentCard.title);
      setContent(currentCard.content);
      setTags(currentCard.tags);
      setLinks(currentCard.links);
      setIsFavorite(currentCard.favorite);
    }
  }, [currentCard]);

  useEffect(() => {
    if (currentCard) {
      const hasChanges = 
        title !== currentCard.title ||
        content !== currentCard.content ||
        JSON.stringify(tags) !== JSON.stringify(currentCard.tags) ||
        JSON.stringify(links) !== JSON.stringify(currentCard.links) ||
        isFavorite !== currentCard.favorite;
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(title.trim() !== '' || content.trim() !== '');
    }
  }, [title, content, tags, links, isFavorite, currentCard]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title for your card');
      return;
    }

    if (!user) {
      alert('You must be logged in to save cards');
      return;
    }

    const cardData = {
      title: title.trim(),
      content,
      tags,
      links,
      favorite: isFavorite,
      files: currentCard?.files || [],
      type: 'note' as const,
      explanation: '',
      userId: user.id
    };

    if (currentCard) {
      updateCard(currentCard.id, cardData);
    } else {
      addCard(cardData);
      // Navigate to home after creating a new card
      navigate('/');
      return;
    }

    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (currentCard && window.confirm('Are you sure you want to delete this card?')) {
      deleteCard(currentCard.id);
      navigate('/');
    }
  };

  const handleToggleFavorite = () => {
    if (currentCard) {
      toggleFavorite(currentCard.id);
      setIsFavorite(!isFavorite);
    } else {
      setIsFavorite(!isFavorite);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      setLinks([...links, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeLink = (linkToRemove: string) => {
    setLinks(links.filter(link => link !== linkToRemove));
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </motion.button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentCard ? (isEditing ? 'Edit Card' : 'View Card') : 'New Card'}
                </h1>
                {hasUnsavedChanges && (
                  <p className="text-sm text-orange-600">Unsaved changes</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleFavorite}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isFavorite
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                {isFavorite ? (
                  <HeartFilled className="h-5 w-5" />
                ) : (
                  <Heart className="h-5 w-5" />
                )}
              </motion.button>

              {currentCard && !isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
                >
                  Edit
                </motion.button>
              )}

              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </motion.button>
              )}

              {currentCard && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your card title..."
                  className="w-full text-3xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 focus:ring-0"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">
                  {title || 'Untitled Card'}
                </h1>
              )}
            </motion.div>

            {/* Rich Text Editor with Paper-like styling */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              {/* Paper-like container */}
              <div className="bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20 rounded-2xl shadow-inner border border-amber-100/50 overflow-hidden relative">
                {/* Paper texture overlay */}
                <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-amber-200 via-transparent to-orange-200 pointer-events-none"></div>
                
                {/* Subtle paper lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, #e5e7eb 24px, #e5e7eb 25px)',
                  backgroundSize: '100% 25px'
                }}></div>
                
                {/* Content area with inset shadow */}
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-inner border border-white/60 m-2">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    editable={isEditing}
                    placeholder="Start writing your thoughts, ideas, or code snippets..."
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tags */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Tags</h3>
              </div>

              <div className="space-y-3">
                {tags.map((tag) => (
                  <div key={tag} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-blue-700">#{tag}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addTag}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Links */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <LinkIcon className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Links</h3>
              </div>

              <div className="space-y-3">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-purple-700 hover:text-purple-900 transition-colors duration-200 flex-1 min-w-0"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Link {index + 1}</span>
                    </a>
                    {isEditing && (
                      <button
                        onClick={() => removeLink(link)}
                        className="text-purple-400 hover:text-red-500 transition-colors duration-200 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addLink()}
                      placeholder="Add link..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={addLink}
                      className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* File Attachments */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-gray-900">Attachments</h3>
              </div>

              {isEditing ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors duration-200">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag files here or click to upload
                  </p>
                  <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    Choose Files
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No attachments
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
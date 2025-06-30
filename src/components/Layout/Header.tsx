import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, LogOut, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleNewCard = () => {
    navigate('/editor');
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const result = await deleteAccount();
      if (result.success) {
        setShowDeleteModal(false);
        // User will be automatically redirected to auth page due to state change
      } else {
        setDeleteError(result.errorMessage || 'Failed to delete account');
      }
    } catch (error) {
      setDeleteError('An error occurred while deleting account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left Corner */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg"
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </motion.div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Dev Diaries
                </span>
              </Link>
            </div>

            {/* Actions - Right Corner */}
            <div className="flex items-center space-x-4 ml-auto">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewCard}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Card
              </motion.button>

              {/* User Menu - Far Right Corner */}
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-semibold">
                      {user?.name ? getInitials(user.name) : <User className="h-5 w-5" />}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-300">
                    {user?.name}
                  </span>
                </motion.button>

                {/* Dropdown Menu - Positioned from right edge */}
                <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-slate-700/50">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(71, 85, 105, 0.5)' }}
                      onClick={logout}
                      className="w-full flex items-center px-4 py-3 text-sm text-slate-300 hover:text-white transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </motion.button>

                    <div className="border-t border-slate-700/50 mt-1 pt-1">
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-3" />
                        Delete Account
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Delete Account</h3>
                    <p className="text-sm text-red-700">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">What will be deleted:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Your user account and profile</li>
                      <li>• All your cards and notes</li>
                      <li>• All associated data and files</li>
                      <li>• Your login credentials</li>
                    </ul>
                  </div>

                  <p className="text-gray-700 text-sm">
                    Are you absolutely sure you want to delete your account? This will permanently remove 
                    all your data and cannot be recovered.
                  </p>

                  {deleteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{deleteError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError('');
                  }}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
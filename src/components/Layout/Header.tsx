import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, User, LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleNewCard = () => {
    navigate('/editor');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewCard}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Card
            </motion.button>

            {/* User Menu */}
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-slate-300">
                  {user?.name}
                </span>
              </motion.button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(71, 85, 105, 0.5)' }}
                    onClick={logout}
                    className="w-full flex items-center px-4 py-3 text-sm text-slate-300 hover:text-white transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
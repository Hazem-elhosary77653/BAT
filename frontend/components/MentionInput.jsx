/**
 * Mention Input Component with @ Autocomplete
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

const MentionInput = ({ value, onChange, placeholder, className, onMention }) => {
  const [users, setUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/reviewers');
        const data = response.data?.data || response.data || [];
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Detect @ mentions
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(position);

    // Check if @ was typed
    const textBeforeCursor = newValue.substring(0, position);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      setMentionQuery(query);
      
      const filtered = users.filter(user => 
        (user.username?.toLowerCase().includes(query) ||
         user.full_name?.toLowerCase().includes(query) ||
         user.email?.toLowerCase().includes(query))
      );
      
      setFilteredUsers(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select a user from suggestions
  const selectUser = (user) => {
    const textarea = textareaRef.current;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ position
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    // Replace @query with @username
    const newValue = 
      textBeforeCursor.substring(0, atIndex) + 
      `@${user.username} ` + 
      textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Notify parent about mention
    if (onMention) {
      onMention(user);
    }

    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = atIndex + user.username.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 10);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full max-w-sm bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          <div className="p-2 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Select a user</span>
          </div>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => selectUser(user)}
              className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                  {(user.username || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">
                    @{user.username}
                  </div>
                  {user.full_name && (
                    <div className="text-xs text-slate-500">
                      {user.full_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;

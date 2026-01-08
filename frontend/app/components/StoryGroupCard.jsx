'use client';

import React, { useState } from 'react';
import { Trash2, Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

export default function StoryGroupCard({ group, stories, onUpdateGroup, onDeleteGroup, onMoveStory, onCreateGroup }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group?.name || '');
  const [editColor, setEditColor] = useState(group?.color || '#3b82f6');

  const handleSaveEdit = async () => {
    if (editName.trim()) {
      await onUpdateGroup(group.id, {
        name: editName,
        color: editColor
      });
      setIsEditing(false);
    }
  };

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Indigo', value: '#6366f1' }
  ];

  if (!group) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No groups yet. Create one to organize your stories.</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div 
        className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0" 
            style={{ backgroundColor: group.color }}
          />
          {isEditing ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <select
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {colors.map(c => (
                  <option key={c.value} value={c.value}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="font-semibold text-gray-700">{group.name}</h3>
              {group.description && (
                <p className="text-xs text-gray-500">{group.description}</p>
              )}
            </div>
          )}
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {group.story_count || 0} stories
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                title="Edit group"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteGroup(group.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Stories List */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white">
          {stories && stories.length > 0 ? (
            <div className="space-y-2">
              {stories.map(story => (
                <div
                  key={story.id}
                  className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition flex items-start justify-between group"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-700">{story.title}</h4>
                    {story.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{story.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onMoveStory(story.id, null)}
                    className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No stories in this group yet</p>
          )}
        </div>
      )}
    </div>
  );
}

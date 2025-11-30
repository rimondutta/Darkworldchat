import { X, Users } from 'lucide-react';
import { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { axiosInstance } from '../lib/axios';
import toast from '../lib/toast';

const GroupInfoPopup = ({ group, onClose }) => {
  const [description, setDescription] = useState(group.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const { getGroups } = useChatStore();

  const handleSave = async () => {
    try {
      await axiosInstance.put(`/groups/${group._id}/description`, { description });
      toast.success('Description updated');
      await getGroups(); // refresh group data
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update description');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-base-100 rounded-2xl shadow-lg p-5 w-[95%] max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">
          <X />
        </button>

        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold">{group.name}</h2>
          <p className="text-sm text-gray-400">{group.members?.length || 0} members</p>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          {isEditing ? (
            <textarea
              className="textarea textarea-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          ) : (
            <p className="text-sm text-gray-300">{description || 'No description'}</p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            {isEditing ? (
              <>
                <button className="btn btn-sm btn-primary" onClick={handleSave}>
                  Save
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-sm btn-outline" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Members */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" /> Members
          </label>
          <ul className="max-h-48 overflow-y-auto">
            {group.members?.length > 0 ? (
              group.members.map((member) => (
                <li key={member._id || member} className="text-sm py-1 border-b border-base-300">
                  {member.fullName || member.name || 'Unknown'}
                </li>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No members yet</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPopup;

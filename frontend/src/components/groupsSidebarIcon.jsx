const GroupSidebarIcon = ({ group, isActive, onClick }) => {
  const firstLetter = group.name.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-2 cursor-pointer rounded-xl transition-colors duration-200 hover:bg-base-300
        ${isActive && 'bg-base-300'}`}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold 
        ${isActive ? 'bg-blue-600' : 'bg-blue-500'}`}
      >
        {firstLetter}
      </div>
      <span className="text-sm font-medium truncate">{group.name}</span>
    </div>
  );
};

export default GroupSidebarIcon;

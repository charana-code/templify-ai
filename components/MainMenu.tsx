import React, { useState, useEffect, useRef } from 'react';

interface MainMenuProps {
    onNew: () => void;
    onSave: () => void;
    isDirty: boolean;
    onCopy: () => void;
    onPaste: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onSettings: () => void;
    canCopy: boolean;
    canPaste: boolean;
    canDelete: boolean;
}

const MenuItem: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; shortcut?: string }> = ({ onClick, disabled, children, shortcut }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex justify-between w-full px-4 py-2 text-sm text-left text-gray-200 rounded-md hover:bg-blue-600 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
        <span>{children}</span>
        {shortcut && <span className="text-gray-400">{shortcut}</span>}
    </button>
);

const MainMenu: React.FC<MainMenuProps> = (props) => {
    const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'settings' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (action: () => void) => {
        action();
        setOpenMenu(null);
    };

    const handleMenuToggle = (menu: 'file' | 'edit' | 'settings') => {
        setOpenMenu(prev => (prev === menu ? null : menu));
    };

    return (
        <div className="flex items-center space-x-1" ref={menuRef}>
            {/* File Menu */}
            <div className="relative">
                <button
                    onClick={() => handleMenuToggle('file')}
                    className={`px-3 py-1.5 text-sm rounded-md focus:outline-none transition-colors ${openMenu === 'file' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    aria-haspopup="true"
                    aria-expanded={openMenu === 'file'}
                >
                    File
                </button>
                {openMenu === 'file' && (
                    <div className="absolute left-0 mt-2 w-56 origin-top-left bg-gray-800 border border-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-1">
                        <MenuItem onClick={() => handleItemClick(props.onNew)}>New</MenuItem>
                        <MenuItem onClick={() => handleItemClick(props.onSave)} shortcut={props.isDirty ? 'Ctrl+S' : ''}>{props.isDirty ? 'Save' : 'Saved'}</MenuItem>
                        <MenuItem onClick={() => handleItemClick(props.onNew)}>Close</MenuItem>
                    </div>
                )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
                 <button
                    onClick={() => handleMenuToggle('edit')}
                    className={`px-3 py-1.5 text-sm rounded-md focus:outline-none transition-colors ${openMenu === 'edit' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    aria-haspopup="true"
                    aria-expanded={openMenu === 'edit'}
                >
                    Edit
                </button>
                {openMenu === 'edit' && (
                     <div className="absolute left-0 mt-2 w-56 origin-top-left bg-gray-800 border border-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-1">
                        <MenuItem onClick={() => handleItemClick(props.onCopy)} disabled={!props.canCopy} shortcut="Ctrl+C">Copy</MenuItem>
                        <MenuItem onClick={() => handleItemClick(props.onPaste)} disabled={!props.canPaste} shortcut="Ctrl+V">Paste</MenuItem>
                        <MenuItem onClick={() => handleItemClick(props.onDuplicate)} disabled={!props.canCopy} shortcut="Ctrl+D">Duplicate</MenuItem>
                        <MenuItem onClick={() => handleItemClick(props.onDelete)} disabled={!props.canDelete} shortcut="Del">Delete</MenuItem>
                    </div>
                )}
            </div>

            {/* Settings Menu */}
            <div className="relative">
                <button
                    onClick={() => handleMenuToggle('settings')}
                    className={`px-3 py-1.5 text-sm rounded-md focus:outline-none transition-colors ${openMenu === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    aria-haspopup="true"
                    aria-expanded={openMenu === 'settings'}
                >
                    Settings
                </button>
                {openMenu === 'settings' && (
                     <div className="absolute left-0 mt-2 w-56 origin-top-left bg-gray-800 border border-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-1">
                        <MenuItem onClick={() => handleItemClick(props.onSettings)}>Open Settings...</MenuItem>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainMenu;

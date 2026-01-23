import React, { useState, useRef, useEffect } from 'react';

interface TagsInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
    suggestions?: string[];
    disabled?: boolean;
}

const TagsInput: React.FC<TagsInputProps> = ({
    tags,
    onChange,
    placeholder = 'Add tags...',
    maxTags = 10,
    suggestions = [],
    disabled = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (inputValue.trim() && suggestions.length > 0) {
            const filtered = suggestions.filter(
                s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
            );
            setFilteredSuggestions(filtered.slice(0, 5));
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [inputValue, suggestions, tags]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
            onChange([...tags, trimmedTag]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (indexToRemove: number) => {
        onChange(tags.filter((_, index) => index !== indexToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const newTags = pastedText
            .split(/[,\n]/)
            .map(t => t.trim().toLowerCase())
            .filter(t => t && !tags.includes(t));

        const availableSlots = maxTags - tags.length;
        const tagsToAdd = newTags.slice(0, availableSlots);

        if (tagsToAdd.length > 0) {
            onChange([...tags, ...tagsToAdd]);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div
                className={`flex flex-wrap gap-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus-within:border-[var(--accent-primary)] transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded text-sm"
                    >
                        #{tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTag(index);
                                }}
                                className="hover:text-red-400 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </span>
                ))}
                {tags.length < maxTags && !disabled && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                        disabled={disabled}
                    />
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-lg overflow-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                            #{suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Helper text */}
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Press Enter or comma to add. {tags.length}/{maxTags} tags
            </p>
        </div>
    );
};

export default TagsInput;

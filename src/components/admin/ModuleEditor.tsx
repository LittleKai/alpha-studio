import React, { useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { Module, Lesson } from '../../services/courseService';

interface ModuleEditorProps {
    modules: Module[];
    onChange: (modules: Module[]) => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ modules, onChange }) => {
    const { t } = useTranslation();

    // Generate simple unique ID
    const generateId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Module handlers
    const handleAddModule = useCallback(() => {
        const newModule: Module = {
            moduleId: generateId(),
            title: { vi: '', en: '' },
            lessons: []
        };
        onChange([...modules, newModule]);
    }, [modules, onChange]);

    const handleUpdateModuleTitle = useCallback((index: number, lang: 'vi' | 'en', value: string) => {
        const updated = [...modules];
        updated[index] = {
            ...updated[index],
            title: { ...updated[index].title, [lang]: value }
        };
        onChange(updated);
    }, [modules, onChange]);

    const handleRemoveModule = useCallback((index: number) => {
        onChange(modules.filter((_, i) => i !== index));
    }, [modules, onChange]);

    const handleMoveModule = useCallback((index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= modules.length) return;

        const updated = [...modules];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        onChange(updated);
    }, [modules, onChange]);

    // Lesson handlers
    const handleAddLesson = useCallback((moduleIndex: number) => {
        const updated = [...modules];
        const newLesson: Lesson = {
            lessonId: generateId(),
            title: { vi: '', en: '' },
            duration: 0,
            type: 'video',
            content: '',
            order: updated[moduleIndex].lessons.length
        };
        updated[moduleIndex] = {
            ...updated[moduleIndex],
            lessons: [...updated[moduleIndex].lessons, newLesson]
        };
        onChange(updated);
    }, [modules, onChange]);

    const handleUpdateLesson = useCallback((
        moduleIndex: number,
        lessonIndex: number,
        field: keyof Lesson | 'title.vi' | 'title.en',
        value: string | number
    ) => {
        const updated = [...modules];
        const lesson = { ...updated[moduleIndex].lessons[lessonIndex] };

        if (field === 'title.vi') {
            lesson.title = { ...lesson.title, vi: value as string };
        } else if (field === 'title.en') {
            lesson.title = { ...lesson.title, en: value as string };
        } else {
            (lesson as any)[field] = value;
        }

        updated[moduleIndex] = {
            ...updated[moduleIndex],
            lessons: updated[moduleIndex].lessons.map((l, i) => i === lessonIndex ? lesson : l)
        };
        onChange(updated);
    }, [modules, onChange]);

    const handleRemoveLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
        const updated = [...modules];
        updated[moduleIndex] = {
            ...updated[moduleIndex],
            lessons: updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex)
        };
        onChange(updated);
    }, [modules, onChange]);

    const handleMoveLesson = useCallback((moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
        const lessons = modules[moduleIndex].lessons;
        if (newIndex < 0 || newIndex >= lessons.length) return;

        const updated = [...modules];
        const updatedLessons = [...lessons];
        [updatedLessons[lessonIndex], updatedLessons[newIndex]] = [updatedLessons[newIndex], updatedLessons[lessonIndex]];
        updated[moduleIndex] = { ...updated[moduleIndex], lessons: updatedLessons };
        onChange(updated);
    }, [modules, onChange]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {t('admin.courses.form.modules')}
                </h2>
                <button
                    onClick={handleAddModule}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl text-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t('admin.courses.form.addModule')}
                </button>
            </div>

            {modules.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-[var(--text-secondary)] mb-4">{t('admin.courses.form.noModules')}</p>
                    <button
                        onClick={handleAddModule}
                        className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl"
                    >
                        {t('admin.courses.form.addFirstModule')}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {modules.map((module, moduleIndex) => (
                        <div key={module.moduleId} className="glass-card rounded-2xl overflow-hidden">
                            {/* Module Header */}
                            <div className="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                                <div className="flex items-center gap-3">
                                    {/* Reorder Buttons */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMoveModule(moduleIndex, 'up')}
                                            disabled={moduleIndex === 0}
                                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleMoveModule(moduleIndex, 'down')}
                                            disabled={moduleIndex === modules.length - 1}
                                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Module Number */}
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold">
                                        {moduleIndex + 1}
                                    </div>

                                    {/* Module Title Inputs */}
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={module.title.vi}
                                            onChange={(e) => handleUpdateModuleTitle(moduleIndex, 'vi', e.target.value)}
                                            placeholder={t('admin.courses.form.moduleTitleVi')}
                                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                        <input
                                            type="text"
                                            value={module.title.en}
                                            onChange={(e) => handleUpdateModuleTitle(moduleIndex, 'en', e.target.value)}
                                            placeholder={t('admin.courses.form.moduleTitleEn')}
                                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                    </div>

                                    {/* Delete Module */}
                                    <button
                                        onClick={() => handleRemoveModule(moduleIndex)}
                                        className="p-2 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Lessons */}
                            <div className="p-4 space-y-3">
                                {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.lessonId} className="p-3 bg-[var(--bg-secondary)] rounded-xl">
                                        <div className="flex items-start gap-3">
                                            {/* Reorder */}
                                            <div className="flex flex-col gap-1 pt-2">
                                                <button
                                                    onClick={() => handleMoveLesson(moduleIndex, lessonIndex, 'up')}
                                                    disabled={lessonIndex === 0}
                                                    className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleMoveLesson(moduleIndex, lessonIndex, 'down')}
                                                    disabled={lessonIndex === module.lessons.length - 1}
                                                    className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Lesson Number */}
                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-medium">
                                                {lessonIndex + 1}
                                            </div>

                                            {/* Lesson Fields */}
                                            <div className="flex-1 space-y-2">
                                                {/* Titles */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={lesson.title.vi}
                                                        onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, 'title.vi', e.target.value)}
                                                        placeholder={t('admin.courses.form.lessonTitleVi')}
                                                        className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={lesson.title.en}
                                                        onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, 'title.en', e.target.value)}
                                                        placeholder={t('admin.courses.form.lessonTitleEn')}
                                                        className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                                    />
                                                </div>

                                                {/* Type, Duration, Content */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <select
                                                        value={lesson.type}
                                                        onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, 'type', e.target.value)}
                                                        className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                                    >
                                                        <option value="video">{t('admin.courses.form.lessonTypes.video')}</option>
                                                        <option value="text">{t('admin.courses.form.lessonTypes.text')}</option>
                                                        <option value="quiz">{t('admin.courses.form.lessonTypes.quiz')}</option>
                                                        <option value="assignment">{t('admin.courses.form.lessonTypes.assignment')}</option>
                                                    </select>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={lesson.duration}
                                                            onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, 'duration', Number(e.target.value))}
                                                            min={0}
                                                            placeholder="0"
                                                            className="w-full px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] pr-10"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                                                            min
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={lesson.content}
                                                        onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                                                        placeholder={t('admin.courses.form.contentUrl')}
                                                        className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Delete Lesson */}
                                            <button
                                                onClick={() => handleRemoveLesson(moduleIndex, lessonIndex)}
                                                className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Lesson Button */}
                                <button
                                    onClick={() => handleAddLesson(moduleIndex)}
                                    className="w-full py-2 border-2 border-dashed border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
                                >
                                    + {t('admin.courses.form.addLesson')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ModuleEditor;

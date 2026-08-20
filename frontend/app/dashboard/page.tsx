'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTasks, TaskFilters } from '../../hooks/useTasks';
import { Task, TaskPriority, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from '../../types';
import { Navbar } from '../../components/Navbar';
import { TaskCard } from '../../components/TaskCard';
import { TaskModal } from '../../components/TaskModal';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  CircleDashed,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

const DEBOUNCE_MS = 400;

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { tasks, meta, loading: tasksLoading, error, setError, fetchTasks, createTask, updateTask, deleteTask } = useTasks();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 9;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const runFetch = useCallback(
    (page: number, search: string, status: string, priority: string, start: string, end: string) => {
      if (!isAuthenticated) return;
      const filters: TaskFilters = {
        page,
        limit: LIMIT,
        ...(status ? { status: status as TaskStatus } : {}),
        ...(priority ? { priority: priority as TaskPriority } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(start ? { startDate: start } : {}),
        ...(end ? { endDate: end } : {}),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      fetchTasks(filters);
    },
    [isAuthenticated, fetchTasks],
  );

  useEffect(() => {
    if (isAuthenticated) {
      runFetch(currentPage, searchQuery, statusFilter, priorityFilter, startDate, endDate);
    }
  }, [isAuthenticated]); // eslint-disable-line

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      runFetch(1, searchQuery, statusFilter, priorityFilter, startDate, endDate);
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]); // eslint-disable-line

  useEffect(() => {
    if (!isAuthenticated) return;
    setCurrentPage(1);
    runFetch(1, searchQuery, statusFilter, priorityFilter, startDate, endDate);
  }, [statusFilter, priorityFilter, startDate, endDate]); // eslint-disable-line

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    runFetch(newPage, searchQuery, statusFilter, priorityFilter, startDate, endDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(statusFilter || priorityFilter || searchQuery || startDate || endDate);
  const activeFilterCount = [statusFilter, priorityFilter, searchQuery, startDate, endDate].filter(Boolean).length;

  const handleOpenCreateModal = () => { setEditingTask(null); setIsModalOpen(true); };
  const handleOpenEditModal = (task: Task) => { setEditingTask(task); setIsModalOpen(true); };

  const handleModalSubmit = async (data: CreateTaskPayload | UpdateTaskPayload) => {
    const targetId = editingTask ? (editingTask.id || editingTask._id || '') : '';
    if (editingTask && targetId) {
      await updateTask(targetId, data);
    } else {
      await createTask(data as CreateTaskPayload);
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    await updateTask(id, { status: newStatus });
  };

  const handleDeleteRequest = (task: Task) => { setDeleteTarget(task); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTask(deleteTarget.id || deleteTarget._id || '');
      setDeleteTarget(null);
    } catch {
      // error set in hook
    } finally {
      setIsDeleting(false);
    }
  };

  const pending = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
  const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Authenticating..." />
      </div>
    );
  }

  const totalPages = meta?.totalPages || 1;
  const totalTasks = meta?.total || 0;
  const pageStart = totalTasks === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const pageEnd = Math.min(currentPage * LIMIT, totalTasks);

  const stats = [
    { title: 'Total', value: totalTasks, icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Pending', value: pending, icon: CircleDashed, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-600/40' },
    { title: 'Active', value: inProgress, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { title: 'Done', value: done, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* ─── Welcome Banner ─── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>Personal Workspace</span>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                Hello, {user?.name || 'Developer'} 👋
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {totalTasks > 0
                  ? `You have ${totalTasks} task${totalTasks !== 1 ? 's' : ''} in your board.`
                  : 'Your board is empty. Create your first task!'}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {stats.map(({ title, value, icon: Icon, color, bg, border }) => (
            <div key={title} className={`${bg} border ${border} rounded-xl p-3 sm:p-4 flex items-center gap-3`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color} border ${border}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-[10px] sm:text-xs font-medium truncate">{title}</p>
                <p className="text-white text-xl sm:text-2xl font-extrabold leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Error Banner ─── */}
        {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError(null)} /></div>}

        {/* ─── Search + Filter Bar ─── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
          {/* Row 1: Search + Filter toggle (mobile) / Full controls (desktop) */}
          <div className="flex gap-2">
            {/* Search — always visible */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mobile: filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors shrink-0 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop: Status + Priority inline */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value={TaskStatus.PENDING}>Pending</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.DONE}>Done</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Mobile filter panel (shown when toggled) */}
          {showFilters && (
            <div className="sm:hidden space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value={TaskStatus.PENDING}>Pending</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.DONE}>Done</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-500 self-center text-xs shrink-0">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Desktop date range (always shown on sm+) */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs text-slate-400 shrink-0">Due Date:</span>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-500 text-xs shrink-0">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ─── Task Grid ─── */}
        {tasksLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-5 bg-slate-800 rounded-md" />
                  <div className="w-20 h-6 bg-slate-800 rounded-lg" />
                </div>
                <div className="w-3/4 h-5 bg-slate-800 rounded-md" />
                <div className="w-full h-3 bg-slate-800 rounded-md" />
                <div className="w-2/3 h-3 bg-slate-800 rounded-md" />
                <div className="border-t border-slate-800 pt-3 flex justify-between">
                  <div className="w-20 h-4 bg-slate-800 rounded" />
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-slate-800 rounded-lg" />
                    <div className="w-7 h-7 bg-slate-800 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No matching tasks' : 'No tasks yet'}
            description={
              hasActiveFilters
                ? 'No tasks match your current filters. Try clearing them.'
                : 'Your task board is empty. Click below to create your first task!'
            }
            onAction={hasActiveFilters ? clearFilters : handleOpenCreateModal}
            actionText={hasActiveFilters ? 'Clear Filters' : 'Create First Task'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id || task._id}
                  task={task}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteRequest}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {/* ─── Pagination ─── */}
            {meta && totalPages > 1 && (
              <div className="mt-4 sm:mt-6 flex flex-col xs:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-slate-400 order-2 xs:order-1">
                  <span className="font-semibold text-slate-200">{pageStart}–{pageEnd}</span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-200">{totalTasks}</span> tasks
                </p>
                <div className="flex items-center gap-1.5 order-1 xs:order-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!meta.hasPreviousPage || tasksLoading}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden xs:inline">Prev</span>
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, currentPage - 2);
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={tasksLoading}
                        className={`w-8 h-8 text-sm font-semibold rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow shadow-blue-600/30'
                            : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!meta.hasNextPage || tasksLoading}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSubmit={handleModalSubmit}
        task={editingTask}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        taskTitle={deleteTarget?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}

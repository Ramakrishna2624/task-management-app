'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { weatherService, WeatherData } from '../services/weatherService';
import { formatDate } from '../lib/utils';
import {
  Calendar,
  Edit2,
  Trash2,
  MapPin,
  Paperclip,
  CloudSun,
  Loader2,
  WifiOff,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const priorityStyles: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: 'bg-red-500/10 text-red-400 border-red-500/20',
  [TaskPriority.MEDIUM]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [TaskPriority.LOW]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const statusStyles: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-slate-500/10 text-slate-300 border-slate-600',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  [TaskStatus.DONE]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const taskId = task.id || task._id || '';
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (task.location && taskId) {
      setWeatherLoading(true);
      weatherService
        .getTaskWeather(taskId)
        .then((res) => setWeather(res))
        .catch(() => setWeather({ available: false }))
        .finally(() => setWeatherLoading(false));
    }
  }, [task.location, taskId]);

  const isOverdue =
    task.dueDate &&
    task.status !== TaskStatus.DONE &&
    new Date(task.dueDate) < new Date();

  return (
    <div
      className={`bg-slate-900 border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm transition-all group flex flex-col justify-between gap-3 sm:gap-4 hover:border-slate-600 ${
        isOverdue ? 'border-red-500/30' : 'border-slate-800'
      }`}
    >
      <div className="space-y-3">
        {/* Priority + Status Inline */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>

          <select
            value={task.status}
            onChange={(e) => onStatusChange(taskId, e.target.value as TaskStatus)}
            className={`text-xs font-medium rounded-lg px-2 py-1 border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-transparent ${statusStyles[task.status]}`}
          >
            <option value={TaskStatus.PENDING} className="bg-slate-900 text-slate-200">
              ● Pending
            </option>
            <option value={TaskStatus.IN_PROGRESS} className="bg-slate-900 text-slate-200">
              ◐ In Progress
            </option>
            <option value={TaskStatus.DONE} className="bg-slate-900 text-slate-200">
              ✓ Done
            </option>
          </select>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Meta Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location */}
          {task.location && (
            <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 max-w-full">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate max-w-[120px] font-medium">{task.location}</span>
            </div>
          )}

          {/* Weather Badge */}
          {task.location && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border bg-amber-500/10 border-amber-500/20 text-amber-300">
              {weatherLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : weather?.available ? (
                <>
                  {weather.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={weather.iconUrl}
                      alt={weather.condition || 'weather'}
                      className="w-5 h-5"
                    />
                  ) : (
                    <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="font-semibold">{weather.temp}°C</span>
                  <span className="capitalize text-[11px] text-amber-200 hidden sm:inline">
                    {weather.condition}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1 text-slate-500">
                  <WifiOff className="w-3 h-3" />
                  <span className="text-[11px]">Weather n/a</span>
                </div>
              )}
            </div>
          )}

          {/* Attachment */}
          {task.attachmentUrl && (
            <a
              href={task.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span>Attachment</span>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div
          className={`flex items-center gap-1.5 text-xs ${
            isOverdue ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{formatDate(task.dueDate)}</span>
          {isOverdue && (
            <span className="ml-1 font-semibold text-red-400 text-[11px]">(Overdue)</span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="p-2 sm:p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            title="Delete task"
            className="p-2 sm:p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

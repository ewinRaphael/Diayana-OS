// ============================================================
// NexusOS — Business Workspace: Projects Tab
// ============================================================

import { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Building,
  FileText,
  ListTodo,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { useProjects } from '../../hooks/useProjects';
import { useEntries } from '../../hooks/useEntries';
import { useTasks } from '../../hooks/useTasks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { ProjectStatus } from '../../lib/types';
import { cn } from '../../lib/utils';

interface ProjectsTabProps {
  workspace: 'hashadz' | 'slash';
}

const statusOptions: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Completed'];

export function ProjectsTab({ workspace }: ProjectsTabProps) {
  const { projects, loading, createProject, updateProject } = useProjects({ workspace });
  const { entries } = useEntries({ workspace });
  const { tasks } = useTasks({ workspace });
  const { accentColor } = useWorkspace();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject({
        workspace,
        name: name.trim(),
        client_name: clientName.trim(),
        status,
        metadata_json: {},
      });
      setName('');
      setClientName('');
      setStatus('Active');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (st: ProjectStatus) => {
    switch (st) {
      case 'Active':
        return 'bg-emerald/15 text-emerald-light border-emerald/30';
      case 'Planning':
        return 'bg-info/15 text-info border-info/30';
      case 'On Hold':
        return 'bg-warning/15 text-warning border-warning/30';
      case 'Completed':
        return 'bg-text-dim/15 text-text-muted border-border';
    }
  };

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-xs text-text-muted">
        Loading projects portfolio...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Projects Portfolio ({projects.length})
          </h3>
          <p className="text-xs text-text-muted">
            Managing deliverables and milestones for {workspace.toUpperCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
            accentButtonMap[accentColor]
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Initiated"
          description={`Start tracking deliverables for ${workspace.toUpperCase()} by creating your first project.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const linkedEntriesCount = entries.filter((e) => e.project_id === project.id).length;
            const linkedTasksCount = tasks.filter((t) => t.project_id === project.id).length;

            return (
              <Card
                key={project.id}
                hoverable
                className="flex flex-col justify-between p-5 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-text-primary tracking-tight">
                      {project.name}
                    </h4>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium',
                        getStatusColor(project.status)
                      )}
                    >
                      {project.status}
                    </span>
                  </div>

                  {project.client_name && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>{project.client_name}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Linked logs">
                      <FileText className="w-3.5 h-3.5 text-text-dim" />
                      <span>{linkedEntriesCount} logs</span>
                    </span>
                    <span className="flex items-center gap-1" title="Linked tasks">
                      <ListTodo className="w-3.5 h-3.5 text-text-dim" />
                      <span>{linkedTasksCount} tasks</span>
                    </span>
                  </div>

                  <select
                    value={project.status}
                    onChange={(e) =>
                      updateProject(project.id, {
                        status: e.target.value as ProjectStatus,
                      })
                    }
                    className="text-[10px] bg-obsidian border border-border rounded px-1.5 py-0.5 text-text-muted cursor-pointer"
                  >
                    {statusOptions.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-medium text-text-primary">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Al-Noor Penthouse Fit-Out"
              className="w-full mt-1.5 px-3 py-2 bg-obsidian border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-primary">
              Client / Organization Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Emaar Properties LLC"
              className="w-full mt-1.5 px-3 py-2 bg-obsidian border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-primary">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full mt-1.5 px-3 py-2 bg-obsidian border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30 cursor-pointer"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || isSubmitting}
              className={cn(
                'px-5 py-2 text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer',
                accentButtonMap[accentColor],
                (!name.trim() || isSubmitting) && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProjectsTab;

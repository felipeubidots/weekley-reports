/**
 * Data types for the reporting system
 */

export interface OverdueTask {
  id: string;
  name: string;
  projectName: string;
  dueDate: Date;
  ownerName: string;
  daysOverdue: number;
  url: string;
}

export interface OverdueByOwner {
  ownerName: string;
  ownerEmail?: string;
  tasksCount: number;
  tasks: OverdueTask[];
  averageDaysOverdue: number;
}

export interface EpicMetrics {
  id: string;
  name: string;
  completedCount: number;
  totalCount: number;
  estimatedHours: number;
  actualHours: number;
  differenceHours: number;
  percentageDifference: number;
  url: string;
}

export interface InactiveChannel {
  id: string;
  name: string;
  inactiveDays: number;
  lastMessageDate?: Date;
  memberCount: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  isMpim: boolean;
  isPrivate: boolean;
  created: number;
  memberCount?: number;
}

export interface ReportData {
  metadata: {
    generatedAt: Date;
    executionTimeMs: number;
    reportPeriod: {
      start: Date;
      end: Date;
    };
  };
  overdueTasks: {
    total: number;
    byOwner: OverdueByOwner[];
    allTasks: OverdueTask[];
  };
  epicMetrics: EpicMetrics[];
  slackChannels: {
    inactiveTempChannels: InactiveChannel[];
    totalScanned: number;
    totalTempChannels: number;
  };
}

// Shortcut API response types
export interface ShortcutStory {
  id: number;
  name: string;
  description?: string;
  due_date?: string;
  owners: Array<{ id: number; name: string; email: string }>;
  project_id: number;
  epic_id?: number;
  estimate?: number;
  completed_at?: string;
  url: string;
}

export interface ShortcutEpic {
  id: number;
  name: string;
  description?: string;
  stories: number[];
  url: string;
}

export interface ShortcutTimeEntry {
  id: number;
  external_id?: string;
  story_id: number;
  user_id: number;
  duration: number; // in seconds
  happened_at: string;
  notes?: string;
}

export interface ShortcutProject {
  id: number;
  name: string;
}

// Slack API response types
export interface SlackConversation {
  id: string;
  name: string;
  is_private: boolean;
  created: number;
  creator: string;
  is_mpim: boolean;
  members?: string[];
  num_members?: number;
}

export interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
}

export interface SlackUserProfile {
  email?: string;
  display_name?: string;
  real_name?: string;
}

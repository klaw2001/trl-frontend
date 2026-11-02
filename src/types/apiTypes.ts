// Shapes returned by the API (column names follow the database)

export type RoleScope = 'all' | 'brand' | 'franchise' | 'outlet' | 'self'

export type AccessMapItem = {
  module_key: string
  module_name: string | null
  read: boolean
  write: boolean
}

export type ShiftAccess = {
  restricted: boolean
  allowed: boolean
  timezone: string
  start: string | null
  end: string | null
  days: number[]
  ends_at: string | null
  next_start_at: string | null
}

export type Profile = {
  user: {
    user_id: number
    user_employee_id: string
    user_first_name: string
    user_last_name: string
    user_email: string | null
    user_mobile: string
    user_designation: string | null
    user_must_change_password: boolean
    user_role_relation: { role_id: number; role_key: string; role_name: string; role_scope: RoleScope }
    user_brand: { brand_id: number; brand_name: string } | null
    user_outlet: { outlet_id: number; outlet_name: string; outlet_timezone: string } | null
    user_manager: { user_id: number; user_first_name: string; user_last_name: string } | null
  }
  access_map: AccessMapItem[]
  shift: ShiftAccess
  unread_notifications: number
}

export type Paged<T> = {
  total: number
  rows: T[]
}

export type AssignmentState = 'assigned' | 'in_progress' | 'failed' | 'completed' | 'revoked'

export type Steps = {
  lessons_total: number
  lessons_done: number
  has_assessment: boolean
  requires_ack: boolean
  all_lessons_done: boolean
  assessment_done: boolean
  ack_done: boolean
  total_steps: number
  done_steps: number
}

export type MyAssignment = {
  asg_id: number
  asg_state: AssignmentState
  asg_source: string
  asg_is_mandatory: boolean
  asg_ack_only: boolean
  asg_due_at: string | null
  asg_started_at: string | null
  asg_completed_at: string | null
  asg_best_score: number | null
  asg_attempts_used: number
  module: { tm_id: number; tm_code: string | null; category: string | null }
  version: {
    mv_id: number
    mv_title: string
    mv_description: string | null
    mv_version_no: number
    mv_pass_mark: number
    mv_max_attempts: number
  }
  steps: Steps
  progress: number
  is_overdue: boolean
  is_locked: boolean
}

export type VideoPlayback = {
  video_id: number
  state: string
  url: string | null
  thumbnail: string | null
  duration: number | null
  expires_at: string | null
  protected: boolean
  resume_position?: number
  max_position?: number
  completed?: boolean
  heartbeat_seconds?: number
  watermark?: { name: string; employee_id: string; outlet?: string | null }
}

export type Video = {
  video_id: number
  video_source: 'bunny' | 'external'
  video_guid: string | null
  video_url: string | null
  video_title: string
  video_state: 'uploading' | 'processing' | 'ready' | 'failed'
  video_duration_seconds: number | null
  video_created_at: string
}

export type FileRow = {
  file_id: number
  file_name: string
  file_mime: string
  file_size: number
}

export type Option = { value: number | string; label: string }

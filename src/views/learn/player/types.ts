import type { AssignmentState, ShiftAccess, Steps } from '@/types/apiTypes'

export type LessonDetail = {
  lesson_id: number
  lesson_title: string
  lesson_content: string | null
  lesson_sequence: number
  lesson_is_required: boolean
  min_watch_percent: number
  video: { video_id: number; video_duration_seconds: number | null; video_state: string } | null
  files: { file_id: number; file_name: string; file_mime: string; url: string }[]
  progress: { position: number; max_position: number; watched_percent: number; completed_at: string | null }
}

export type AttemptSummary = {
  aa_id: number
  aa_attempt_no: number
  aa_state: 'in_progress' | 'submitted'
  aa_score: number | null
  aa_passed: boolean | null
  aa_submitted_at: string | null
}

export type AssignmentDetail = {
  assignment: {
    asg_id: number
    asg_state: AssignmentState
    asg_due_at: string | null
    asg_ack_only: boolean
    asg_attempts_used: number
    asg_best_score: number | null
    asg_acknowledged_at: string | null
    asg_completed_at: string | null
    asg_assessment_passed_at: string | null
    is_overdue: boolean
  }
  module: { tm_id: number; tm_code: string | null }
  version: {
    mv_id: number
    mv_version_no: number
    mv_title: string
    mv_description: string | null
    mv_instructions: string | null
    mv_pass_mark: number
    mv_max_attempts: number
    mv_min_watch_percent: number
    mv_requires_ack: boolean
    mv_ack_text: string
    question_count: number
  }
  lessons: LessonDetail[]
  attempts: AttemptSummary[]
  steps: Steps
  shift?: ShiftAccess
}

export type Question = {
  q_id: number
  q_type: 'single' | 'multiple' | 'written'
  q_text: string
  q_marks: number
  options: { qo_id: number; qo_text: string }[]
}

export type AttemptPayload = {
  aa_id: number
  aa_attempt_no: number
  pass_mark: number
  max_attempts: number
  attempts_used: number
  questions: Question[]
}

export type AttemptResult = {
  aa_id: number
  score: number
  passed: boolean
  marks_obtained: number
  marks_total: number
  pass_mark: number
  attempts_used: number
  attempts_left: number | null
  failed: boolean
  review: {
    q_id: number
    q_text: string
    q_type: Question['q_type']
    is_correct: boolean | null
    explanation: string | null
    correct_option_ids: number[] | null
  }[]
}

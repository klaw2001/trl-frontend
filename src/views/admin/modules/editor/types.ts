import type { FileRow, Video } from '@/types/apiTypes'

export type VersionState = 'draft' | 'published' | 'superseded'

export type UpdateAction = 'none' | 'reacknowledge' | 'retrain'

export type ModuleDetail = {
  tm_id: number
  tm_code: string | null
  tm_category_id: number | null
  tm_language: string
  tm_brand_ids: number[]
  tm_role_ids: number[]
  tm_is_mandatory: boolean
  tm_sequence: number
  tm_prerequisite_id: number | null
  tm_due_days: number
  tm_current_version_id: number | null
  tm_archived: boolean
  draft_version_id: number | null
  editable_version_id: number | null
  versions: {
    mv_id: number
    mv_version_no: number
    mv_state: VersionState
    mv_title: string
    mv_update_action: UpdateAction
    mv_change_note: string | null
    mv_published_at: string | null
    mv_created_at: string
    mv_published_by: { user_first_name: string; user_last_name: string } | null
    _count: { assignments: number; lessons: number; questions: number }
  }[]
}

export type LessonRow = {
  lesson_id: number
  lesson_title: string
  lesson_content: string | null
  lesson_video_id: number | null
  lesson_sequence: number
  lesson_is_required: boolean
  lesson_min_watch_percent: number | null
  lesson_video: Video | null
  lesson_files: { lf_id: number; lf_file_id: number; lf_file: FileRow; url: string }[]
}

export type QuestionRow = {
  q_id: number
  q_type: 'single' | 'multiple' | 'written'
  q_text: string
  q_explanation: string | null
  q_marks: number
  q_sequence: number
  options: { qo_id: number; qo_text: string; qo_is_correct: boolean; qo_sequence: number }[]
}

export type VersionDetail = {
  mv_id: number
  mv_module_id: number
  mv_version_no: number
  mv_state: VersionState
  mv_title: string
  mv_description: string | null
  mv_instructions: string | null
  mv_min_watch_percent: number
  mv_pass_mark: number
  mv_max_attempts: number
  mv_question_limit: number | null
  mv_randomize_questions: boolean
  mv_randomize_options: boolean
  mv_requires_ack: boolean
  mv_ack_text: string
  mv_update_action: UpdateAction
  mv_change_note: string | null
  lessons: LessonRow[]
  questions: QuestionRow[]
}

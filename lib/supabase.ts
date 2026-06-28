import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Staff = {
  id: string
  name: string
  role: string
  active: boolean
  created_at: string
  weekoff_allowance?: string
}

export type Course = {
  id: string
  title_en: string
  title_te: string
  description_en: string
  description_te: string
  pass_threshold: number
  status: string
}

export type Assignment = {
  id: string
  course_id: string
  staff_id: string
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  assigned_at: string
  completed_at: string | null
  course?: Course
}

export type Content = {
  id: string
  type: 'jewellery_piece' | 'video' | 'document' | 'text'
  category: string
  title_en: string
  title_te: string
  body_en: string | null
  body_te: string | null
  photo_url: string | null
  audio_url: string | null
  video_url: string | null
  document_url: string | null
  transcript_en: string | null
  transcript_te: string | null
  has_quiz: boolean
  status: string
}

export type Quiz = {
  id: string
  content_id: string
  question_en: string
  question_te: string
  option_a_en: string
  option_a_te: string
  option_b_en: string
  option_b_te: string
  option_c_en: string | null
  option_c_te: string | null
  option_d_en: string | null
  option_d_te: string | null
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation_en: string | null
  explanation_te: string | null
  order_index: number
}

export type Progress = {
  id: string
  assignment_id: string
  staff_id: string
  content_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
}

export type Certificate = {
  id: string
  staff_id: string
  course_id: string
  assignment_id: string
  final_score: number | null
  issued_at: string
  certificate_url: string | null
}

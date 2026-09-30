PRAGMA foreign_keys = ON;

-- Completion marks only: no answers, attempts, or mid-activity state (see AGENTS.md).
CREATE TABLE activity_completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL CHECK (course_slug IN ('ode', 'fourier')),
  module_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  first_completed_at INTEGER NOT NULL,
  last_completed_at INTEGER NOT NULL,
  completion_count INTEGER NOT NULL DEFAULT 1 CHECK (completion_count >= 1),
  PRIMARY KEY (user_id, course_slug, module_id, activity_id)
);

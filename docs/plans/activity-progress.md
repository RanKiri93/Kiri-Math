# Activity progress tracking

Status: phase 1 implemented (2026-09-30). Decisions below were agreed with the course owner.

## Goal

A signed-in student sees, per course, which interactive activities they have finished.
Activities stay repeatable; re-entering an activity starts it fresh, and the completion
mark remains.

## Agreed decisions

1. **Persistence exception.** Completion marks are stored server-side, in the existing
   authentication database. This is the third narrow exception to the "no practice
   persistence" rule in `AGENTS.md`. Only completion is stored: no answers, no attempts,
   no mid-activity state.
2. **Reveals count.** An activity finished with the help of "הצגת תשובה" counts as
   completed. Whether to read the explanations is the student's choice; nothing records
   hint use.
3. **Scope.** Only activities with a defined end are tracked. Phase 1 covers the two
   function-sequences activities. Practice modes without an end (phase plane, constant
   coefficients, linear homogeneous) are not tracked. **Every new activity must be
   designed with a defined completion point** so it can be marked finished.
4. **"ההתקדמות שלי" page:** deferred (see backlog).
5. **Resetting progress:** not in phase 1 (see backlog).

## What counts as completion

| Activity | Registry id | Completion point |
| --- | --- | --- |
| התכנסות נקודתית ובמידה שווה | `function-sequences/convergence-lab` | Reaching the lab's finish view ("המסלול הושלם") |
| שימוש במבחן הסופרמום | `function-sequences/supremum-test` | Pressing "לסיום" on the last step of the last example |

## Phase 1 design (implemented)

- **Registry.** `CourseModule.activities` in each course's `course.ts` lists the trackable
  activities (`id`, `title`). An activity is identified by course, module id and activity id.
- **Table.** `activity_completions` (migration `drizzle/0001_activity_progress.sql`):
  user, course, module, activity, first/last completion time, completion count. Rows are
  deleted with the user.
- **Write.** `POST /api/progress/complete` with `{ course, module, activity }`. Same-origin
  only, requires a session, validates the activity against the registry and the user's
  course grant, idempotent upsert.
- **Read.** Server pages load the signed-in user's completions and pass them down: the
  chapter page shows "הושלמו k מתוך m פעילויות" on each module card that has activities;
  the function-sequences activity menu shows "הושלמה" with the date on each finished card.
- **Failure policy.** Progress never blocks learning. A failed write leaves the activity
  running and shows the mark for the current visit only; a failed read shows no marks.

## Backlog (not yet built — do not forget)

- **"ההתקדמות שלי" page per course.** Lists every tracked activity in the course with its
  status and last completion date, grouped by chapter and module.
- **Per-activity reset on that page.** Lets the student clear the mark for one activity.
  Needs a same-origin `DELETE`/`POST` endpoint scoped to the signed-in user.
- **Operator view/reset.** Optional `npm run auth -- progress <username>` for support.
- **Completion points for practice modules**, if and when they gain a defined end.

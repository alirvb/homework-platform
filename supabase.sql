-- ================================
-- سامانه مدیریت تکالیف - اسکیمای کامل
-- Homework Management Platform - Full DDL
-- ================================

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher','student')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(user_id) on delete cascade,
  class_name text not null,
  subject text not null default 'هنر',
  class_code text not null unique,
  created_at timestamptz default now()
);
create index if not exists idx_classes_teacher on public.classes(teacher_id);
create index if not exists idx_classes_code on public.classes(class_code);

-- Enrollments
create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(user_id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(class_id, student_id)
);
create index if not exists idx_enrollments_class on public.class_enrollments(class_id);
create index if not exists idx_enrollments_student on public.class_enrollments(student_id);

-- Assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  max_score integer not null default 20 check (max_score > 0),
  category text not null default 'regular' check (category in ('midterm','final','regular')),
  created_at timestamptz default now()
);
create index if not exists idx_assignments_class on public.assignments(class_id);

-- Submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(user_id) on delete cascade,
  file_urls text[] default '{}',
  student_notes text,
  status text not null default 'submitted' check (status in ('submitted','graded','late')),
  grade numeric check (grade >= 0),
  teacher_feedback text,
  submitted_at timestamptz default now(),
  graded_at timestamptz,
  unique(assignment_id, student_id)
);
create index if not exists idx_submissions_assignment on public.submissions(assignment_id);
create index if not exists idx_submissions_student on public.submissions(student_id);

-- Storage bucket for homework files
insert into storage.buckets (id, name, public) values ('homework-files','homework-files', true)
on conflict (id) do nothing;

-- ================================
-- Helper function: is teacher of class
-- ================================
create or replace function public.is_teacher_of_class(cid uuid)
returns boolean language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.classes where id = cid and teacher_id = auth.uid()) $$;

create or replace function public.is_enrolled_in_class(cid uuid)
returns boolean language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.class_enrollments where class_id = cid and student_id = auth.uid()) $$;

-- ================================
-- RLS
-- ================================
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- Profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- Classes
drop policy if exists "classes_select" on public.classes;
create policy "classes_select" on public.classes for select using (
  teacher_id = auth.uid() or exists (select 1 from public.class_enrollments where class_id = classes.id and student_id = auth.uid())
);
drop policy if exists "classes_insert_teacher" on public.classes;
create policy "classes_insert_teacher" on public.classes for insert with check (
  teacher_id = auth.uid() and exists (select 1 from public.profiles where user_id = auth.uid() and role='teacher')
);
drop policy if exists "classes_update_teacher" on public.classes;
create policy "classes_update_teacher" on public.classes for update using (teacher_id = auth.uid());
drop policy if exists "classes_delete_teacher" on public.classes;
create policy "classes_delete_teacher" on public.classes for delete using (teacher_id = auth.uid());

-- Enrollments
drop policy if exists "enrollments_select" on public.class_enrollments;
create policy "enrollments_select" on public.class_enrollments for select using (
  student_id = auth.uid() or public.is_teacher_of_class(class_id)
);
drop policy if exists "enrollments_insert" on public.class_enrollments;
create policy "enrollments_insert" on public.class_enrollments for insert with check (student_id = auth.uid());
drop policy if exists "enrollments_delete" on public.class_enrollments;
create policy "enrollments_delete" on public.class_enrollments for delete using (
  student_id = auth.uid() or public.is_teacher_of_class(class_id)
);

-- Assignments
drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select" on public.assignments for select using (
  public.is_teacher_of_class(class_id) or public.is_enrolled_in_class(class_id)
);
drop policy if exists "assignments_insert" on public.assignments;
create policy "assignments_insert" on public.assignments for insert with check (public.is_teacher_of_class(class_id));
drop policy if exists "assignments_update" on public.assignments;
create policy "assignments_update" on public.assignments for update using (public.is_teacher_of_class(class_id));
drop policy if exists "assignments_delete" on public.assignments;
create policy "assignments_delete" on public.assignments for delete using (public.is_teacher_of_class(class_id));

-- Submissions
drop policy if exists "submissions_select" on public.submissions;
create policy "submissions_select" on public.submissions for select using (
  student_id = auth.uid() or public.is_teacher_of_class((select class_id from public.assignments where id = assignment_id))
);
drop policy if exists "submissions_insert" on public.submissions;
create policy "submissions_insert" on public.submissions for insert with check (
  student_id = auth.uid() and public.is_enrolled_in_class((select class_id from public.assignments where id = assignment_id))
);
drop policy if exists "submissions_update_student" on public.submissions;
create policy "submissions_update_student" on public.submissions for update using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists "submissions_update_teacher" on public.submissions;
create policy "submissions_update_teacher" on public.submissions for update using (
  public.is_teacher_of_class((select class_id from public.assignments where id = assignment_id))
);

-- Storage policies
drop policy if exists "homework_files_select" on storage.objects;
create policy "homework_files_select" on storage.objects for select using (bucket_id='homework-files');
drop policy if exists "homework_files_insert" on storage.objects;
create policy "homework_files_insert" on storage.objects for insert with check (bucket_id='homework-files' and auth.role()='authenticated');
drop policy if exists "homework_files_update" on storage.objects;
create policy "homework_files_update" on storage.objects for update using (bucket_id='homework-files' and auth.role()='authenticated');
drop policy if exists "homework_files_delete" on storage.objects;
create policy "homework_files_delete" on storage.objects for delete using (bucket_id='homework-files' and auth.role()='authenticated');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'role','student'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

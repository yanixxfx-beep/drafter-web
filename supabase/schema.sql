create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists media_files (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind text not null check (kind in ('source','export','thumb')),
  bucket text not null,            -- 'user' | 'system'
  storage_key text not null,       -- path inside bucket
  mime text not null,
  bytes bigint not null,
  width int,
  height int,
  sha256 text,
  created_at timestamptz default now()
);

create table if not exists quotas (
  user_id text primary key,
  plan text not null default 'free',
  storage_bytes bigint not null default 0,
  storage_limit bigint not null default 10737418240 -- 10 GB
);

create index if not exists idx_media_workspace on media_files(workspace_id);
create index if not exists idx_media_owner on media_files(owner_id);
create index if not exists idx_media_created on media_files(created_at desc);

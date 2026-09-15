CREATE SCHEMA IF NOT EXISTS hme;
CREATE TABLE IF NOT EXISTS hme.migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS hme.admins (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hme.sessions (
  sid varchar PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON hme.sessions(expire);
CREATE TABLE IF NOT EXISTS hme.content (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('tensi','kegiatan','alumni','dosen','petinggi','divisi')),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_kind_idx ON hme.content(kind);
CREATE TABLE IF NOT EXISTS hme.settings (id boolean PRIMARY KEY DEFAULT true CHECK(id), data jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS hme.submissions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('alumni','anggota')),
  data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by integer REFERENCES hme.admins(id),
  published_id integer REFERENCES hme.content(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_member_nim ON hme.submissions ((data->>'nim')) WHERE kind = 'anggota';
CREATE TABLE IF NOT EXISTS hme.media (
  id uuid PRIMARY KEY,
  bytes bytea NOT NULL,
  mime text NOT NULL,
  created_by integer REFERENCES hme.admins(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

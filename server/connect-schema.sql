CREATE TABLE hme.connect_profiles (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id integer UNIQUE REFERENCES hme.admins(id) ON DELETE CASCADE,
  member_id integer UNIQUE REFERENCES hme.members(id) ON DELETE CASCADE,
  username varchar(32) NOT NULL UNIQUE,
  bio varchar(1000) NOT NULL DEFAULT '',
  headline varchar(160) NOT NULL DEFAULT '',
  company varchar(100) NOT NULL DEFAULT '',
  badges text[] NOT NULL DEFAULT '{}',
  avatar bytea CHECK (octet_length(avatar) <= 65536),
  avatar_version integer NOT NULL DEFAULT 0,
  tensi_seen_at timestamptz,
  CHECK (num_nonnulls(admin_id, member_id) = 1),
  CHECK (username ~ '^[a-z0-9_]{3,32}$'),
  CHECK (cardinality(badges) <= 5)
);
INSERT INTO hme.connect_profiles (admin_id, username) SELECT id, 'admin_' || id FROM hme.admins;
INSERT INTO hme.connect_profiles (member_id, username) SELECT id, 'member_' || id FROM hme.members;

CREATE TABLE hme.connect_posts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  category varchar(20) NOT NULL CHECK (category IN ('Beasiswa','Magang','Organisasi','Akademik','Info Kampus','TENSI','Alumni')),
  title varchar(180) NOT NULL CHECK (length(trim(title)) > 0),
  body varchar(10000) NOT NULL CHECK (length(trim(body)) > 0),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', title || ' ' || body)) STORED
);
CREATE INDEX connect_posts_author_idx ON hme.connect_posts(author_id, id DESC);
CREATE INDEX connect_posts_category_idx ON hme.connect_posts(category, id DESC);
CREATE INDEX connect_posts_search_idx ON hme.connect_posts USING gin(search_vector);

CREATE TABLE hme.connect_comments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id integer NOT NULL REFERENCES hme.connect_posts(id) ON DELETE CASCADE,
  author_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  body varchar(2000) NOT NULL CHECK (length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX connect_comments_post_idx ON hme.connect_comments(post_id, id DESC);
CREATE INDEX connect_comments_author_idx ON hme.connect_comments(author_id);

CREATE TABLE hme.connect_likes (
  post_id integer NOT NULL REFERENCES hme.connect_posts(id) ON DELETE CASCADE,
  profile_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY(post_id, profile_id)
);
CREATE INDEX connect_likes_profile_idx ON hme.connect_likes(profile_id);
CREATE TABLE hme.connect_saves (
  profile_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  post_id integer NOT NULL REFERENCES hme.connect_posts(id) ON DELETE CASCADE,
  PRIMARY KEY(profile_id, post_id)
);
CREATE INDEX connect_saves_post_idx ON hme.connect_saves(post_id);
CREATE TABLE hme.connect_shares (
  post_id integer NOT NULL REFERENCES hme.connect_posts(id) ON DELETE CASCADE,
  profile_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY(post_id, profile_id)
);
CREATE INDEX connect_shares_profile_idx ON hme.connect_shares(profile_id);
CREATE TABLE hme.connect_follows (
  follower_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  followed_id integer NOT NULL REFERENCES hme.connect_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY(follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
CREATE INDEX connect_follows_followed_idx ON hme.connect_follows(followed_id, follower_id);

-- Only the server database role may access these tables, including on Supabase.
ALTER TABLE hme.connect_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hme.connect_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hme.connect_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hme.connect_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hme.connect_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE hme.connect_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE hme.connect_follows ENABLE ROW LEVEL SECURITY;

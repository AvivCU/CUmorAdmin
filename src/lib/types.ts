export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_superadmin: boolean;
  updated_at: string;
};

export type Generation = {
  id: number;
  creator_id: string;
  author_name: string;
  prompt: string;
  caption: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
};

export type Vote = {
  id: number;
  generation_id: number;
  user_id: string;
  value: 1 | -1;
  created_at: string;
};

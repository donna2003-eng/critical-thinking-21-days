export type AvatarId = "seed" | "lamp" | "book" | "moon" | "compass" | "spark";

export type Profile = {
  id: string;
  nickname: string;
  avatar: AvatarId;
  edit_code?: string;
  created_at?: string;
  updated_at?: string;
};

export type Signup = {
  id: string;
  profile_id: string;
  nickname: string;
  avatar: AvatarId;
  days: string[];
  question: string | null;
  created_at: string;
  updated_at: string;
};

export type CourseContentType = "tool" | "method" | "case";

export type CourseContent = {
  id: string;
  type: CourseContentType;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ContentComment = {
  id: string;
  content_id: string;
  profile_id: string;
  nickname: string;
  avatar: AvatarId;
  body: string;
  created_at: string;
};

export type TopicCategory = "controversy" | "learning" | "relationship" | "career" | "other";

export type Topic = {
  id: string;
  profile_id: string;
  nickname: string;
  avatar: AvatarId;
  title: string;
  body: string;
  category: TopicCategory;
  is_anonymous: boolean;
  created_at: string;
};

export type TopicComment = {
  id: string;
  topic_id: string;
  profile_id: string;
  nickname: string;
  avatar: AvatarId;
  body: string;
  is_anonymous: boolean;
  created_at: string;
};

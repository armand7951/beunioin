export interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export function mapCourse(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    sortOrder: row.sort_order,
    lessonCount: row.lesson_count,
    totalDurationSec: row.total_duration_sec,
    expiresAt: row.expires_at ?? null,
    lessons: row.lessons ?? [],
  };
}

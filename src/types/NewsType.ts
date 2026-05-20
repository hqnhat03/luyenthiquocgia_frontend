export interface Article {
    id: number;
    title: string;
    content: string;
    image: string | null;
    slug: string;
    status: number;
    created_at: string;
    updated_at: string;
}

export interface News {
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    status: number;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number;
}


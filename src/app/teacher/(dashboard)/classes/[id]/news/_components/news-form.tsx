'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { AlertCircle, Image as ImageIcon, Loader2, Save, Send, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  content: z.string().min(1, 'Vui lòng nhập nội dung bản tin'),
});

type FormValues = z.infer<typeof formSchema>;

interface Author {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface ClassNews {
  id: number;
  class_id: number;
  content: string;
  file_url: string | null;
  is_pinned: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  author: Author;
}

interface NewsFormProps {
  onSuccess: () => void;
  editingAnnouncement: ClassNews | null;
  onCancelEdit: () => void;
  classId: number;
}

const getAvatarUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_IMAGE_URL || "";
  if (baseUrl) {
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  }
  return url.startsWith("/") ? url : `/${url}`;
};

export function NewsForm({
  onSuccess,
  editingAnnouncement,
  onCancelEdit,
  classId,
}: NewsFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    if (editingAnnouncement) {
      setSelectedFile(null);
      setIsImageRemoved(false);
      form.reset({
        content: editingAnnouncement.content,
      });
      setImagePreview(editingAnnouncement.file_url ? getAvatarUrl(editingAnnouncement.file_url) : null);
    } else {
      setSelectedFile(null);
      setIsImageRemoved(false);
      form.reset({
        content: '',
      });
      setImagePreview(null);
    }
  }, [editingAnnouncement, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsImageRemoved(false);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setImagePreview(null);
    setIsImageRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    form.reset({ content: '' });
    setSelectedFile(null);
    setImagePreview(null);
    setIsImageRemoved(false);
    if (editingAnnouncement) {
      onCancelEdit();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', values.content);

      if (editingAnnouncement) {
        formData.append('id', editingAnnouncement.id.toString());
        if (selectedFile) {
          formData.append('image', selectedFile);
        } else if (isImageRemoved) {
          formData.append('image', '');
        }
        
        await api.post(`/teacher/class-news/update`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Cập nhật bản tin thành công');
      } else {
        formData.append('class_id', classId.toString());
        if (selectedFile) {
          formData.append('image', selectedFile);
        }
        
        await api.post(`/teacher/class-news/create`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Đã đăng bản tin mới');
      }

      resetForm();
      onSuccess();
    } catch (error: unknown) {
      console.error('Submission error:', error);
      if (error instanceof AxiosError && error.response?.status === 422) {
        toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else {
        toast.error('Có lỗi xảy ra khi thực hiện thao tác');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-xl border border-border/40 rounded-xl p-4 shadow-lg shadow-black/5 transition-all duration-300">
      {editingAnnouncement && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-3 mb-4 text-xs font-bold uppercase tracking-wider animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 animate-pulse" />
            <span>Chế độ chỉnh sửa bản tin</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={resetForm}
            className="h-7 px-3 text-[10px] uppercase font-black tracking-widest text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
          >
            Hủy chỉnh sửa
          </Button>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
        {/* Left Column: Avatar & File Preview indicator */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-10 w-10 border border-border/40 shadow-sm">
            <AvatarImage src={user?.avatar ? getAvatarUrl(user.avatar) : ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
              {user?.name ? user.name.substring(0, 2) : 'GV'}
            </AvatarFallback>
          </Avatar>

          {/* Small Attached Image Preview on the Left */}
          {imagePreview && (
            <div className="relative h-12 w-12 rounded-lg overflow-hidden border-2 border-primary/20 bg-muted group shadow-md animate-in zoom-in-50 duration-300">
              <Image
                width={200}
                height={200}
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                title="Xóa ảnh"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Standard Textarea & Controls */}
        <div className="flex-1 space-y-3">
          <textarea
            {...form.register('content')}
            rows={3}
            placeholder="Bạn muốn chia sẻ điều gì với lớp học hôm nay?..."
            className="w-full bg-transparent border-0 focus:ring-0 placeholder:text-muted-foreground/60 text-sm font-medium resize-none outline-none py-1 min-h-[60px]"
          />
          {form.formState.errors.content && (
            <p className="text-xs font-bold text-destructive mt-1">
              {form.formState.errors.content.message}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/10">
            {/* Left Controls: Select File Icon */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground/80 hover:text-foreground transition-all duration-200"
                title="Đính kèm hình ảnh"
              >
                <ImageIcon className="size-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Right Controls: Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : editingAnnouncement ? (
                <Save className="mr-2 size-4" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              {editingAnnouncement ? 'Cập nhật' : 'Đăng bài'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

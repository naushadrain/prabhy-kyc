// src/components/DocumentUpload.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  classId: string;
  docType: string;
  docIdType: string;
  imageId?: string; // passport number for parent, or child identifier
  onUploadSuccess: (imageId: string, docIdType: string, imageName: string) => void;
  onUploadError?: (error: string) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  classId,
  docType,
  docIdType,
  imageId,
  onUploadSuccess,
  onUploadError,
  label = "Upload Document",
  accept = "image/*,.pdf",
  maxSize = 5, // 5MB default
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadedId(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Import dynamically to avoid circular dependencies
      const { uploadPolicyDocument } = await import('@/api/policy/uploadPolicyDoc');
      
      const imageName = `${docIdType}_${Date.now()}`; // Generate unique name
      
      const response = await uploadPolicyDocument(
        classId,
        docType as any,
        docIdType as any,
        imageName,
        file,
        imageId
      );

      if (response.process_result && response.image_id) {
        setUploadedId(response.image_id);
        onUploadSuccess(response.image_id, docIdType, imageName);
      } else {
        const errorMsg = response.error_list?.[0]?.error_message || 'Upload failed';
        setError(errorMsg);
        onUploadError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setUploadedId(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <div className="flex items-center gap-3">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="flex-1"
          disabled={uploading}
        />
        
        {file && !uploadedId && (
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={uploading}
            size="sm"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
        
        {file && (uploadedId || error) && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative w-32 h-32 border rounded-md overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Status */}
      {uploadedId && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Uploaded successfully (ID: {uploadedId})</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};